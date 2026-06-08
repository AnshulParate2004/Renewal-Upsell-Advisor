"""
Voice call API endpoints for handling Twilio webhooks and call management.

KEY FIXES:
  1. Sentiment analysis runs in BOTH handle-input AND call-status
  2. Outcome detection (not_interested_churn, objection_no_money, etc.) ALSO runs
     in call-status so the last-month churn process triggers even when Twilio
     hangs up via timeout (user never said "goodbye").
"""
import os
from fastapi import APIRouter, Request, Form, Query, HTTPException, WebSocket
from fastapi.responses import Response
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone, timedelta
from app.services.email.scheduler import get_supabase_client
from app.services.voice_agent.twilio_call_service import twilio_call_service
from app.services.voice_agent.voice_conversation import voice_conversation_handler
from app.services.voice_agent.sentiment_analyzer import sentiment_analyzer
from app.services.voice_agent.voice_call_scheduler import calculate_plan_completion_percentage
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)
router = APIRouter()



def _webhook_base_url(request: Request, ws: bool = False) -> str:
    base = os.getenv("WEBHOOK_BASE_URL") or settings.WEBHOOK_BASE_URL
    if not base:
        base = str(request.base_url).rstrip("/")
    else:
        base = base.rstrip("/")
        
    if ws:
        return base.replace("https://", "wss://").replace("http://", "ws://")
    return base


def generate_call_summary(account: Dict[str, Any], transcript: str, outcome: str, usage_percentage: float) -> str:
    try:
        from langchain_openai import AzureChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
        from langchain_core.output_parsers import StrOutputParser

        api_key        = os.getenv("AZURE_OPENAI_API_KEY")    or settings.AZURE_OPENAI_API_KEY
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")   or settings.AZURE_OPENAI_ENDPOINT
        api_version    = os.getenv("OPENAI_API_VERSION")      or settings.OPENAI_API_VERSION
        deployment     = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.AZURE_OPENAI_DEPLOYMENT

        if not all([api_key, azure_endpoint, deployment]):
            return f"Call completed with outcome: {outcome}. Usage: {usage_percentage:.1f}%"

        llm = AzureChatOpenAI(
            azure_endpoint=azure_endpoint, api_key=api_key,
            api_version=api_version, azure_deployment=deployment,
            temperature=0.3, max_tokens=150
        )
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(
                "You are a call summarization expert. Create a concise 2-3 sentence summary. "
                "Focus on: main topics, customer concerns, outcome, action items."
            ),
            HumanMessagePromptTemplate.from_template(
                "Account: {account_name}\nOutcome: {outcome}\nUsage: {usage_percentage:.1f}%\n\nTranscript:\n{transcript}\n\nSummary:"
            )
        ])
        chain = prompt | llm | StrOutputParser()
        return chain.invoke({
            "account_name": account.get("name", "Customer"), "outcome": outcome,
            "usage_percentage": usage_percentage,
            "transcript": transcript[-1000:] if len(transcript) > 1000 else transcript
        }).strip()
    except Exception as e:
        logger.error(f"Failed to generate call summary: {e}")
        return f"Call completed with outcome: {outcome}. Usage: {usage_percentage:.1f}%."


# SHARED HELPER 1 — Sentiment
def _run_sentiment_and_save(call_id: str, client) -> None:
    """Run LLM sentiment on transcript and save. Skips if already done."""
    try:
        logger.info(f"[SENTIMENT-SAVE] ▶ call_id={call_id}")
        result = client.table("voice_calls").select("id, account_id, transcript, metadata").eq("id", call_id).limit(1).execute()
        if not result.data:
            return

        row      = result.data[0]
        metadata = row.get("metadata") or {}

        if metadata.get("sentiment_category") and metadata.get("sentiment_score") is not None:
            logger.info(f"[SENTIMENT-SAVE] Already done — skipping.")
            return

        transcript = (row.get("transcript") or "").strip()
        if len(transcript) < 10:
            logger.warning(f"[SENTIMENT-SAVE] Transcript too short — skipping.")
            return

        logger.info(f"[SENTIMENT-SAVE] Transcript ({len(transcript)} chars):\n{transcript[:400]}")
        sentiment_data = sentiment_analyzer.analyze_sentiment(transcript)
        logger.info(f"[SENTIMENT-SAVE] ✅ score={sentiment_data['sentiment_score']}, category={sentiment_data['sentiment_category']}, keywords={sentiment_data['keywords']}")

        metadata.update({
            "sentiment_category":    sentiment_data["sentiment_category"],
            "sentiment_score":       sentiment_data["sentiment_score"],
            "keywords":              sentiment_data["keywords"],
            "sentiment_analysed_at": datetime.now(timezone.utc).isoformat(),
        })
        client.table("voice_calls").update({"metadata": metadata}).eq("id", call_id).execute()

        account_id = row.get("account_id")
        if account_id:
            try:
                client.table("sentiment_analysis").insert({
                    "account_id": account_id,
                    "analysis_date": datetime.now(timezone.utc).date().isoformat(),
                    "sentiment_score": sentiment_data["sentiment_score"],
                    "sentiment_category": sentiment_data["sentiment_category"],
                    "source": "voice_calls",
                    "text_analyzed": transcript,
                    "keywords": sentiment_data["keywords"],
                }).execute()
                client.table("accounts").update({
                    "sentiment_score":    sentiment_data["sentiment_score"],
                    "sentiment_category": sentiment_data["sentiment_category"],
                }).eq("id", account_id).execute()
            except Exception as e:
                logger.error(f"[SENTIMENT-SAVE] insert error: {e}")
    except Exception as e:
        logger.error(f"[SENTIMENT-SAVE] Error: {e}", exc_info=True)


