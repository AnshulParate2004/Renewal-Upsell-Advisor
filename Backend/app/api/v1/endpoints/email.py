"""
Email API endpoints for manual email sending and management.

Intent detection runs on every inbound reply (webhook + manual-reply).
After detecting intent the following actions are triggered automatically:

  not_interested_churn  → account marked churned
  renewed               → account marked active
  objection_no_money    → follow-up email scheduled (respects objectionFollowUpHours)
  renew_afterwards      → follow-up email scheduled in followUpDays
  needs_followup        → follow-up email scheduled in 1 day
  interested            → account last_contact_date updated (no extra action needed)
"""
from fastapi import APIRouter, HTTPException, Body, Request
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
import email.utils
import uuid
from datetime import datetime, timezone, timedelta
from app.core.logging import get_logger
from app.services.email.email_service import email_service
from app.services.email.scheduler import (
    send_scheduled_emails, send_email_to_single_account,
    generate_email_preview_for_account, get_supabase_client,
    get_email_interval_days, _get_app_settings_config,
)
import os

env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

from app.services.voice_agent.azure_openai import azure_openai
from app.services.activity_log import log_activity
from app.services.ml.sentiment_analyzer import SentimentAnalyzer

_email_sentiment_analyzer = SentimentAnalyzer()

logger = get_logger(__name__)
router = APIRouter()

VALID_INTENTS = [
    'renewed', 'renew_afterwards',
    'churned', 'needs_followup', 'completed'
]


# ─────────────────────────────────────────────────────────────────────────────
# HELPER — run LLM sentiment on email reply body, save to DB
# ─────────────────────────────────────────────────────────────────────────────
def _run_email_sentiment(client, account_id: str, body_text: str, sent_at_iso: str) -> dict:
    """
    Run LLM sentiment analysis on the customer's email reply body.
    Mirrors _run_sentiment_and_save() from voice_calls.py.

    Returns sentiment dict: {sentiment_score, sentiment_category, keywords}
    """
    default = {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}
    text = (body_text or "").strip()
    if len(text) < 5:
        logger.warning("[EMAIL-SENTIMENT] Body too short — returning neutral default.")
        return default

    try:
        logger.info(f"[EMAIL-SENTIMENT] ▶ Running LLM sentiment. text length={len(text)}")
        result = _email_sentiment_analyzer.predict(text)
        # SentimentAnalyzer.predict() returns {sentiment_score, label, confidence, keywords}
        # Normalise to the same schema voice calls use
        sentiment_data = {
            "sentiment_score":    result.get("sentiment_score", 0.0),
            "sentiment_category": result.get("label", "neutral"),
            "keywords":           result.get("keywords", []),
        }
        logger.info(
            f"[EMAIL-SENTIMENT] ✅ score={sentiment_data['sentiment_score']}, "
            f"category={sentiment_data['sentiment_category']}, keywords={sentiment_data['keywords']}"
        )

        # ── Persist to sentiment_analysis table ───────────────────────────
        try:
            client.table("sentiment_analysis").insert({
                "account_id":         account_id,
                "analysis_date":      sent_at_iso[:10],
                "sentiment_score":    sentiment_data["sentiment_score"],
                "sentiment_category": sentiment_data["sentiment_category"],
                "source":             "email",
                "text_analyzed":      text[:2000],
                "keywords":           sentiment_data["keywords"],
            }).execute()
        except Exception as e:
            logger.error(f"[EMAIL-SENTIMENT] sentiment_analysis insert error: {e}")

        # ── Update accounts table ─────────────────────────────────────────
        try:
            client.table("accounts").update({
                "sentiment_score":    sentiment_data["sentiment_score"],
                "sentiment_category": sentiment_data["sentiment_category"],
            }).eq("id", account_id).execute()
        except Exception as e:
            logger.error(f"[EMAIL-SENTIMENT] accounts update error: {e}")

        return sentiment_data

    except Exception as e:
        logger.error(f"[EMAIL-SENTIMENT] ❌ Sentiment analysis failed: {e}", exc_info=True)
        return default


