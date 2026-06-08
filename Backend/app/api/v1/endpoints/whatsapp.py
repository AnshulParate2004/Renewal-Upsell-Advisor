"""
WhatsApp chatbot endpoints.

- /whatsapp/webhook : Twilio webhook for inbound WhatsApp messages (two-way bot).
- /whatsapp/send-to-account : Manual trigger from frontend to send an AI-generated WhatsApp message to an account.
"""
from typing import Optional, Dict, Any, List

from fastapi import APIRouter, Depends, Form, HTTPException
from fastapi import Request
from fastapi.responses import PlainTextResponse

from app.core.logging import get_logger
from app.api.v1.endpoints.accounts import get_supabase_client  # reuse helper
from app.services.voice_agent.azure_openai import azure_openai
from app.services.whatsapp.whatsapp_service import whatsapp_service
from app.services.activity_log import log_activity

logger = get_logger(__name__)
router = APIRouter()


MAX_CONTEXT_MESSAGES = 10


@router.get("/conversations")
async def get_whatsapp_conversations(skip: int = 0, limit: int = 100):
    """Fetch WhatsApp conversation history."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        res = client.table("whatsapp_conversations").select("*").order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        return {"conversations": res.data or [], "total": len(res.data or [])}
    except Exception as e:
        logger.error(f"Error fetching whatsapp convos: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch conversations")


def _build_chat_messages(history: List[Dict[str, Any]], account_context: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
    """
    Convert conversation rows into Azure OpenAI chat messages.
    history: list of {direction, message} sorted oldest->newest.
    """
    csm_name = (account_context or {}).get("csm_name") or "your Renewal & Upsell Account Manager"
    account_name = (account_context or {}).get("name") or "the Customer"
    contact_name = (account_context or {}).get("primary_contact_name") or "there"
    status = (account_context or {}).get("status") or "active"
    health = (account_context or {}).get("health_score") or "N/A"
    renewal_date = (account_context or {}).get("renewal_date") or "approaching"

    system_content = (
        f"You are {csm_name}, a professional Customer Success Manager for 'Renewal & Upsell Advisor'. "
        f"You are communicating via WhatsApp with {contact_name} from {account_name}. "
        f"Account Context: Status is {status}, Health Score is {health}/100, Renewal Date is {renewal_date}. "
        "\n\nSTRICT GUIDELINES:\n"
        "1. NEVER use placeholders like '[Your Name]', '[Name]', '[Date]', or '[Service]'.\n"
        "2. If you don't know a specific name or date, use natural language (e.g., 'your upcoming renewal' instead of 'on [date]').\n"
        "3. Be concise (1-3 short paragraphs), friendly, and professional.\n"
        "4. If the user just says 'Hi' or 'Hello', acknowledge them warmly, mention their account/renewal context, and offer your help.\n"
        "5. Do NOT use markdown (bolding, etc.) as this is for WhatsApp."
    )

    messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": system_content,
        }
    ]
    for row in history[-MAX_CONTEXT_MESSAGES:]:
        direction = (row.get("direction") or "user").strip().lower()
        text = (row.get("message") or "").strip()
        if not text:
            continue
        if direction in ("bot", "assistant", "system"):
            messages.append({"role": "assistant", "content": text})
        else:
            messages.append({"role": "user", "content": text})
    return messages


@router.post("/webhook", response_class=PlainTextResponse)
async def whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(""),
):
    """
    Twilio WhatsApp webhook.

    Twilio sends us the WhatsApp number (From) and message body (Body).
    We:
      1. Store the incoming message in whatsapp_conversations.
      2. Load the last N messages for context.
      3. Ask Azure OpenAI for a reply.
      4. Store the reply and send it back to Twilio as a WhatsApp message.
    """
    from_phone = From or ""
    incoming = (Body or "").strip()
    logger.info(f"WhatsApp webhook from {from_phone}: {incoming!r}")

    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    # 1. Insert user message (intent will be analyzed below and updated in the DB)
    inserted_msg_id = None
    try:
        insert_res = client.table("whatsapp_conversations").insert(
            {
                "phone_number": from_phone,
                "direction": "user",
                "message": incoming,
                "metadata": {},
            }
        ).execute()
        if insert_res.data:
            inserted_msg_id = insert_res.data[0].get("id")
    except Exception as e:
        logger.error(f"Failed to insert WhatsApp message: {e}")

    # 2. Load last N conversation messages
    history_rows: List[Dict[str, Any]] = []
    try:
        result = (
            client.table("whatsapp_conversations")
            .select("direction,message,created_at")
            .eq("phone_number", from_phone)
            .order("created_at", desc=True)
            .limit(MAX_CONTEXT_MESSAGES)
            .execute()
        )
        rows = result.data or []
        # reverse to oldest -> newest
        history_rows = list(reversed(rows))
    except Exception as e:
        logger.error(f"Failed to fetch WhatsApp history: {e}")

    # 3. Advance Account Lookup for context
    account_context = None
    try:
        clean_phone = from_phone.replace('+', '').replace('-', '').replace(' ', '')[-10:]
        if clean_phone:
            acc_res = client.table("accounts").select(
                "id, name, primary_contact_name, renewal_date, csm_name, status, health_score"
            ).or_(
                f"primary_contact_phone.ilike.%{clean_phone}%,phone.ilike.%{clean_phone}%"
            ).limit(1).execute()
            if acc_res.data:
                account_context = acc_res.data[0]
    except Exception as e:
        logger.error(f"Failed to lookup account for WhatsApp context: {e}")

    # 4. Generate response via OpenAI (natural flow, no hardcoded template)
    try:
        messages = _build_chat_messages(
            history_rows or [{"direction": "user", "message": incoming}],
            account_context=account_context
        )
        reply_text = azure_openai.chat_completion(messages, temperature=0.7, max_tokens=300)
    except Exception as e:
        logger.error(f"Azure OpenAI WhatsApp reply failed: {e}")
        reply_text = "Sorry, I'm having trouble responding right now. Please try again later."

    # 4. Store bot reply
    try:
        client.table("whatsapp_conversations").insert(
            {
                "phone_number": from_phone,
                "direction": "bot",
                "message": reply_text,
            }
        ).execute()
    except Exception as e:
        logger.error(f"Failed to insert WhatsApp bot reply: {e}")

    # For WhatsApp, Twilio supports plain text or TwiML. We reply with plain text.
    # Log both sides of the exchange (no account_id mapping yet; just phone)
    
    # 5. Extract Intent and update pipeline
    system_msg = """You are an expert intent classification AI. Your task is to analyze a customer's WhatsApp message and determine their renewal intent.