# ─────────────────────────────────────────────────────────────────────────────
# SHARED HELPER 2 — Outcome detection + last-month process
# ─────────────────────────────────────────────────────────────────────────────
def _run_outcome_and_save(call_id: str, client) -> None:
    """
    Run LLM outcome detection on transcript and trigger follow-up processes.
    Called from call-status when Twilio reports 'completed' so that:
      - not_interested_churn  → account marked churned → last-month win-back calls start
      - objection_no_money    → follow-up call scheduled
      - renew_afterwards      → follow-up call scheduled
      - renewed               → account marked active
    Skips if outcome already set.
    """
    try:
        logger.info(f"[OUTCOME-SAVE] ▶ call_id={call_id}")
        result = client.table("voice_calls").select(
            "id, account_id, transcript, outcome, metadata, call_type"
        ).eq("id", call_id).limit(1).execute()

        if not result.data:
            return

        row        = result.data[0]
        transcript = (row.get("transcript") or "").strip()
        existing_outcome = (row.get("outcome") or "").lower()

        # Skip if outcome already set to something meaningful
        meaningful = {"not_interested_churn","renew_afterwards","renewed","interested","not_interested","needs_followup"}
        if existing_outcome in meaningful:
            logger.info(f"[OUTCOME-SAVE] Outcome already set to '{existing_outcome}' — skipping.")
            return

        if len(transcript) < 10:
            logger.warning(f"[OUTCOME-SAVE] Transcript too short — skipping.")
            return

        account_id = row.get("account_id")
        if not account_id:
            return

        # Fetch account for usage % and renewal date
        acc_result = client.table("accounts").select("*").eq("id", account_id).limit(1).execute()
        if not acc_result.data:
            return
        account = acc_result.data[0]

        usage_percentage = calculate_plan_completion_percentage(account)

        # Determine is_last_month
        is_last_month = False
        renewal_date_str = account.get("renewal_date")
        if renewal_date_str:
            try:
                renewal_dt = datetime.fromisoformat(str(renewal_date_str).replace("Z", "+00:00"))
                if renewal_dt.tzinfo is None:
                    renewal_dt = renewal_dt.replace(tzinfo=timezone.utc)
                is_last_month = 0 <= (renewal_dt - datetime.now(timezone.utc)).days <= 30
            except Exception:
                is_last_month = usage_percentage >= 90
        else:
            is_last_month = usage_percentage >= 90

        logger.info(f"[OUTCOME-SAVE] usage={usage_percentage:.1f}%, is_last_month={is_last_month}")
        logger.info(f"[OUTCOME-SAVE] Transcript:\n{transcript[:400]}")

        # ── Run LLM outcome detection ─────────────────────────────────────
        outcome = voice_conversation_handler.get_call_outcome(transcript, usage_percentage, is_last_month)
        logger.info(f"[OUTCOME-SAVE] ✅ LLM detected outcome = '{outcome}'")

        # Save outcome
        metadata = row.get("metadata") or {}
        metadata["outcome_detected_at"] = datetime.now(timezone.utc).isoformat()
        client.table("voice_calls").update({
            "outcome":  outcome,
            "metadata": metadata,
        }).eq("id", call_id).execute()
        logger.info(f"[OUTCOME-SAVE] outcome saved to DB.")

        completed_at = datetime.now(timezone.utc).isoformat()

        # ── Account status update ─────────────────────────────────────────
        acc_update: Dict[str, Any] = {"last_contact_date": completed_at}
        
        # Determine actual outcome logic
        if outcome in ["not_interested_churn", "churned"]:
            # Redefined: Expressing intent to churn during contract marks account as CRITICAL (at_risk, 99)
            # Churned status is now reserved for actual contract expiry (automated below).
            acc_update["status"] = "at_risk"
            acc_update["risk_score"] = 99
            acc_update["health_score"] = 0
            acc_update["churn_probability"] = 0.99
            logger.info(f"[OUTCOME-SAVE] 🚨 Account {account_id} marked CRITICAL (AT_RISK). Risk=99, Health=0. (Automated rescue processes DISABLED per user request)")
            
            # [REMOVED] Automated win-back discount email and T-30 process are now disabled.
            # Recovery actions must be triggered manually if needed.
            
        elif outcome == "renewed":
            # Redefined: Stay in "renewed" status until contract turnover.
            acc_update["status"] = "renewed"
            logger.info(f"[OUTCOME-SAVE] ✅ Account {account_id} marked RENEWED.")
            
        elif outcome == "completed":
            logger.info(f"[OUTCOME-SAVE] Call completed successfully. Updating contact date only.")
            
        # ── Backup check for Critical status (Very Negative Sentiment + Churn Keywords) ─────
        if acc_update.get("status") != "at_risk":
            # Re-fetch metadata in case sentiment was just updated by _run_sentiment_and_save
            refresh = client.table("voice_calls").select("metadata").eq("id", call_id).execute()
            if refresh.data:
                metadata = refresh.data[0].get("metadata") or {}
                sentiment_cat = (metadata.get("sentiment_category") or "").lower()
                keywords = [k.lower() for k in (metadata.get("keywords") or [])]
                churn_keywords = ["not renew", "wont renew", "will not renew", "canceling", "cancel", "too expensive", "competitor"]
                
                if sentiment_cat == "very_negative" and any(wk in " ".join(keywords) for wk in churn_keywords):
                    logger.info(f"[OUTCOME-SAVE] 🚨 Secondary check: Very Negative sentiment + Churn keywords found for account {account_id}. Marking CRITICAL.")
                    acc_update["status"] = "at_risk"
                    acc_update["risk_score"] = 99
                    acc_update["health_score"] = 0
                    acc_update["churn_probability"] = 0.99

        client.table("accounts").update(acc_update).eq("id", account_id).execute()

        # ── Follow-up scheduling ──────────────────────────────────────────
        if outcome == "renew_afterwards":
            # Schedule follow-up email in 7 days exactly as requested
            days = 7
            client.table("email_campaigns").insert({
                "account_id": account_id,
                "type": "renewal_followup",
                "status": "scheduled",
                "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=days)).isoformat(),
                "metadata": {"trigger": "renew_afterwards_call", "call_id": call_id}
            }).execute()
            logger.info(f"[OUTCOME-SAVE] Scheduled renewal follow-up email in {days} days.")

        elif outcome == "needs_followup":
            # Immediate follow up voice call in 1 day
            client.table("voice_calls").insert({
                "account_id": account_id, 
                "call_type": "issue_followup", 
                "status": "scheduled",
                "scheduled_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
                "metadata": {"original_call_id": call_id, "reason": "Customer needs immediate manual followup"}
            }).execute()
            logger.info(f"[OUTCOME-SAVE] Scheduled needs-followup call in 1 day.")

        # Log activity
        try:
            client.table("activity_logs").insert({
                "account_id": account_id,
                "action": "voice_call_outcome_detected",
                "details": {
                    "title": f"Call Outcome: {outcome}",
                    "outcome": outcome,
                    "is_last_month": is_last_month,
                    "usage_percentage": usage_percentage,
                    "detected_at": completed_at,
                }
            }).execute()
        except Exception:
            pass

    except Exception as e:
        logger.error(f"[OUTCOME-SAVE] Error: {e}", exc_info=True)