# ─────────────────────────────────────────────────────────────────────────────
# SHARED HELPER — detect intent + trigger all follow-up actions
# ─────────────────────────────────────────────────────────────────────────────
def _detect_intent_and_act(
    client,
    account_id: str,
    account_name: str,
    subject: str,
    body_text: str,
    sent_at_iso: str,
) -> dict:
    """
    1. Run LLM intent detection with full debug logging.
    2. Run LLM sentiment analysis on the reply body.
    3. Update account status if needed.
    4. Schedule follow-up email based on intent.
    Returns dict: {"intent": str, "sentiment": dict}
    """
    # ── Step 1: LLM intent detection ─────────────────────────────────────
    logger.info(f"[EMAIL-INTENT] ▶ account={account_name}, subject={subject!r}")
    logger.info(f"[EMAIL-INTENT] Body preview: {body_text[:300]}")

    system_msg = (
        "You are an expert intent classification AI. Analyze the email reply and determine "
        "the customer's renewal intent. Output EXACTLY ONE of these strings — nothing else:\n"
        "renewed (customer agreed to renew)\n"
        "renew_afterwards (customer wants to delay or renew later)\n"
        "churned (customer is cancelling, not interested, or has no budget)\n"
        "needs_followup (customer has an issue or question)\n"
        "completed (general reply, no action needed)"
    )
    prompt = [
        {"role": "system", "content": system_msg},
        {"role": "user",   "content": f"Subject: {subject}\n\nBody: {body_text}"}
    ]

    intent_result = "completed"
    try:
        raw = azure_openai.chat_completion(prompt, temperature=0.1, max_tokens=10)
        logger.info(f"[EMAIL-INTENT] ✅ LLM raw response: {raw!r}")
        cleaned = raw.strip().lower()
        if cleaned in VALID_INTENTS:
            intent_result = cleaned
            logger.info(f"[EMAIL-INTENT] ✅ Final intent = '{intent_result}'")
        else:
            logger.warning(f"[EMAIL-INTENT] ⚠️  '{cleaned}' not in valid list — defaulting to 'completed'")
    except Exception as e:
        logger.error(f"[EMAIL-INTENT] ❌ LLM call failed: {e}", exc_info=True)

    # ── Step 2: Sentiment analysis ────────────────────────────────────────
    sentiment_data = _run_email_sentiment(client, account_id, body_text, sent_at_iso)

    # ── Step 3: Account status update ────────────────────────────────────
    try:
        acc_update: dict = {"last_contact_date": sent_at_iso}
        if intent_result == "churned":
            # Redefined: Expressing intent to churn during contract marks account as CRITICAL (at_risk, 99)
            # Churned status is now reserved for actual contract expiry.
            acc_update.update({
                "status": "at_risk",
                "risk_score": 99,
                "health_score": 0,
                "churn_probability": 0.85,
            })
            logger.info(f"[EMAIL-INTENT] 🚨 Account {account_id} marked CRITICAL (AT_RISK) and risk set to 99")
        elif intent_result == "renewed":
            # Redefined: Stay in "renewed" status until contract turnover.
            acc_update["status"] = "renewed"
            logger.info(f"[EMAIL-INTENT] ✅ Account {account_id} marked RENEWED")
        client.table("accounts").update(acc_update).eq("id", account_id).execute()
    except Exception as e:
        logger.error(f"[EMAIL-INTENT] Failed to update account status: {e}")

    # ── Step 4: Schedule follow-up email ─────────────────────────────────
    try:
        cfg        = _get_app_settings_config(client)
        schedule   = cfg.get("schedule") or {}
        follow_up_days  = get_email_interval_days(client)          # default 7
        objection_hours = int(schedule.get("objectionFollowUpHours", 24))

        followup_at  = None
        followup_reason = None

        if intent_result == "renew_afterwards":
            followup_at     = (datetime.now(timezone.utc) + timedelta(days=follow_up_days)).isoformat()
            followup_reason = f"Customer wants to renew later — follow up in {follow_up_days}d"

        elif intent_result == "needs_followup":
            followup_at     = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            followup_reason = "Customer has an issue/question — follow up in 1d"

        elif intent_result == "churned":
            # [REMOVED] Churn win-back automation disabled per user request.
            pass

        if followup_at:
            client.table("email_campaigns").insert({
                "account_id":    account_id,
                "campaign_type": "scheduled_followup",
                "subject":       f"[SCHEDULED] Follow-up for {account_name}",
                "sent_at":       followup_at,
                "status":        "scheduled",
                "metadata": {
                    "reason":            followup_reason,
                    "triggered_by":      "email_reply",
                    "original_intent":   intent_result,
                    "scheduled_at":      followup_at,
                    "account_id":        str(account_id),
                    "account_name":      account_name,
                }
            }).execute()
            logger.info(f"[EMAIL-INTENT] 📅 Follow-up email scheduled: {followup_reason} at {followup_at}")

    except Exception as e:
        logger.error(f"[EMAIL-INTENT] Failed to schedule follow-up: {e}", exc_info=True)

    return {"intent": intent_result, "sentiment": sentiment_data}