You MUST output EXACTLY ONE of the following precise status strings, and nothing else (no punctuation, no explanation):

- 'interested': Customer wants to renew or is leaning towards renewing.
- 'renewed': Customer states they have already renewed or paid.
- 'renew_afterwards': Customer wants to renew at a later date, next month, etc.
- 'objection_no_money': Customer says they have no money, no budget, or are broke.
- 'not_interested_churn': Customer explicitly refuses to renew, is canceling, says it's too expensive, or mentions a competitor.
- 'not_interested': Customer is generally not interested.
- 'needs_followup': Customer focuses on an issue, problem, or needs help before proceeding.
- 'completed': The message was read but no specific intent above was clear.

Output ONLY the exact status string from the list above."""

    intent_result = "completed"
    try:
        prompt = [
            {"role": "system", "content": system_msg},
            {"role": "user", "content": f"Message: {incoming}"}
        ]
        intent_result = azure_openai.chat_completion(prompt, temperature=0.1, max_tokens=10).strip().lower()
        if intent_result not in ['interested', 'renewed', 'renew_afterwards', 'objection_no_money', 'not_interested_churn', 'not_interested', 'needs_followup', 'completed']:
            intent_result = 'completed'
            
        clean_phone = from_phone.replace('+', '').replace('-', '').replace(' ', '')[-10:]
        if clean_phone:
            acc_res = client.table("accounts").select("id").or_(
                f"primary_contact_phone.ilike.%{clean_phone}%,phone.ilike.%{clean_phone}%"
            ).limit(1).execute()
            
            if acc_res.data:
                account_id = acc_res.data[0]["id"]
                if intent_result == "not_interested_churn":
                    # Redefined: Expressing intent to churn during contract marks account as CRITICAL (at_risk, 99)
                    # Churned status is now reserved for actual contract expiry.
                    client.table("accounts").update({
                        "status": "at_risk",
                        "risk_score": 99,
                        "health_score": 0
                    }).eq("id", account_id).execute()
                    logger.info(f"Marking account {account_id} as CRITICAL (AT_RISK) due to WhatsApp message intent")
                elif intent_result == "renewed":
                    # Redefined: Stay in "renewed" status until contract turnover.
                    client.table("accounts").update({"status": "renewed"}).eq("id", account_id).execute()
                    logger.info(f"Marking account {account_id} as RENEWED due to WhatsApp message")
    except Exception as e:
        logger.error(f"Failed to analyze WhatsApp reply intent: {e}")

    # Write back intent to the message row so frontend can display it
    if inserted_msg_id and intent_result:
        try:
            client.table("whatsapp_conversations").update(
                {"metadata": {"detected_intent": intent_result}}
            ).eq("id", inserted_msg_id).execute()
        except Exception as e:
            logger.error(f"Failed to write back intent to WhatsApp message: {e}")

    try:
        log_activity(
            "whatsapp_message_received",
            details={"phone_number": from_phone, "message": incoming, "intent": intent_result},
        )
        log_activity(
            "whatsapp_message_sent",
            details={"phone_number": from_phone, "message": reply_text, "source": "webhook"},
        )
    except Exception:
        pass

    return reply_text


@router.post("/send-to-account")
async def whatsapp_send_to_account(payload: Dict[str, Any]):
    """
    Manual trigger from frontend:
      {
        "account_id": "...",
        "purpose": "renewal reminder",
        "details": "explain what changed or needs to be communicated"
      }
    We:
      - Look up account's primary_contact_phone and name.
      - Ask Azure OpenAI to write a WhatsApp message.
      - Send via Twilio WhatsApp.
      - Store in whatsapp_conversations.
    """
    account_id = payload.get("account_id")
    purpose = (payload.get("purpose") or "").strip()
    details = (payload.get("details") or "").strip()
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")

    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    # Fetch account info
    try:
        res = (
            client.table("accounts")
            .select("id,name,primary_contact_name,primary_contact_phone")
            .eq("id", account_id)
            .limit(1)
            .execute()
        )
        rows = res.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Account not found")
        acc = rows[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch account {account_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch account")

    to_phone = acc.get("primary_contact_phone") or ""
    account_name = acc.get("name") or acc.get("primary_contact_name") or "Customer"
    if not to_phone:
        raise HTTPException(status_code=400, detail="Account has no primary_contact_phone")

    custom_text = (payload.get("custom_text") or "").strip()

    # If caller already generated the message (custom_text), skip AI generation
    if custom_text:
        text = custom_text
    else:
        # Build prompt for Azure OpenAI
        system_msg = (
            "You are a professional customer success manager writing WhatsApp messages "
            "to B2B customers. Keep messages concise (3-6 short lines), friendly, and clear. "
            "Do not include greetings like 'Dear Sir/Madam'; use the account or contact name naturally."
        )
        user_msg = (
            f"Account name: {account_name}\n"
            f"Purpose: {purpose or 'general customer update'}\n"
            f"Details: {details or 'No extra details provided.'}\n\n"
            "Write a WhatsApp message I can send to the customer. Do not add disclaimers."
        )
        try:
            text = azure_openai.chat_completion(
                [
                    {"role": "system", "content": system_msg},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.7,
                max_tokens=250,
            )
        except Exception as e:
            logger.error(f"Azure OpenAI WhatsApp manual message failed: {e}")
            raise HTTPException(status_code=500, detail="Failed to generate WhatsApp message")

    # Use fresh credentials (not stale module-level singleton)
    from app.services.whatsapp.whatsapp_service import get_whatsapp_service
    service = get_whatsapp_service()
    if not service.is_configured():
        raise HTTPException(status_code=503, detail="Twilio WhatsApp not configured. Please add credentials in Settings.")

    # Send via Twilio WhatsApp
    sid = service.send_message(to_phone, text)
    if not sid:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")

    # Store in conversation history
    try:
        client.table("whatsapp_conversations").insert(
            {
                "phone_number": to_phone,
                "direction": "bot",
                "message": text,
                "metadata": {"source": "manual_trigger", "account_id": account_id},
            }
        ).execute()
    except Exception as e:
        logger.error(f"Failed to insert manual WhatsApp message: {e}")

    # Activity log entry with account context
    try:
        log_activity(
            "whatsapp_message_sent",
            account_id=str(account_id),
            title=f"Sent WhatsApp to {account_name}",
            details={"phone_number": to_phone, "source": "manual_trigger"},
        )
    except Exception:
        pass

    return {"status": "sent", "sid": sid, "to": to_phone, "preview": text}



@router.post("/generate-preview")
async def whatsapp_generate_preview(payload: Dict[str, Any]):
    """Generate a WhatsApp message preview WITHOUT sending."""
    account_id = payload.get("account_id")
    topic = (payload.get("topic") or payload.get("purpose") or "general update").strip()
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        res = client.table("accounts").select("id,name,primary_contact_name").eq("id", account_id).limit(1).execute()
        rows = res.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Account not found")
        acc = rows[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch account")
    account_name = acc.get("name") or acc.get("primary_contact_name") or "Customer"
    system_msg = (
        "You are a professional customer success manager writing WhatsApp messages to B2B customers. "
        "Keep messages concise (3-6 short lines), friendly, and clear. Use the account name naturally."
    )
    user_msg = "Account name: " + account_name + "\nTopic: " + topic + "\n\nWrite a WhatsApp message. No disclaimers."
    try:
        text = azure_openai.chat_completion(
            [{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
            temperature=0.7, max_tokens=250,
        )
    except Exception as e:
        logger.error(f"OpenAI preview failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate preview")
    return {"preview": text, "account_name": account_name}


@router.post("/trigger-all")
async def whatsapp_trigger_all(payload: Dict[str, Any] = {}):
    """Send AI-generated WhatsApp to ALL accounts with a phone number."""
    topic = (payload.get("purpose") or payload.get("topic") or "renewal reminder").strip()
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        res = (
            client.table("accounts")
            .select("id,name,primary_contact_name,primary_contact_phone")
            .not_.is_("primary_contact_phone", "null")
            .execute()
        )
        accounts_list = res.data or []
    except Exception as e:
        logger.error(f"Failed to fetch accounts for WhatsApp blast: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch accounts")
    system_msg = (
        "You are a professional customer success manager writing WhatsApp messages to B2B customers. "
        "Keep messages concise (3-6 lines), friendly, and clear. Use the account name naturally."
    )
    from app.services.whatsapp.whatsapp_service import get_whatsapp_service
    service = get_whatsapp_service()
    sent = 0
    failed = 0
    for acc in accounts_list:
        to_phone = (acc.get("primary_contact_phone") or "").strip()
        if not to_phone:
            failed += 1
            continue
        account_name = acc.get("name") or acc.get("primary_contact_name") or "Customer"
        account_id = acc.get("id")
        try:
            user_msg = "Account name: " + account_name + "\nTopic: " + topic + "\n\nWrite a WhatsApp message. No disclaimers."
            text = azure_openai.chat_completion(
                [{"role": "system", "content": system_msg}, {"role": "user", "content": user_msg}],
                temperature=0.7, max_tokens=200,
            )
        except Exception as e:
            logger.error(f"OpenAI failed for {account_name}: {e}")
            failed += 1
            continue
        sid = service.send_message(to_phone, text)
        if not sid:
            failed += 1
            continue
        sent += 1
        try:
            client.table("whatsapp_conversations").insert({
                "phone_number": to_phone, "direction": "bot", "message": text,
                "metadata": {"source": "trigger_all", "account_id": str(account_id)},
            }).execute()
        except Exception:
            pass
    try:
        log_activity("whatsapp_message_sent",
            title=f"WhatsApp blast: {sent} sent, {failed} failed",
            details={"sent": sent, "failed": failed, "topic": topic})
    except Exception:
        pass
    logger.info(f"WhatsApp trigger-all: sent={sent}, failed={failed}")
    return {"status": "ok", "sent": sent, "failed": failed}