def _outcome_for_ui(status: Optional[str], outcome: Optional[str], retry_count: int) -> str:
    status  = (status  or "").lower()
    outcome = (outcome or "").lower()
    if status == "completed":
        return "picked_up"
    if status in ("no_answer", "busy") or outcome in ("no_answer", "voicemail"):
        return "missed"
    if status == "failed" or (retry_count and retry_count > 0) or status == "scheduled":
        return "retry"
    return "picked_up"


@router.get("/calls")
async def list_voice_calls(skip: int = Query(0, ge=0), limit: int = Query(100, ge=1, le=500)):
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        select_cols = "id, account_id, duration_seconds, status, outcome, scheduled_at, completed_at, attempted_at, created_at, retry_count, metadata"
        try:
            result = client.table("voice_calls").select(f"{select_cols}, sentiment").order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        except Exception:
            result = client.table("voice_calls").select(select_cols).order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        rows = result.data or []
        if not rows:
            return {"calls": [], "total": 0}

        account_ids = list({r["account_id"] for r in rows if r.get("account_id")})
        account_map: Dict[str, str] = {}
        if account_ids:
            for a in (client.table("accounts").select("id, name").in_("id", account_ids).execute().data or []):
                account_map[str(a["id"])] = a.get("name") or "Unknown"

        calls = []
        for r in rows:
            completed = r.get("completed_at") or r.get("attempted_at") or r.get("scheduled_at") or r.get("created_at")
            try:
                date_display = datetime.fromisoformat(str(completed).replace("Z","+00:00")).strftime("%b %d, %Y %H:%M") if completed else "—"
            except Exception:
                date_display = str(completed) if completed else "—"

            dur = r.get("duration_seconds") or r.get("duration")
            dur_sec = None
            if dur is not None:
                try:
                    dur_sec = int(dur)
                    duration_display = f"{dur_sec // 60}m {dur_sec % 60}s"
                except Exception:
                    duration_display = str(dur)
            else:
                duration_display = "—"

            meta = r.get("metadata") or {}
            sc   = (r.get("sentiment") or meta.get("sentiment_category") or "").lower()
            sentiment = "positive" if "positive" in sc else "negative" if "negative" in sc else "neutral"

            calls.append({
                "id": r["id"], "account_id": r.get("account_id"),
                "account_name": account_map.get(str(r.get("account_id") or ""), "Unknown"),
                "date": date_display, "duration": duration_display, "duration_seconds": dur_sec,
                "status": r.get("status"),
                "outcome": _outcome_for_ui(r.get("status"), r.get("outcome"), r.get("retry_count") or 0),
                "outcome_raw": r.get("outcome"), "sentiment": sentiment,
                "retry_count": r.get("retry_count") or 0,
            })
        return {"calls": calls, "total": len(calls)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing voice calls: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load voice calls")


@router.get("/calls/{call_id}")
async def get_voice_call_detail(call_id: str):
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        select_cols = "id, account_id, transcript, summary, outcome, status, duration_seconds, completed_at, attempted_at, scheduled_at, created_at, retry_count, metadata"
        try:
            result = client.table("voice_calls").select(select_cols).eq("id", call_id).limit(1).execute()
        except Exception:
            result = client.table("voice_calls").select("id, account_id, outcome, status, duration_seconds, completed_at, attempted_at, created_at, retry_count, metadata").eq("id", call_id).limit(1).execute()

        rows = result.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Call not found")

        r        = rows[0]
        metadata = r.get("metadata") or {}

        # On-demand sentiment if missing
        if not metadata.get("sentiment_category") or metadata.get("sentiment_score") is None:
            logger.info(f"[GET DETAIL] Running on-demand sentiment for call {call_id}")
            _run_sentiment_and_save(call_id, client)
            fresh = client.table("voice_calls").select("metadata").eq("id", call_id).limit(1).execute()
            if fresh.data:
                metadata = fresh.data[0].get("metadata") or {}

        sentiment_cat   = (metadata.get("sentiment_category") or "").lower()
        sentiment_score = metadata.get("sentiment_score") or 0.0
        keywords        = metadata.get("keywords") or []

        transcript = r.get("transcript")
        if isinstance(transcript, list):
            transcript = "\n".join(str(x) for x in transcript)
        transcript = (transcript or "").strip()
        summary    = (r.get("summary") or "").strip()

        completed = r.get("completed_at") or r.get("attempted_at") or r.get("created_at")
        date_display = str(completed)[:19].replace("T", " ") if completed else "—"
        dur = r.get("duration_seconds")
        duration_display = f"{dur // 60}m {dur % 60}s" if isinstance(dur, int) and dur >= 0 else "—"

        account_id   = r.get("account_id")
        account_name = "Unknown"
        if account_id:
            acc = client.table("accounts").select("name").eq("id", account_id).limit(1).execute()
            if acc.data:
                account_name = acc.data[0].get("name") or "Unknown"

        return {
            "id": r["id"], "account_id": account_id, "account_name": account_name,
            "date": date_display, "duration": duration_display, "duration_seconds": r.get("duration_seconds"),
            "outcome": _outcome_for_ui(r.get("status"), r.get("outcome"), r.get("retry_count") or 0),
            "transcript": transcript, "summary": summary,
            "sentiment_category": sentiment_cat or "neutral",
            "sentiment_score": sentiment_score,
            "keywords": keywords,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching voice call {call_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load call details")


@router.post("/handle-call")
async def handle_call(
    request: Request,
    call_id: Optional[str] = Query(None),
    CallSid: Optional[str] = Form(None),
    From: Optional[str] = Form(None),
    To: Optional[str] = Form(None),
    CallStatus: Optional[str] = Form(None)
):
    logger.info("VOICE WEBHOOK: handle-call received")
    client = get_supabase_client()
    if not client:
        return Response(content=twilio_call_service.generate_twiml_response("Sorry, our system is unavailable."), media_type="application/xml")

    if not call_id:
        call_id = request.query_params.get("call_id")

    try:
        if call_id:
            call_result = client.table("voice_calls").select("account_id, call_type, metadata").eq("id", call_id).execute()
            if call_result.data:
                call_data  = call_result.data[0]
                account_id = call_data.get("account_id")
                acc_result = client.table("accounts").select("*").eq("id", account_id).execute()
                account    = acc_result.data[0] if acc_result.data else None

                if account:
                    usage_percentage = calculate_plan_completion_percentage(account)
                    call_type        = call_data.get("call_type", "check_in")
                    call_purpose     = (call_data.get("metadata") or {}).get("call_purpose") or None

                    script = voice_conversation_handler.get_conversation_script(
                        account=account, usage_percentage=usage_percentage,
                        call_type=call_type, purpose=call_purpose
                    )
                    if not script or len(script.strip()) < 20:
                        script = f"Hello, this is {account.get('csm_name','our team')} calling from Renewal & Upsell Advisor regarding {account.get('name','your account')}. Your contract is {usage_percentage:.0f}% complete. Would you like to discuss renewal options?"

                    unwanted = ["press any key","press any","execute","trial","upgrade","remove account"]
                    if any(p in script.lower() for p in unwanted):
                        csm = account.get('csm_name','Jennifer') or 'Jennifer'
                        script = f"Hello, this is {csm} calling from Renewal & Upsell Advisor regarding {account.get('name','your account')}. Your contract is {usage_percentage:.0f}% complete. Would you like to discuss renewal options?"

                    try:
                        client.table("voice_calls").update({
                            "transcript": f"Agent: {script}", "status": "in_progress",
                            "metadata": {**call_data.get("metadata", {}), "initial_script": script, "script_generated_at": datetime.now(timezone.utc).isoformat()}
                        }).eq("id", call_id).execute()
                    except Exception as db_err:
                        logger.error(f"Failed to save initial script: {db_err}")

                    return Response(
                        content=twilio_call_service.generate_twiml_response(
                            message=script, gather_input=True,
                            action_url=f"{_webhook_base_url(request, )}/api/v1/voice/handle-input?call_id={call_id}",
                            timeout=10
                        ),
                        media_type="application/xml"
                    )

        return Response(content=twilio_call_service.generate_twiml_response("Hello, thank you for calling. How can I assist you today?"), media_type="application/xml")
    except Exception as e:
        logger.error(f"Error handling call: {e}", exc_info=True)
        return Response(content=twilio_call_service.generate_twiml_response("Sorry, we encountered an error."), media_type="application/xml")


def _safe_twiml_message(text: str, max_len: int = 500) -> str:
    if not text or not isinstance(text, str):
        return "I understand. Is there anything else I can help you with?"
    t = text.strip()[:max_len]
    for bad, good in [("&"," and "),("<",""),(">"," ")]:
        t = t.replace(bad, good)
    return t or "I understand. Is there anything else I can help you with?"


@router.post("/handle-input")
async def handle_input(
    request: Request,
    call_id: Optional[str] = Query(None),
    SpeechResult: Optional[str] = Form(None),
    Digits: Optional[str] = Form(None)
):
    logger.info("VOICE WEBHOOK: handle-input received")
    try:
        logger.info(f"SpeechResult={SpeechResult!r}, Digits={Digits!r}, call_id={call_id}")
        client = get_supabase_client()
        if not client:
            return Response(content=twilio_call_service.generate_twiml_response("Sorry, technical difficulties."), media_type="application/xml")

        if not call_id:
            call_id = request.query_params.get("call_id")
        if not call_id:
            return Response(content=twilio_call_service.generate_twiml_response("Sorry, we couldn't identify your call."), media_type="application/xml")

        user_input = (SpeechResult or Digits or "").strip()
        if Digits and not SpeechResult:
            user_input = {"1":"yes","9":"yes","2":"no","0":"no"}.get(Digits, f"pressed {Digits}")

        call_result = client.table("voice_calls").select("account_id, call_type, transcript, metadata").eq("id", call_id).execute()
        if not call_result.data:
            return Response(content=twilio_call_service.generate_twiml_response("Thank you for calling. Goodbye."), media_type="application/xml")

        call_data  = call_result.data[0]
        account_id = call_data.get("account_id")
        if not account_id:
            return Response(content=twilio_call_service.generate_twiml_response("Thank you for calling. Goodbye."), media_type="application/xml")

        acc_result = client.table("accounts").select("*").eq("id", account_id).execute()
        account    = acc_result.data[0] if acc_result.data else None
        if not account:
            return Response(content=twilio_call_service.generate_twiml_response("Thank you for calling. Goodbye."), media_type="application/xml")

        transcript = call_data.get("transcript", "") or ""
        conversation_history = []
        for line in [l.strip() for l in transcript.split('\n') if l.strip()]:
            if line.startswith('Agent:'):
                conversation_history.append({'role':'assistant','content':line.replace('Agent:','').strip()})
            elif line.startswith('User:'):
                conversation_history.append({'role':'user','content':line.replace('User:','').strip()})

        usage_percentage  = calculate_plan_completion_percentage(account)
        call_type         = call_data.get("call_type", "check_in")
        should_end        = False
        callback_time_iso = None

        if not (user_input and user_input.strip()):
            response           = "We didn't catch that. To continue, press 1. To end the call, press 2."
            updated_transcript = f"{transcript}\nAgent: {response}"
        else:
            try:
                response = voice_conversation_handler.generate_dynamic_response(
                    account=account, user_input=user_input,
                    conversation_context=conversation_history,
                    usage_percentage=usage_percentage, call_type=call_type
                )
                if not response or len(response.strip()) < 10:
                    response = "I understand. Is there anything else I can help you with regarding your contract renewal?"
            except Exception as resp_err:
                logger.error(f"Error generating response: {resp_err}", exc_info=True)
                response = "I understand. Is there anything else I can help you with regarding your contract renewal?"

            updated_transcript = f"{transcript}\nUser: {user_input}\nAgent: {response}"
            if any(w in user_input.lower() for w in ['goodbye','bye','hang up','stop']):
                should_end = True

        if user_input and not should_end:
            extracted_time = voice_conversation_handler.extract_callback_time(user_input)
            if extracted_time:
                try:
                    dt_obj = datetime.fromisoformat(extracted_time.replace('Z','+00:00'))
                    if dt_obj.date() <= datetime.now(timezone.utc).date():
                        dt_obj = dt_obj + timedelta(days=1)
                    callback_time_iso = dt_obj.isoformat().replace('+00:00','Z')
                except Exception:
                    callback_time_iso = extracted_time
                should_end         = True
                response           = "Perfect, I have noted that time and will call you back then. Have a wonderful day!"
                updated_transcript = f"{transcript}\nUser: {user_input}\nAgent: {response}"

        if should_end:
            # ── is_last_month ─────────────────────────────────────────────
            is_last_month    = False
            renewal_date_str = account.get('renewal_date')
            if renewal_date_str:
                try:
                    renewal_dt = datetime.fromisoformat(str(renewal_date_str).replace('Z','+00:00'))
                    if renewal_dt.tzinfo is None:
                        renewal_dt = renewal_dt.replace(tzinfo=timezone.utc)
                    is_last_month = 0 <= (renewal_dt - datetime.now(timezone.utc)).days <= 30
                except Exception:
                    is_last_month = usage_percentage >= 90
            else:
                is_last_month = usage_percentage >= 90

            # ── Outcome ───────────────────────────────────────────────────
            outcome = voice_conversation_handler.get_call_outcome(updated_transcript, usage_percentage, is_last_month)
            if callback_time_iso:
                outcome = "callback_requested"
            logger.info(f"[HANDLE-INPUT] outcome={outcome}, is_last_month={is_last_month}")

            # ── Sentiment ─────────────────────────────────────────────────
            sentiment_data = sentiment_analyzer.analyze_sentiment(updated_transcript)
            logger.info(f"[HANDLE-INPUT] sentiment={sentiment_data['sentiment_category']}, score={sentiment_data['sentiment_score']}")

            call_summary = generate_call_summary(account, updated_transcript, outcome, usage_percentage)
            completed_at = datetime.now(timezone.utc).isoformat()

            try:
                metadata = {**(call_data.get("metadata") or {}), "usage_percentage": usage_percentage, "completed_at": completed_at}

                if outcome == "callback_requested":
                    for k in list(metadata.keys()):
                        if k not in ["milestone","account_name","call_purpose","twilio_call_sid","usage_percentage","completed_at"]:
                            metadata.pop(k, None)
                    metadata["call_status"] = "busy"
                else:
                    metadata.update({
                        "call_status": "completed",
                        "sentiment_category": sentiment_data["sentiment_category"],
                        "sentiment_score":    sentiment_data["sentiment_score"],
                        "keywords":           sentiment_data["keywords"],
                        "sentiment_analysed_at": completed_at,
                        "outcome_detected_at":   completed_at,
                    })

                client.table("voice_calls").update({
                    "transcript": updated_transcript, "summary": call_summary,
                    "status": "completed", "completed_at": completed_at,
                    "outcome": outcome, "metadata": metadata
                }).eq("id", call_id).execute()

                client.table("sentiment_analysis").insert({
                    "account_id": account_id,
                    "analysis_date": datetime.now(timezone.utc).date().isoformat(),
                    "sentiment_score": sentiment_data["sentiment_score"],
                    "sentiment_category": sentiment_data["sentiment_category"],
                    "source": "voice_calls", "text_analyzed": updated_transcript,
                    "keywords": sentiment_data["keywords"]
                }).execute()

                # Follow-ups
                if outcome == "renew_afterwards":
                    prev = client.table("voice_calls").select("id").eq("account_id",account_id).eq("outcome","renew_afterwards").execute()
                    days = 15 if len(prev.data or []) <= 1 else 5
                    client.table("voice_calls").insert({"account_id":account_id,"call_type":"renewal_followup","status":"scheduled",
                        "scheduled_at":(datetime.now(timezone.utc)+timedelta(days=days)).isoformat(),
                        "metadata":{"original_call_id":call_id,"reason":f"Renew afterwards ({days}d)"}}).execute()

                elif outcome == "objection_no_money":
                    try:
                        cfg = client.table("app_settings").select("config").eq("key","default").execute()
                        wait_hours = int((cfg.data or [{}])[0].get("config",{}).get("schedule",{}).get("objectionFollowUpHours",24))
                    except Exception:
                        wait_hours = 24
                    client.table("voice_calls").insert({"account_id":account_id,"call_type":"objection_followup","status":"scheduled",
                        "scheduled_at":(datetime.now(timezone.utc)+timedelta(hours=wait_hours)).isoformat(),
                        "metadata":{"original_call_id":call_id,"reason":f"No-money objection ({wait_hours}h)"}}).execute()

                elif outcome == "callback_requested" or callback_time_iso:
                    final_time = callback_time_iso or (datetime.now(timezone.utc)+timedelta(days=1)).isoformat()
                    client.table("voice_calls").insert({"account_id":account_id,"call_type":"reschedule","status":"scheduled",
                        "scheduled_at":final_time,"metadata":{"original_call_id":call_id,"reason":"User requested callback"}}).execute()

                # Account update
                acc_update: Dict[str, Any] = {
                    "sentiment_score": sentiment_data["sentiment_score"],
                    "sentiment_category": sentiment_data["sentiment_category"],
                    "last_contact_date": completed_at
                }
                if outcome == "not_interested_churn":
                    acc_update["status"] = "churned"
                    logger.info(f"[HANDLE-INPUT] 🚨 Account {account_id} marked CHURNED → last-month win-back will trigger.")
                elif outcome == "renewed":
                    acc_update["status"] = "active"
                client.table("accounts").update(acc_update).eq("id", account_id).execute()

                try:
                    client.table("activity_logs").insert({"account_id":account_id,"action":"voice_call_completed",
                        "details":{"title":"Voice Call Completed","call_type":call_type,"outcome":outcome,
                        "usage_percentage":usage_percentage,"is_last_month":is_last_month,
                        "sentiment_score":sentiment_data["sentiment_score"],
                        "sentiment_category":sentiment_data["sentiment_category"],
                        "completed_at":completed_at}}).execute()
                except Exception as log_err:
                    logger.error(f"Failed to log activity: {log_err}")

                logger.info(f"[HANDLE-INPUT] ✅ Call {call_id} saved. outcome={outcome}, sentiment={sentiment_data['sentiment_category']}")

            except Exception as db_err:
                logger.error(f"Failed to save call data: {db_err}", exc_info=True)

            return Response(
                content=twilio_call_service.generate_twiml_response(f"{response} Thank you for your time. Have a great day!"),
                media_type="application/xml"
            )

        else:
            try:
                client.table("voice_calls").update({
                    "transcript": updated_transcript,
                    "metadata": {**(call_data.get("metadata") or {}),
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "conversation_turns": len([l for l in updated_transcript.split('\n') if l.strip()])}
                }).eq("id", call_id).execute()
            except Exception as db_err:
                logger.error(f"Failed to update transcript: {db_err}")

            return Response(
                content=twilio_call_service.generate_twiml_response(
                    message=_safe_twiml_message(response), gather_input=True,
                    action_url=f"{_webhook_base_url(request, )}/api/v1/voice/handle-input?call_id={call_id}",
                    timeout=10
                ),
                media_type="application/xml"
            )

    except Exception as e:
        logger.error(f"Error handling input: {e}", exc_info=True)
        return Response(content=twilio_call_service.generate_twiml_response("I apologize, please call us back."), media_type="application/xml")


@router.post("/call-status")
async def call_status(
    request: Request,
    CallSid: Optional[str] = Form(None),
    CallStatus: Optional[str] = Form(None),
    CallDuration: Optional[str] = Form(None)
):
    """
    Handle Twilio call status updates.
    ✅ When status=completed runs BOTH sentiment + outcome detection so
       last-month churn process triggers even if user never said goodbye.
    """
    client = get_supabase_client()
    if not client:
        return {"status": "ok"}

    status_lower = (CallStatus or "").lower()
    logger.info(f"[CALL-STATUS] SID={CallSid}, status={status_lower}, duration={CallDuration}")

    try:
        call_result = client.table("voice_calls").select("id, account_id, metadata").eq(
            "metadata->>twilio_call_sid", CallSid
        ).execute()

        if not call_result.data:
            logger.warning(f"[CALL-STATUS] No call found for SID {CallSid}")
            return {"status": "ok"}

        call_id           = call_result.data[0]["id"]
        account_id        = call_result.data[0].get("account_id")
        existing_metadata = call_result.data[0].get("metadata") or {}
        completed_at      = datetime.now(timezone.utc).isoformat()

        update_data: Dict[str, Any] = {"status": status_lower}

        if status_lower == "no-answer":
            update_data.update({"outcome":"no_answer","completed_at":completed_at,"summary":"Call was not answered.",
                "metadata":{**existing_metadata,"twilio_call_sid":CallSid,"call_status":"no-answer","completed_at":completed_at}})

        elif status_lower == "busy":
            update_data.update({"outcome":"busy","completed_at":completed_at,"summary":"Call failed — line was busy.",
                "metadata":{**existing_metadata,"twilio_call_sid":CallSid,"call_status":"busy","completed_at":completed_at}})

        elif status_lower == "failed":
            update_data.update({"outcome":"failed","completed_at":completed_at,"summary":"Call failed — unable to connect.",
                "metadata":{**existing_metadata,"twilio_call_sid":CallSid,"call_status":"failed","completed_at":completed_at}})

        elif status_lower == "completed":
            update_data["completed_at"] = completed_at
            if CallDuration and str(CallDuration).isdigit():
                update_data["duration_seconds"] = int(CallDuration)
            update_data["metadata"] = {
                **existing_metadata, "twilio_call_sid": CallSid, "call_status": "completed",
                "duration_seconds": int(CallDuration) if (CallDuration and str(CallDuration).isdigit()) else None
            }
        else:
            update_data["metadata"] = {**existing_metadata,"twilio_call_sid":CallSid,"call_status":status_lower,
                "last_status_update":completed_at}

        client.table("voice_calls").update(update_data).eq("id", call_id).execute()
        logger.info(f"[CALL-STATUS] call {call_id} → {status_lower}")

        if status_lower == "completed":
            # ── SENTIMENT (place 2) ───────────────────────────────────────
            logger.info(f"[CALL-STATUS] Running sentiment for call {call_id}")
            _run_sentiment_and_save(call_id, client)

            # ── OUTCOME + LAST MONTH PROCESS (place 2) ────────────────────
            logger.info(f"[CALL-STATUS] Running outcome detection for call {call_id}")
            _run_outcome_and_save(call_id, client)

        if status_lower in ["completed","failed","no-answer","busy"]:
            try:
                client.table("activity_logs").insert({
                    "account_id": account_id,
                    "action": f"voice_call_{status_lower.replace('-','_')}",
                    "details": {"title":f"Voice Call {status_lower.capitalize()}","status":status_lower,
                        "twilio_call_sid":CallSid,
                        "duration_seconds":int(CallDuration) if (CallDuration and str(CallDuration).isdigit()) else None,
                        "completed_at":completed_at}
                }).execute()
            except Exception as log_err:
                logger.error(f"Failed to log activity: {log_err}")

    except Exception as e:
        logger.error(f"[CALL-STATUS] Error: {e}", exc_info=True)

    return {"status": "ok"}


@router.post("/trigger-calls")
async def trigger_calls():
    from app.services.voice_agent.voice_call_scheduler import process_scheduled_calls
    try:
        await process_scheduled_calls()
        return {"status": "success", "message": "Voice call processing completed"}
    except Exception as e:
        logger.error(f"Error triggering calls: {e}")
        return {"status": "error", "message": str(e)}


from pydantic import BaseModel

class TriggerAccountCallRequest(BaseModel):
    account_id: str
    purpose: Optional[str] = None

@router.post("/trigger-call-to-account")
async def trigger_call_to_account(request: TriggerAccountCallRequest):
    from app.services.voice_agent.voice_call_scheduler import trigger_voice_call_for_account
    result = await trigger_voice_call_for_account(request.account_id, purpose=request.purpose)
    if result.get("success"):
        return {"status": "success", "message": result.get("message"), "call_sid": result.get("call_sid")}
    raise HTTPException(status_code=400, detail=result.get("error", "Failed to trigger call"))


@router.post("/recording-status")
async def recording_status(
    request: Request,
    RecordingSid: Optional[str] = Form(None),
    RecordingUrl: Optional[str] = Form(None),
    CallSid: Optional[str] = Form(None)
):
    try:
        if RecordingUrl and CallSid:
            client = get_supabase_client()
            if client:
                call_result = client.table("voice_calls").select("id, metadata").eq("metadata->>twilio_call_sid", CallSid).execute()
                if call_result.data:
                    call_id  = call_result.data[0]["id"]
                    existing = call_result.data[0].get("metadata") or {}
                    client.table("voice_calls").update({"metadata":{**existing,"recording_url":RecordingUrl,"recording_sid":RecordingSid}}).eq("id", call_id).execute()
    except Exception as e:
        logger.error(f"Error handling recording status: {e}")
    return {"status": "ok"}


@router.post("/calls/{call_id}/reanalyze")
async def reanalyze_voice_call(call_id: str):
    """
    Manually re-run sentiment and outcome analysis for a voice call.
    Used to fix data discrepancies or apply updated logic to old calls.
    """
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    try:
        # 1. Fetch call to ensure it exists
        call_result = client.table("voice_calls").select("id, status, metadata").eq("id", call_id).execute()
        if not call_result.data:
            raise HTTPException(status_code=404, detail="Call not found")
        
        call = call_result.data[0]
        if call.get("status") != "completed":
            raise HTTPException(status_code=400, detail="Only completed calls can be re-analyzed")

        # 2. Reset sentiment and outcome metadata to force re-analysis
        metadata = call.get("metadata") or {}
        for key in ["sentiment_category", "sentiment_score", "keywords", "sentiment_analysed_at", "outcome_detected_at"]:
            metadata.pop(key, None)
        
        # We also reset the 'outcome' column in DB
        client.table("voice_calls").update({
            "outcome": None,
            "metadata": metadata
        }).eq("id", call_id).execute()

        logger.info(f"[REANALYZE] Triggering re-analysis for call {call_id}")
        
        # 3. Re-run analysis logic
        _run_sentiment_and_save(call_id, client)
        _run_outcome_and_save(call_id, client)
        
        # 4. Fetch and return updated call
        updated_call = client.table("voice_calls").select("*").eq("id", call_id).execute().data[0]
        return {"status": "success", "call": updated_call}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error re-analyzing call {call_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to re-analyze call")


@router.post("/sms/send")
async def send_sms(account_id: str, body: str = Query(None)):
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        acc_result = client.table("accounts").select("primary_contact_phone, name").eq("id", account_id).execute()
        if not acc_result.data:
            raise HTTPException(status_code=404, detail="Account not found")
            
        account = acc_result.data[0]
        phone = account.get("primary_contact_phone")
        if not phone:
            raise HTTPException(status_code=400, detail="Account missing phone number")
            
        # Send SMS via Twilio
        sid = twilio_call_service.send_sms(to_phone=phone, body=body or f"Hello from Renewal & Upsell Advisor!")
        if sid:
            return {"success": True, "message_sid": sid}
        else:
            raise HTTPException(status_code=500, detail="Failed to send SMS via Twilio")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(status_code=500, detail="Error sending SMS")