# ─────────────────────────────────────────────────────────────────────────────
# WEBHOOK — real SendGrid Inbound Parse replies
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/webhook")
async def email_webhook(request: Request):
    """Handle incoming email replies via SendGrid Inbound Parse."""
    try:
        form          = await request.form()
        from_email_raw = form.get("from", "")
        body_text      = form.get("text", "") or ""
        body_html      = form.get("html", "") or ""
        subject        = form.get("subject", "") or ""

        _, from_email = email.utils.parseaddr(str(from_email_raw))
        if not from_email:
            return {"status": "ignored", "reason": "No valid from address"}

        client = get_supabase_client()
        if not client:
            return {"status": "error", "reason": "Supabase not configured"}

        # Find account by email
        acc_res = client.table("accounts").select("id, name").or_(
            f"primary_contact_email.eq.{from_email},csm_email.eq.{from_email}"
        ).limit(1).execute()

        if not acc_res.data:
            logger.info(f"[WEBHOOK] Incoming email from {from_email} — no matching account.")
            return {"status": "ignored", "reason": "Unrecognized sender"}

        account    = acc_res.data[0]
        account_id = account["id"]
        sent_at_iso = datetime.now(timezone.utc).isoformat()

        logger.info(f"[WEBHOOK] Reply from {from_email} matched account '{account['name']}'")

        # ── Detect intent + act ───────────────────────────────────────────
        act_result = _detect_intent_and_act(
            client, account_id, account["name"], subject, body_text, sent_at_iso
        )
        intent_result = act_result["intent"]

        # ── Save inbound reply row ────────────────────────────────────────
        email_id = str(uuid.uuid4())
        metadata = {
            "direction":       "inbound",
            "detected_intent": intent_result,
            "sender_email":    from_email,
            "html_body":       str(body_html),
            "account_id":      str(account_id),
            "sent_at":         sent_at_iso,
        }
        metadata.update(act_result["sentiment"])
        try:
            client.table("email_campaigns").insert({
                "id": email_id, "account_id": account_id,
                "campaign_type": "inbound_reply",
                "subject": str(subject), "body": str(body_text),
                "sent_at": sent_at_iso, "replied_at": sent_at_iso,
                "status": "received", "metadata": metadata
            }).execute()
        except Exception as e:
            logger.error(f"[WEBHOOK] Insert failed: {e} — trying fallback")
            try:
                client.table("email_campaigns").insert({
                    "id": email_id, "account_id": account_id,
                    "campaign_type": "inbound_reply",
                    "subject": f"REPLY: {subject[:100]}",
                    "sent_at": sent_at_iso, "status": "received",
                }).execute()
            except Exception as e2:
                logger.error(f"[WEBHOOK] Fallback also failed: {e2}")

        # ── Mark outbound email as replied ────────────────────────────────
        try:
            outbound = client.table("email_campaigns").select("id").eq("account_id", account_id).eq("status","sent").order("sent_at", desc=True).limit(1).execute()
            if outbound.data:
                client.table("email_campaigns").update({"replied_at": sent_at_iso, "status": "replied"}).eq("id", outbound.data[0]["id"]).execute()
        except Exception as e:
            logger.warning(f"[WEBHOOK] Could not update replied_at: {e}")

        try:
            log_activity("email_received", account_id=account_id,
                title=f"Received email reply from {account['name']}",
                details={"intent": intent_result, "subject": str(subject)})
        except Exception:
            pass

        logger.info(f"[WEBHOOK] ✅ Done. intent={intent_result}, account={account['name']}")
        return {"status": "success", "detected_intent": intent_result}

    except Exception as e:
        logger.error(f"[WEBHOOK] Unexpected error: {e}", exc_info=True)
        return {"status": "error", "reason": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# RESEND INBOUND — real customer replies via Resend inbound routing (JSON format)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/inbound")
async def email_inbound_resend(request: Request):
    """
    Handle incoming email replies forwarded by Resend inbound routing.
    Resend sends JSON (not SendGrid form-data).
    Configure in Resend Dashboard → Inbound → Webhook URL → this endpoint.
    """
    try:
        data = await request.json()
    except Exception:
        # Fallback: try form data (compatible with older Resend webhooks)
        try:
            form = await request.form()
            data = dict(form)
        except Exception as e:
            return {"status": "error", "reason": f"Could not parse request body: {e}"}

    try:
        # Resend inbound JSON fields
        from_raw  = data.get("from", "")
        subject   = data.get("subject", "") or ""
        body_text = data.get("text", "") or data.get("plain_text", "") or ""
        body_html = data.get("html", "") or ""

        # Parse sender address  (could be "Name <email>" format)
        _, from_email = email.utils.parseaddr(str(from_raw))
        if not from_email:
            logger.info(f"[INBOUND] No valid from address in payload: {from_raw!r}")
            return {"status": "ignored", "reason": "No valid from address"}

        client = get_supabase_client()
        if not client:
            return {"status": "error", "reason": "Supabase not configured"}

        # Find account by sender email
        acc_res = client.table("accounts").select("id, name").or_(
            f"primary_contact_email.eq.{from_email},contact_email.eq.{from_email},csm_email.eq.{from_email}"
        ).limit(1).execute()

        if not acc_res.data:
            logger.info(f"[INBOUND] Email from {from_email} — no matching account.")
            return {"status": "ignored", "reason": "Unrecognized sender"}

        account     = acc_res.data[0]
        account_id  = account["id"]
        sent_at_iso = datetime.now(timezone.utc).isoformat()

        logger.info(f"[INBOUND] Reply from {from_email} matched account '{account['name']}'")

        # Detect intent + trigger follow-up actions
        act_result = _detect_intent_and_act(
            client, account_id, account["name"], subject, body_text, sent_at_iso
        )
        intent_result = act_result["intent"]

        # Save inbound reply row
        email_id = str(uuid.uuid4())
        metadata = {
            "direction":       "inbound",
            "detected_intent": intent_result,
            "sender_email":    from_email,
            "html_body":       str(body_html),
            "account_id":      str(account_id),
            "sent_at":         sent_at_iso,
        }
        metadata.update(act_result["sentiment"])
        try:
            client.table("email_campaigns").insert({
                "id": email_id, "account_id": account_id,
                "campaign_type": "inbound_reply",
                "subject": str(subject), "body": str(body_text),
                "sent_at": sent_at_iso, "replied_at": sent_at_iso,
                "status": "received", "metadata": metadata
            }).execute()
        except Exception as e:
            logger.error(f"[INBOUND] Insert failed: {e}")

        # Mark latest outbound email as replied
        try:
            outbound = client.table("email_campaigns").select("id").eq("account_id", account_id).eq("status", "sent").order("sent_at", desc=True).limit(1).execute()
            if outbound.data:
                client.table("email_campaigns").update({"replied_at": sent_at_iso, "status": "replied"}).eq("id", outbound.data[0]["id"]).execute()
        except Exception as e:
            logger.warning(f"[INBOUND] Could not update replied_at: {e}")

        try:
            log_activity("email_received", account_id=account_id,
                title=f"Received email reply from {account['name']}",
                details={"intent": intent_result, "subject": str(subject), "source": "resend_inbound"})
        except Exception:
            pass

        logger.info(f"[INBOUND] ✅ Done. intent={intent_result}, account={account['name']}")
        return {"status": "success", "detected_intent": intent_result}

    except Exception as e:
        logger.error(f"[INBOUND] Unexpected error: {e}", exc_info=True)
        return {"status": "error", "reason": str(e)}




# ─────────────────────────────────────────────────────────────────────────────
# MANUAL REPLY — simulate reply from UI (dev/demo)
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/manual-reply")
async def manual_reply(body: dict):
    """
    Simulate an inbound email reply from the UI.
    Body: { "account_id": "<uuid>", "reply_text": "...", "subject": "Re: ..." }
    """
    account_id = (body or {}).get("account_id")
    reply_text = (body or {}).get("reply_text", "")
    subject    = (body or {}).get("subject", "Re: Email")

    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")

    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    acc_res = client.table("accounts").select("id, name").eq("id", account_id).limit(1).execute()
    if not acc_res.data:
        raise HTTPException(status_code=404, detail="Account not found")

    account     = acc_res.data[0]
    sent_at_iso = datetime.now(timezone.utc).isoformat()

    logger.info(f"[MANUAL-REPLY] Simulating reply for account '{account['name']}'")

    # ── Detect intent + act ───────────────────────────────────────────────
    act_result = _detect_intent_and_act(
        client, account_id, account["name"], subject, reply_text, sent_at_iso
    )
    intent_result = act_result["intent"]

    # ── Save inbound reply row ────────────────────────────────────────────
    email_id = str(uuid.uuid4())
    metadata = {
        "direction":       "inbound",
        "detected_intent": intent_result,
        "account_id":      str(account_id),
        "account_name":    account["name"],
        "subject":         str(subject),
        "body":            str(reply_text),
        "sent_at":         sent_at_iso,
        "replied_at":      sent_at_iso,
        "manual_ingestion": True,
    }
    metadata.update(act_result["sentiment"])
    try:
        client.table("email_campaigns").insert({
            "id": email_id, "account_id": account_id,
            "campaign_type": "inbound_reply",
            "subject": str(subject), "body": str(reply_text),
            "sent_at": sent_at_iso, "replied_at": sent_at_iso,
            "status": "received", "metadata": metadata
        }).execute()
    except Exception as e:
        logger.error(f"[MANUAL-REPLY] Insert failed: {e} — trying fallback")
        try:
            client.table("email_campaigns").insert({
                "id": email_id, "account_id": account_id,
                "campaign_type": "inbound_reply",
                "subject": f"REPLY: {subject[:100]}",
                "sent_at": sent_at_iso, "status": "received",
            }).execute()
        except Exception as e2:
            logger.error(f"[MANUAL-REPLY] Fallback failed: {e2}")
            raise HTTPException(status_code=500, detail=f"DB insert failed: {str(e)}")

    # ── Mark outbound email as replied ────────────────────────────────────
    try:
        outbound = client.table("email_campaigns").select("id").eq("account_id", account_id).eq("status","sent").order("sent_at", desc=True).limit(1).execute()
        if outbound.data:
            client.table("email_campaigns").update({"replied_at": sent_at_iso, "status": "replied"}).eq("id", outbound.data[0]["id"]).execute()
    except Exception as e:
        logger.warning(f"[MANUAL-REPLY] Could not update replied_at: {e}")

    try:
        log_activity("email_received", account_id=account_id,
            title=f"Received email reply from {account['name']}",
            details={"intent": intent_result, "subject": str(subject), "manual": True})
    except Exception:
        pass

    logger.info(f"[MANUAL-REPLY] ✅ Done. intent={intent_result}, account={account['name']}")
    return {
        "status": "success",
        "account": account["name"],
        "detected_intent": intent_result,
        "message": "Reply recorded and follow-up actions triggered."
    }


@router.post("/send-test")
async def send_test_email(to_email: str):
    email_service.reload_config()
    if not email_service.is_configured:
        raise HTTPException(status_code=503, detail="Email service not configured. Open Settings → Email & Resend.")
    subject   = "Test Email - Renewal & Upsell Advisor"
    html_body = "<html><body><h1>Test Email</h1><p>Your email configuration is working correctly!</p></body></html>"
    text_body = "Test Email\n\nYour email configuration is working correctly!"
    success   = email_service.send_email(to_email, subject, html_body, text_body)
    if success:
        return {"status": "success", "message": f"Test email sent to {to_email}"}
    raise HTTPException(status_code=500, detail="Failed to send test email")


@router.post("/trigger-campaign")
async def trigger_email_campaign(body: Optional[dict] = Body(None)):
    purpose = (body or {}).get("purpose") if isinstance(body, dict) else None
    purpose = str(purpose).strip() or None
    try:
        await send_scheduled_emails(purpose=purpose)
        return {"status": "success", "message": "Email campaign triggered successfully"}
    except Exception as e:
        logger.error(f"Error triggering email campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger email campaign: {str(e)}")


@router.get("/preview")
async def get_email_preview(account_id: str, purpose: Optional[str] = None):
    result = await generate_email_preview_for_account(account_id, purpose=purpose or None)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ─────────────────────────────────────────────────────────────────────────────
# SENTIMENT — fetch latest email sentiment from sentiment_analysis table
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/sentiment/{account_id}")
async def get_email_sentiment(account_id: str):
    """
    Return the latest sentiment analysis entry for this account where source='email'.
    Mirrors how voice call detail surfaces sentiment from voice_calls.metadata.
    Falls back to account-level fields if no email-specific row exists.
    """
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")

    # 1. Try sentiment_analysis table (source=email, most recent first)
    try:
        sa_res = (
            client.table("sentiment_analysis")
            .select("sentiment_score, sentiment_category, keywords, analysis_date")
            .eq("account_id", account_id)
            .eq("source", "email")
            .order("analysis_date", desc=True)
            .limit(1)
            .execute()
        )
        if sa_res.data:
            row = sa_res.data[0]
            return {
                "source": "sentiment_analysis",
                "sentiment_score":    row.get("sentiment_score"),
                "sentiment_category": row.get("sentiment_category") or "neutral",
                "keywords":           row.get("keywords") or [],
                "analysis_date":      row.get("analysis_date"),
            }
    except Exception as e:
        logger.warning(f"[EMAIL-SENTIMENT-GET] sentiment_analysis query failed: {e}")

    # 2. Fallback: latest inbound reply metadata in email_campaigns
    try:
        reply_res = (
            client.table("email_campaigns")
            .select("metadata, sent_at")
            .eq("account_id", account_id)
            .eq("status", "received")
            .order("sent_at", desc=True)
            .limit(1)
            .execute()
        )
        if reply_res.data:
            meta = reply_res.data[0].get("metadata") or {}
            if meta.get("sentiment_category"):
                return {
                    "source": "email_campaigns_metadata",
                    "sentiment_score":    meta.get("sentiment_score"),
                    "sentiment_category": meta.get("sentiment_category") or "neutral",
                    "keywords":           meta.get("keywords") or [],
                    "analysis_date":      (reply_res.data[0].get("sent_at") or "")[:10],
                }
    except Exception as e:
        logger.warning(f"[EMAIL-SENTIMENT-GET] email_campaigns fallback failed: {e}")

    # 3. Final fallback: account-level fields
    try:
        acc_res = (
            client.table("accounts")
            .select("sentiment_score, sentiment_category")
            .eq("id", account_id)
            .limit(1)
            .execute()
        )
        if acc_res.data:
            row = acc_res.data[0]
            return {
                "source": "accounts",
                "sentiment_score":    row.get("sentiment_score"),
                "sentiment_category": row.get("sentiment_category") or "neutral",
                "keywords":           [],
                "analysis_date":      None,
            }
    except Exception as e:
        logger.warning(f"[EMAIL-SENTIMENT-GET] accounts fallback failed: {e}")

    return {
        "source": "none",
        "sentiment_score":    None,
        "sentiment_category": "neutral",
        "keywords":           [],
        "analysis_date":      None,
    }


# ─────────────────────────────────────────────────────────────────────────────
# REANALYZE — manually re-run LLM sentiment on a specific account's latest reply
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/reanalyze/{account_id}")
async def reanalyze_email_sentiment(account_id: str):
    """
    Manually re-run LLM sentiment on the most recent inbound email reply
    for the given account.

    Steps:
      1. Find the latest inbound reply (campaign_type=inbound_reply or status=received).
      2. Re-run _run_email_sentiment() on its body.
      3. Patch the email_campaigns metadata row with the new result.
      4. Return the new sentiment data.
    """
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        # ── 1. Verify account exists ──────────────────────────────────────
        acc_res = client.table("accounts").select("id, name").eq("id", account_id).limit(1).execute()
        if not acc_res.data:
            raise HTTPException(status_code=404, detail="Account not found")
        account_name = acc_res.data[0]["name"]

        # ── 2. Find latest inbound reply for this account ─────────────────
        reply_res = (
            client.table("email_campaigns")
            .select("id, body, sent_at, metadata")
            .eq("account_id", account_id)
            .eq("campaign_type", "inbound_reply")
            .order("sent_at", desc=True)
            .limit(1)
            .execute()
        )
        if not reply_res.data:
            raise HTTPException(
                status_code=404,
                detail=f"No inbound email reply found for account '{account_name}'"
            )

        reply = reply_res.data[0]
        body_text  = (reply.get("body") or "").strip()
        sent_at    = reply.get("sent_at") or datetime.now(timezone.utc).isoformat()
        campaign_id = reply["id"]

        if len(body_text) < 5:
            raise HTTPException(status_code=400, detail="Reply body is too short to analyse")

        # ── 3. Re-run LLM sentiment ───────────────────────────────────────
        logger.info(f"[REANALYZE-EMAIL] account={account_name} campaign={campaign_id}")
        sentiment_data = _run_email_sentiment(client, account_id, body_text, sent_at)

        # ── 4. Patch the email_campaigns metadata row ─────────────────────
        existing_meta = reply.get("metadata") or {}
        existing_meta.update({
            "sentiment_score":    sentiment_data["sentiment_score"],
            "sentiment_category": sentiment_data["sentiment_category"],
            "keywords":           sentiment_data["keywords"],
            "reanalyzed_at":      datetime.now(timezone.utc).isoformat(),
        })
        try:
            client.table("email_campaigns").update({"metadata": existing_meta}).eq("id", campaign_id).execute()
        except Exception as patch_err:
            logger.error(f"[REANALYZE-EMAIL] Failed to patch campaign metadata: {patch_err}")

        logger.info(
            f"[REANALYZE-EMAIL] ✅ Done — score={sentiment_data['sentiment_score']}, "
            f"category={sentiment_data['sentiment_category']}"
        )
        return {
            "status": "success",
            "account": account_name,
            "sentiment": sentiment_data,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[REANALYZE-EMAIL] Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Re-analysis failed: {str(e)}")
@router.post("/send-to-account")
async def send_email_to_account(body: dict):
    account_id = body.get("account_id") if isinstance(body, dict) else None
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    subject   = body.get("subject")   if isinstance(body, dict) else None
    html_body = body.get("html_body") if isinstance(body, dict) else None
    text_body = body.get("text_body") if isinstance(body, dict) else None
    purpose   = body.get("purpose")   if isinstance(body, dict) else None
    result = await send_email_to_single_account(account_id, subject=subject, html_body=html_body, text_body=text_body, purpose=purpose)
    if result.get("success"):
        return {"status": "success", "message": result.get("message","Email sent."), "email_type": result.get("email_type")}
    raise HTTPException(status_code=400, detail=result.get("error","Failed to send email"))


@router.get("/campaigns")
async def get_email_campaigns(skip: int = 0, limit: int = 100):
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        res = client.table("email_campaigns").select("*, accounts(id, name)").order("sent_at", desc=True).range(skip, skip + limit - 1).execute()
        return {"campaigns": res.data or [], "total": len(res.data or [])}
    except Exception as e:
        logger.error(f"Error fetching email campaigns: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch email campaigns")


@router.get("/status")
async def get_email_status():
    email_service.reload_config()
    return {
        "configured":   email_service.is_configured,
        "from_email":   email_service.from_email   if email_service.is_configured else None,
        "from_name":    email_service.from_name    if email_service.is_configured else None,
        "has_resend":   bool(email_service.resend_api_key)
    }


@router.post("/poll-inbound")
async def trigger_inbound_poll():
    """Manually trigger an immediate Resend inbound email poll."""
    try:
        from app.services.email.resend_inbound_poller import poll_resend_inbound_once
        new_count = await poll_resend_inbound_once()
        msg = f"Resend inbound poll completed. Found {new_count} new replies."
        if new_count == 0:
            msg = "Resend inbound poll completed. No new replies found."
        
        return {"status": "success", "message": msg, "new_count": new_count}
    except Exception as e:
        logger.error(f"Manual inbound poll failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Poll failed: {str(e)}")


@router.get("/debug-inbound")
async def debug_inbound():
    """
    DEBUG: Returns raw Resend received emails (with body), duplicate email detection,
    and what was already stored in email_campaigns.
    """
    result: dict = {}

    try:
        from app.services.email.resend_inbound_poller import _get_resend_api_key
        import resend as _resend

        api_key = _get_resend_api_key()
        result["api_key_found"] = bool(api_key)

        if api_key:
            _resend.api_key = api_key

            # 1. List received emails
            raw = _resend.Emails.Receiving.list()
            if isinstance(raw, dict):
                email_list = raw.get("data") or []
            elif hasattr(raw, "data"):
                email_list = raw.data or []
            else:
                email_list = list(raw) if raw else []

            result["email_count"] = len(email_list)
            emails_detail = []

            for em in email_list:
                if not isinstance(em, dict):
                    em = vars(em)
                rid = em.get("id", "")
                # Fetch full body
                body_text = ""
                body_keys = []
                try:
                    full = _resend.Emails.Receiving.get(email_id=rid)
                    if not isinstance(full, dict):
                        full = vars(full)
                    body_text = (full.get("text") or full.get("plain_text") or full.get("html") or "")[:300]
                    body_keys = list(full.keys())
                except Exception as be:
                    body_text = f"[could not fetch: {be}]"

                emails_detail.append({
                    "id": rid,
                    "from": em.get("from"),
                    "subject": em.get("subject"),
                    "body_snippet": body_text,
                    "full_email_keys": body_keys,
                })

            result["emails"] = emails_detail

    except Exception as e:
        result["resend_error"] = str(e)

    # 2. Check for duplicate primary_contact_email in accounts
    try:
        client = get_supabase_client()
        if client:
            accs = client.table("accounts").select("id, name, primary_contact_email, csm_email").execute()
            accounts = accs.data or []
            result["total_accounts"] = len(accounts)

            # Group by email to detect duplicates
            from collections import defaultdict
            email_to_accounts: dict = defaultdict(list)
            for a in accounts:
                pe = (a.get("primary_contact_email") or "").strip()
                if pe:
                    email_to_accounts[pe].append(a.get("name"))

            duplicates = {e: names for e, names in email_to_accounts.items() if len(names) > 1}
            result["duplicate_emails"] = duplicates
            result["all_primary_emails"] = {a.get("name"): (a.get("primary_contact_email") or "").strip() for a in accounts}

            # 3. What's already in email_campaigns (last 10)
            campaigns = client.table("email_campaigns").select("id, account_id, campaign_type, subject, body, status, sent_at, metadata").order("sent_at", desc=True).limit(10).execute()
            result["recent_campaigns"] = [
                {
                    "type": c.get("campaign_type"),
                    "subject": c.get("subject"),
                    "body_snippet": (c.get("body") or "")[:100],
                    "status": c.get("status"),
                    "intent": (c.get("metadata") or {}).get("detected_intent"),
                    "sent_at": c.get("sent_at"),
                }
                for c in (campaigns.data or [])
            ]
    except Exception as e:
        result["supabase_error"] = str(e)

    return result

