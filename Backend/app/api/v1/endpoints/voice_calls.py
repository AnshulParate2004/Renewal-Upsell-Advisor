"""
Voice call API endpoints for handling Twilio webhooks and call management.
"""
import os
from fastapi import APIRouter, Request, Form, Query, HTTPException
from fastapi.responses import Response
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from app.services.email.scheduler import get_supabase_client
from app.services.voice_agent.twilio_call_service import twilio_call_service
from app.services.voice_agent.voice_conversation import voice_conversation_handler
from app.services.voice_agent.sentiment_analyzer import sentiment_analyzer
from app.services.voice_agent.voice_call_scheduler import calculate_plan_completion_percentage
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)
router = APIRouter()


def _webhook_base_url(request: Request) -> str:
    """Base URL for TwiML callbacks so Twilio can reach us (use public URL when behind tunnel)."""
    base = os.getenv("WEBHOOK_BASE_URL") or settings.WEBHOOK_BASE_URL
    if base:
        return base.rstrip("/")
    return str(request.base_url).rstrip("/")


def generate_call_summary(
    account: Dict[str, Any],
    transcript: str,
    outcome: str,
    usage_percentage: float
) -> str:
    """
    Generate a summary of the call using LangChain.
    
    Args:
        account: Account information
        transcript: Call transcript
        outcome: Call outcome
        usage_percentage: Usage percentage
        
    Returns:
        Call summary text
    """
    try:
        from langchain_openai import AzureChatOpenAI
        from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        from app.core.config import settings
        import os
        
        # Read from .env first, then fallback to settings
        api_key = os.getenv("AZURE_OPENAI_API_KEY") or settings.AZURE_OPENAI_API_KEY
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or settings.AZURE_OPENAI_ENDPOINT
        api_version = os.getenv("OPENAI_API_VERSION") or settings.OPENAI_API_VERSION
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.AZURE_OPENAI_DEPLOYMENT
        
        if not all([api_key, azure_endpoint, deployment]):
            # Fallback summary
            return f"Call completed with outcome: {outcome}. Usage: {usage_percentage:.1f}%"
        
        llm = AzureChatOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=api_key,
            api_version=api_version,
            azure_deployment=deployment,
            temperature=0.3,
            max_tokens=150
        )
        
        system_template = """You are a call summarization expert. Create a concise summary (2-3 sentences) of this customer call.

Focus on:
- Main topics discussed
- Customer concerns or issues
- Call outcome
- Any action items

Keep it professional and factual."""
        
        human_template = """Summarize this call transcript:

Account: {account_name}
Outcome: {outcome}
Usage: {usage_percentage:.1f}%

Transcript:
{transcript}

Summary:"""
        
        prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(system_template),
            HumanMessagePromptTemplate.from_template(human_template)
        ])
        
        chain = prompt | llm | StrOutputParser()
        
        summary = chain.invoke({
            "account_name": account.get("name", "Customer"),
            "outcome": outcome,
            "usage_percentage": usage_percentage,
            "transcript": transcript[-1000:] if len(transcript) > 1000 else transcript  # Limit transcript length
        })
        
        return summary.strip()
        
    except Exception as e:
        logger.error(f"Failed to generate call summary: {e}")
        # Fallback summary
        return f"Call completed with outcome: {outcome}. Usage: {usage_percentage:.1f}%. Customer discussed: {len(transcript.split())} words exchanged."


def _outcome_for_ui(status: Optional[str], outcome: Optional[str], retry_count: int) -> str:
    """Map DB status/outcome to UI filter: picked_up, missed, retry."""
    status = (status or "").lower()
    outcome = (outcome or "").lower()
    if status == "completed":
        return "picked_up"
    if status in ("no_answer", "busy") or outcome in ("no_answer", "voicemail"):
        return "missed"
    if status == "failed" or (retry_count and retry_count > 0) or status == "scheduled":
        return "retry"
    return "picked_up"  # default for in_progress etc.


@router.get("/calls")
async def list_voice_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """
    List voice calls from the database for the Voice Calls page.
    Returns calls with account name, normalized for UI (outcome, date, duration).
    """
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")

    try:
        # Select columns that exist in voice_calls (duration_seconds, not duration; sentiment may be missing)
        select_cols = "id, account_id, duration_seconds, status, outcome, scheduled_at, completed_at, attempted_at, created_at, retry_count"
        try:
            result = (
                client.table("voice_calls")
                .select(f"{select_cols}, sentiment")
                .order("created_at", desc=True)
                .range(skip, skip + limit - 1)
                .execute()
            )
        except Exception:
            result = (
                client.table("voice_calls")
                .select(select_cols)
                .order("created_at", desc=True)
                .range(skip, skip + limit - 1)
                .execute()
            )
        rows = result.data or []
        if not rows:
            return {"calls": [], "total": 0}

        account_ids = list({r["account_id"] for r in rows if r.get("account_id")})
        account_map: Dict[str, str] = {}
        if account_ids:
            acc_result = (
                client.table("accounts")
                .select("id, name")
                .in_("id", account_ids)
                .execute()
            )
            for a in acc_result.data or []:
                account_map[str(a["id"])] = a.get("name") or "Unknown"

        calls: List[Dict[str, Any]] = []
        for r in rows:
            completed = r.get("completed_at") or r.get("attempted_at") or r.get("scheduled_at") or r.get("created_at")
            if isinstance(completed, str) and "T" in completed:
                date_str = completed.split("T")[0]
                try:
                    dt = datetime.fromisoformat(completed.replace("Z", "+00:00"))
                    date_display = dt.strftime("%b %d, %Y %H:%M")
                except Exception:
                    date_display = date_str
            else:
                date_display = str(completed) if completed else "—"

            # duration_seconds (DB) or duration (legacy string)
            dur = r.get("duration_seconds") or r.get("duration")
            dur_sec = None
            if dur is not None:
                if isinstance(dur, str) and "m" in dur:
                    duration_display = dur
                else:
                    try:
                        dur_sec = int(dur)
                        duration_display = f"{dur_sec // 60}m {dur_sec % 60}s" if dur_sec >= 0 else "—"
                    except Exception:
                        duration_display = str(dur)
            else:
                duration_display = "—"

            sentiment_category = (r.get("sentiment") or "").lower()
            if "positive" in sentiment_category or "very_positive" in sentiment_category:
                sentiment = "positive"
            elif "negative" in sentiment_category or "very_negative" in sentiment_category:
                sentiment = "negative"
            else:
                sentiment = "neutral"

            outcome_ui = _outcome_for_ui(r.get("status"), r.get("outcome"), r.get("retry_count") or 0)

            calls.append({
                "id": r["id"],
                "account_id": r.get("account_id"),
                "account_name": account_map.get(str(r.get("account_id") or ""), "Unknown"),
                "date": date_display,
                "duration": duration_display,
                "duration_seconds": dur_sec,
                "status": r.get("status"),
                "outcome": outcome_ui,
                "outcome_raw": r.get("outcome"),
                "sentiment": sentiment,
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
    """
    Get full details for one voice call: transcript, summary, sentiment (category + score), and keywords (why).
    Used when user clicks a call row to see the whole conversation and sentiment explanation.
    """
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Database unavailable")
    try:
        # Select without sentiment column (may not exist); sentiment from metadata. Fallback if transcript/summary missing.
        select_cols = "id, account_id, transcript, summary, outcome, status, duration_seconds, completed_at, attempted_at, scheduled_at, created_at, retry_count, metadata"
        try:
            result = (
                client.table("voice_calls")
                .select(select_cols)
                .eq("id", call_id)
                .limit(1)
                .execute()
            )
        except Exception as sel_err:
            logger.warning(f"Voice call detail select failed: {sel_err}, using minimal columns")
            result = (
                client.table("voice_calls")
                .select("id, account_id, outcome, status, duration_seconds, completed_at, attempted_at, created_at, retry_count, metadata")
                .eq("id", call_id)
                .limit(1)
                .execute()
            )
        rows = result.data or []
        if not rows:
            raise HTTPException(status_code=404, detail="Call not found")
        r = rows[0]
        metadata = r.get("metadata") or {}
        # Sentiment from metadata only (voice_calls.sentiment column may not exist)
        sentiment_cat = (metadata.get("sentiment_category") or "").lower()
        if "positive" in sentiment_cat or "very_positive" in sentiment_cat:
            sentiment_category = "positive"
        elif "negative" in sentiment_cat or "very_negative" in sentiment_cat:
            sentiment_category = "negative"
        else:
            sentiment_category = "neutral"
        sentiment_score = metadata.get("sentiment_score")
        if sentiment_score is None:
            sentiment_score = 0.0
        keywords = metadata.get("keywords") or []
        # Transcript: may be string (we store as text) or list
        transcript = r.get("transcript")
        if isinstance(transcript, list):
            transcript = "\n".join(str(x) for x in transcript) if transcript else ""
        transcript = (transcript or "").strip()
        summary = (r.get("summary") or "").strip()
        completed = r.get("completed_at") or r.get("attempted_at") or r.get("created_at")
        date_display = str(completed)[:19].replace("T", " ") if completed else "—"
        dur = r.get("duration_seconds")
        duration_display = f"{dur // 60}m {dur % 60}s" if isinstance(dur, int) and dur >= 0 else "—"
        # Account name
        account_id = r.get("account_id")
        account_name = "Unknown"
        if account_id:
            acc = client.table("accounts").select("name").eq("id", account_id).limit(1).execute()
            if acc.data and len(acc.data) > 0:
                account_name = acc.data[0].get("name") or "Unknown"
        return {
            "id": r["id"],
            "account_id": account_id,
            "account_name": account_name,
            "date": date_display,
            "duration": duration_display,
            "duration_seconds": r.get("duration_seconds"),
            "outcome": _outcome_for_ui(r.get("status"), r.get("outcome"), r.get("retry_count") or 0),
            "transcript": transcript,
            "summary": summary,
            "sentiment_category": sentiment_category,
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
    """
    Handle incoming Twilio call webhook.
    This is called when Twilio connects the call.
    """
    logger.info("VOICE WEBHOOK: handle-call received (call answered)")
    client = get_supabase_client()
    if not client:
        twiml = twilio_call_service.generate_twiml_response(
            "Sorry, our system is currently unavailable. Please try again later."
        )
        return Response(content=twiml, media_type="application/xml")
    
    # Get call_id from query parameter; CallSid from Form() param
    if not call_id:
        call_id = request.query_params.get("call_id")
    twilio_call_sid = CallSid
    
    try:
        # Get account information from call record
        if call_id:
            call_result = client.table("voice_calls").select(
                "account_id, call_type, metadata"
            ).eq("id", call_id).execute()
            
            if call_result.data:
                call_data = call_result.data[0]
                account_id = call_data.get("account_id")
                
                # Get account details
                account_result = client.table("accounts").select("*").eq("id", account_id).execute()
                account = account_result.data[0] if account_result.data else None
                
                if account:
                    # Calculate usage percentage
                    usage_percentage = calculate_plan_completion_percentage(account)
                    call_type = call_data.get("call_type", "check_in")
                    call_metadata = call_data.get("metadata") or {}
                    call_purpose = call_metadata.get("call_purpose") or None
                    
                    # Get initial conversation script (optionally tailored to purpose)
                    script = voice_conversation_handler.get_conversation_script(
                        account=account,
                        usage_percentage=usage_percentage,
                        call_type=call_type,
                        purpose=call_purpose
                    )
                    
                    # Validate script is not empty or generic
                    if not script or len(script.strip()) < 20:
                        logger.error(f"Invalid script generated for call {call_id}, using fallback")
                        script = f"Hello, this is {account.get('csm_name', 'our team')} calling from Renewal & Upsell Advisor regarding {account.get('name', 'your account')}. Your contract is {usage_percentage:.1f}% complete. Would you like to discuss renewal options?"
                    
                    # Clean script - remove any unwanted phrases - COMPREHENSIVE CHECK
                    script_lower = script.lower()
                    unwanted = [
                        "press any key", "press any", "any key",
                        "execute", "execute code", "execute your code",
                        "remove your account", "remove account", "remove this message",
                        "trial account", "trial", "upgrade", "upgrade to", "upgrade to full",
                        "full account", "you can upgrade", "have a trial", "trial version"
                    ]
                    if any(phrase in script_lower for phrase in unwanted):
                        logger.error(f"CRITICAL: Unwanted phrases detected in script!")
                        logger.error(f"Invalid script was: {script[:200]}...")
                        # Use safe, hardcoded script
                        csm_name = account.get('csm_name', 'Jennifer')
                        if not csm_name or csm_name.lower() in ['our team', 'team', '']:
                            csm_name = 'Jennifer'
                        account_name = account.get('name', 'your account')
                        script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. Your contract is {usage_percentage:.0f}% complete. Would you like to discuss renewal options?"
                    
                    # FINAL VALIDATION: Ensure script is clean and valid before using
                    if not script or len(script.strip()) < 20:
                        logger.error(f"Script is empty or too short after generation!")
                        csm_name = account.get('csm_name', 'Jennifer')
                        if not csm_name or csm_name.lower() in ['our team', 'team', '']:
                            csm_name = 'Jennifer'
                        account_name = account.get('name', 'your account')
                        script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. Your contract is {usage_percentage:.0f}% complete. Would you like to discuss renewal options?"
                    
                    # Final check for unwanted phrases one more time
                    script_lower_final = script.lower()
                    final_unwanted = ["trial", "upgrade", "execute", "press any", "remove account"]
                    if any(phrase in script_lower_final for phrase in final_unwanted):
                        logger.error(f"FINAL CHECK: Unwanted phrase still present! Replacing with safe script.")
                        csm_name = account.get('csm_name', 'Jennifer')
                        if not csm_name or csm_name.lower() in ['our team', 'team', '']:
                            csm_name = 'Jennifer'
                        account_name = account.get('name', 'your account')
                        script = f"Hello, this is {csm_name} calling from Renewal & Upsell Advisor regarding {account_name}. Your contract is {usage_percentage:.0f}% complete. Would you like to discuss renewal options?"
                    
                    logger.info(f"✅ FINAL VALIDATED script for call {call_id}: {script[:150]}...")
                    
                    # Save the initial script to database as transcript
                    try:
                        initial_transcript = f"Agent: {script}"
                        client.table("voice_calls").update({
                            "transcript": initial_transcript,
                            "status": "in_progress",
                            "metadata": {
                                **call_data.get("metadata", {}),
                                "initial_script": script,
                                "script_generated_at": datetime.now(timezone.utc).isoformat()
                            }
                        }).eq("id", call_id).execute()
                        logger.info(f"Saved initial script to database for call {call_id}")
                    except Exception as db_error:
                        logger.error(f"Failed to save initial script to database: {db_error}")
                        # Continue anyway - script will still be spoken
                    
                    # Generate TwiML response with Gather for user input
                    twiml = twilio_call_service.generate_twiml_response(
                        message=script,
                        gather_input=True,
                        action_url=f"{_webhook_base_url(request)}/api/v1/voice/handle-input?call_id={call_id}",
                        timeout=10
                    )
                    logger.info(f"Generated TwiML for call {call_id}")
                    return Response(content=twiml, media_type="application/xml")
        
        # Fallback response
        fallback_twiml = twilio_call_service.generate_twiml_response(
            "Hello, thank you for calling. How can I assist you today?"
        )
        return Response(content=fallback_twiml, media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Error handling call: {e}", exc_info=True)
        error_twiml = twilio_call_service.generate_twiml_response(
            "Sorry, we encountered an error. Please try again later."
        )
        return Response(content=error_twiml, media_type="application/xml")


def _safe_twiml_message(text: str, max_len: int = 500) -> str:
    """Return a safe message for TwiML: strip and truncate; avoid breaking XML."""
    if not text or not isinstance(text, str):
        return "I understand. Is there anything else I can help you with?"
    t = text.strip()
    if len(t) > max_len:
        t = t[: max_len - 3] + "..."
    # Avoid unescaped XML chars that could break TwiML
    for bad, good in [("&", " and "), ("<", ""), (">", "")]:
        t = t.replace(bad, good)
    return t or "I understand. Is there anything else I can help you with?"


@router.post("/handle-input")
async def handle_input(
    request: Request,
    call_id: Optional[str] = Query(None),
    SpeechResult: Optional[str] = Form(None),
    Digits: Optional[str] = Form(None)
):
    """
    Handle user input during call (speech or DTMF).
    Always returns 200 with valid TwiML so Twilio does not play "application error".
    """
    logger.info("VOICE WEBHOOK: handle-input received (user pressed key or spoke)")
    try:
        logger.info(f"Received input - SpeechResult: {SpeechResult}, Digits: {Digits}, call_id: {call_id}")
        
        client = get_supabase_client()
        if not client:
            logger.error("Database client not available")
            goodbye_twiml = twilio_call_service.generate_twiml_response("Sorry, we're experiencing technical difficulties. Please try again later.")
            return Response(content=goodbye_twiml, media_type="application/xml")
        
        if not call_id:
            call_id = request.query_params.get("call_id")
            logger.info(f"Got call_id from query params: {call_id}")
        
        if not call_id:
            logger.error("No call_id provided")
            goodbye_twiml = twilio_call_service.generate_twiml_response("Sorry, we couldn't identify your call. Please call again.")
            return Response(content=goodbye_twiml, media_type="application/xml")
        
        # Get user input - prefer speech, fallback to digits
        user_input = (SpeechResult or Digits or "").strip()
        
        # If user pressed a digit but no speech, handle it appropriately
        if Digits and not SpeechResult:
            if Digits == "1" or Digits == "9":
                user_input = "yes"
            elif Digits == "2" or Digits == "0":
                user_input = "no"
            else:
                user_input = f"pressed {Digits}"
        
        logger.info(f"Processing user input for call {call_id}: {user_input[:50]}...")
        
        # Get call and account information
        logger.info(f"Fetching call data for call_id: {call_id}")
        call_result = client.table("voice_calls").select(
            "account_id, call_type, transcript, metadata"
        ).eq("id", call_id).execute()
        
        if not call_result.data:
            logger.error(f"Call record not found for call_id: {call_id}")
            goodbye_twiml = twilio_call_service.generate_twiml_response("Thank you for calling. Goodbye.")
            return Response(content=goodbye_twiml, media_type="application/xml")
        
        call_data = call_result.data[0]
        account_id = call_data.get("account_id")
        
        if not account_id:
            logger.error(f"No account_id found for call {call_id}")
            goodbye_twiml = twilio_call_service.generate_twiml_response("Thank you for calling. Goodbye.")
            return Response(content=goodbye_twiml, media_type="application/xml")
        
        # Get account details
        logger.info(f"Fetching account data for account_id: {account_id}")
        account_result = client.table("accounts").select("*").eq("id", account_id).execute()
        account = account_result.data[0] if account_result.data else None
        
        if not account:
            logger.error(f"Account not found for account_id: {account_id}")
            goodbye_twiml = twilio_call_service.generate_twiml_response("Thank you for calling. Goodbye.")
            return Response(content=goodbye_twiml, media_type="application/xml")
        
        # Get or initialize conversation history
        transcript = call_data.get("transcript", "") or ""
        conversation_history = []
        
        # Parse existing transcript into conversation history
        if transcript:
            # Parse transcript lines into conversation history
            lines = [line.strip() for line in transcript.split('\n') if line.strip()]
            for line in lines:
                if line.startswith('Agent:'):
                    conversation_history.append({
                        'role': 'assistant',
                        'content': line.replace('Agent:', '').strip()
                    })
                elif line.startswith('User:'):
                    conversation_history.append({
                        'role': 'user',
                        'content': line.replace('User:', '').strip()
                    })
        
        # Calculate usage percentage
        usage_percentage = calculate_plan_completion_percentage(account)
        call_type = call_data.get("call_type", "check_in")
        
        # When user didn't say or press anything (timeout), prompt again so the call doesn't drop
        if not (user_input and user_input.strip()):
            logger.info("No input received (timeout); prompting user to press 1 or 2")
            response = "We didn't catch that. To continue, press 1. To end the call, press 2."
        else:
            # Generate response
            logger.info(f"Generating response for user input: {user_input[:50]}...")
            try:
                response = voice_conversation_handler.generate_dynamic_response(
                    account=account,
                    user_input=user_input,
                    conversation_context=conversation_history,
                    usage_percentage=usage_percentage,
                    call_type=call_type
                )
                if not response or len(response.strip()) < 10:
                    response = "I understand. Is there anything else I can help you with regarding your contract renewal?"
            except Exception as resp_error:
                logger.error(f"Error generating response: {resp_error}", exc_info=True)
                response = "I understand. Is there anything else I can help you with regarding your contract renewal?"
        
        # Update transcript
        updated_transcript = f"{transcript}\nUser: {user_input}\nAgent: {response}"
        
        # Check if call should end (user says goodbye, etc.)
        should_end = any(word in user_input.lower() for word in ['goodbye', 'bye', 'thank you', 'no', 'not interested'])
        
        if should_end:
            # Determine call outcome
            outcome = voice_conversation_handler.get_call_outcome(
                updated_transcript,
                usage_percentage
            )
            
            # Perform sentiment analysis
            sentiment_data = sentiment_analyzer.analyze_sentiment(updated_transcript)
            
            # Generate call summary using LangChain
            call_summary = generate_call_summary(account, updated_transcript, outcome, usage_percentage)
            
            completed_at = datetime.now(timezone.utc).isoformat()
            
            # End call and save ALL results to database
            try:
                # Update voice_calls table with complete information
                client.table("voice_calls").update({
                    "transcript": updated_transcript,
                    "summary": call_summary,
                    "status": "completed",
                    "completed_at": completed_at,
                    "outcome": outcome,
                    "metadata": {
                        **call_data.get("metadata", {}),
                        "usage_percentage": usage_percentage,
                        "sentiment_score": sentiment_data["sentiment_score"],
                        "sentiment_category": sentiment_data["sentiment_category"],
                        "keywords": sentiment_data["keywords"],
                        "conversation_turns": len([line for line in updated_transcript.split('\n') if line.strip()])
                    }
                }).eq("id", call_id).execute()
                
                # Store sentiment analysis in sentiment_analysis table
                sentiment_result = client.table("sentiment_analysis").insert({
                    "account_id": account_id,
                    "analysis_date": datetime.now(timezone.utc).date().isoformat(),
                    "sentiment_score": sentiment_data["sentiment_score"],
                    "sentiment_category": sentiment_data["sentiment_category"],
                    "source": "voice_calls",
                    "text_analyzed": updated_transcript,
                    "keywords": sentiment_data["keywords"]
                }).execute()
                
                sentiment_analysis_id = sentiment_result.data[0]["id"] if sentiment_result.data else None
                
                # Update account sentiment score and last contact date (voice contact)
                client.table("accounts").update({
                    "sentiment_score": sentiment_data["sentiment_score"],
                    "sentiment_category": sentiment_data["sentiment_category"],
                    "last_contact_date": completed_at
                }).eq("id", account_id).execute()
                
                # Log activity to activity_logs table for audit trail
                try:
                    client.table("activity_logs").insert({
                        "account_id": account_id,
                        "action": "voice_call_completed",
                        "details": {
                            "title": "Voice Call Completed",
                            "call_type": call_type,
                            "phone_number": account.get("primary_contact_phone"),
                            "outcome": outcome,
                            "usage_percentage": usage_percentage,
                            "sentiment_score": sentiment_data["sentiment_score"],
                            "sentiment_category": sentiment_data["sentiment_category"],
                            "duration_seconds": None,  # Will be updated by call-status endpoint
                            "completed_at": completed_at,
                            "summary": call_summary[:200] if call_summary else None
                        }
                    }).execute()
                except Exception as log_error:
                    logger.error(f"Failed to log activity: {log_error}")
                
                logger.info(f"Call {call_id} completed and saved to database. Outcome: {outcome}, Sentiment: {sentiment_data['sentiment_category']}")
                
            except Exception as db_error:
                logger.error(f"Failed to save call data to database: {db_error}")
                import traceback
                logger.error(traceback.format_exc())
            
            end_twiml = twilio_call_service.generate_twiml_response(
                f"{response} Thank you for your time. Have a great day!"
            )
            return Response(content=end_twiml, media_type="application/xml")
        else:
            # Continue conversation - save transcript to database
            try:
                client.table("voice_calls").update({
                    "transcript": updated_transcript,
                    "metadata": {
                        **call_data.get("metadata", {}),
                        "last_updated": datetime.now(timezone.utc).isoformat(),
                        "conversation_turns": len([line for line in updated_transcript.split('\n') if line.strip()])
                    }
                }).eq("id", call_id).execute()
            except Exception as db_error:
                logger.error(f"Failed to update transcript: {db_error}")
            
            continue_twiml = twilio_call_service.generate_twiml_response(
                message=_safe_twiml_message(response),
                gather_input=True,
                action_url=f"{_webhook_base_url(request)}/api/v1/voice/handle-input?call_id={call_id}",
                timeout=10
            )
            return Response(content=continue_twiml, media_type="application/xml")
        
    except Exception as e:
        logger.error(f"Error handling input: {e}", exc_info=True)
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
        # Always return 200 with TwiML so Twilio does not play "application error"
        error_message = "I apologize, but I'm having trouble processing your response. Would you like to speak with a representative? Please call us back or visit our website."
        error_twiml = twilio_call_service.generate_twiml_response(error_message)
        return Response(content=error_twiml, media_type="application/xml")


@router.post("/call-status")
async def call_status(
    request: Request,
    CallSid: Optional[str] = Form(None),
    CallStatus: Optional[str] = Form(None),
    CallDuration: Optional[str] = Form(None)
):
    """
    Handle Twilio call status updates.
    Handles: no-answer, busy, failed, completed, etc.
    """
    client = get_supabase_client()
    if not client:
        return {"status": "ok"}
    
    # Use Form() params (FastAPI injects these from the request body)
    twilio_call_sid = CallSid
    status = CallStatus
    duration = CallDuration
    
    # Normalize status
    status_lower = status.lower() if status else ""
    
    try:
        # Find call record by Twilio call SID
        # Try to find by metadata first, fallback to other methods if metadata column doesn't exist
        call_result = None
        try:
            call_result = client.table("voice_calls").select("id, account_id, metadata").eq(
                "metadata->>twilio_call_sid", twilio_call_sid
            ).execute()
        except Exception as meta_error:
            # Metadata column doesn't exist, try to find by other means
            # For now, log and return - we'll need to add a way to track call SIDs
            logger.warning(f"Could not query by metadata (column may not exist): {meta_error}")
            logger.info("Please add metadata column: ALTER TABLE voice_calls ADD COLUMN metadata JSONB;")
            return {"status": "ok", "message": "Metadata column not found - please add it to database"}
        
        if not call_result.data:
            logger.warning(f"Call record not found for Twilio SID: {twilio_call_sid}")
            return {"status": "ok"}
        
        call_id = call_result.data[0]["id"]
        account_id = call_result.data[0].get("account_id")
        existing_metadata = call_result.data[0].get("metadata", {})
        
        update_data = {
            "status": status_lower
        }
        
        # Handle different call statuses
        if status_lower == "no-answer":
            # User didn't pick up the call
            update_data["outcome"] = "no_answer"
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            update_data["summary"] = "Call was not answered. Customer did not pick up."
            update_data["metadata"] = {
                **existing_metadata,
                "twilio_call_sid": twilio_call_sid,
                "call_status": "no-answer",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            logger.info(f"Call {call_id} - No answer from customer")
            
        elif status_lower == "busy":
            # Line was busy
            update_data["outcome"] = "busy"
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            update_data["summary"] = "Call failed - line was busy."
            update_data["metadata"] = {
                **existing_metadata,
                "twilio_call_sid": twilio_call_sid,
                "call_status": "busy",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            logger.info(f"Call {call_id} - Line was busy")
            
        elif status_lower == "failed":
            # Call failed
            update_data["outcome"] = "failed"
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            update_data["summary"] = "Call failed - unable to connect."
            update_data["metadata"] = {
                **existing_metadata,
                "twilio_call_sid": twilio_call_sid,
                "call_status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            logger.info(f"Call {call_id} - Call failed")
            
        elif status_lower == "completed" and duration:
            # Call completed successfully
            update_data["duration_seconds"] = int(duration) if duration.isdigit() else None
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            update_data["metadata"] = {
                **existing_metadata,
                "duration_seconds": update_data["duration_seconds"],
                "twilio_call_sid": twilio_call_sid,
                "call_status": "completed"
            }
            logger.info(f"Call {call_id} - Completed successfully (duration: {duration}s)")
            
        else:
            # Other statuses (initiated, ringing, answered, etc.)
            update_data["metadata"] = {
                **existing_metadata,
                "twilio_call_sid": twilio_call_sid,
                "call_status": status_lower,
                "last_status_update": datetime.now(timezone.utc).isoformat()
            }
        
        # Update call record in database
        client.table("voice_calls").update(update_data).eq("id", call_id).execute()
        
        # Log status update to activity_logs for important statuses
        if status_lower in ["completed", "failed", "no-answer", "busy"]:
            try:
                action_name = f"voice_call_{status_lower.replace('-', '_')}"
                
                activity_details = {
                    "status": status_lower,
                    "twilio_call_sid": twilio_call_sid,
                    "completed_at": update_data.get("completed_at")
                }
                
                if duration:
                    activity_details["duration_seconds"] = int(duration) if duration.isdigit() else None
                
                client.table("activity_logs").insert({
                    "account_id": account_id,
                    "action": action_name,
                    "details": {**activity_details, "title": f"Voice Call {status_lower.capitalize()}"}
                }).execute()
                
                logger.info(f"Logged activity: {action_name} for call {call_id}")
                
            except Exception as log_error:
                logger.error(f"Failed to log call status: {log_error}")
        
        logger.info(f"Call status updated: {twilio_call_sid} -> {status_lower}")
    
    except Exception as e:
        logger.error(f"Error updating call status: {e}")
        import traceback
        logger.error(traceback.format_exc())
    
    return {"status": "ok"}


@router.post("/trigger-calls")
async def trigger_calls():
    """
    Manually trigger voice call processing for all eligible accounts (same as scheduled logic).
    """
    from app.services.voice_agent.voice_call_scheduler import process_scheduled_calls

    try:
        await process_scheduled_calls()
        return {"status": "success", "message": "Voice call processing completed"}
    except Exception as e:
        logger.error(f"Error triggering calls: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/trigger-call-to-account")
async def trigger_call_to_account(body: dict):
    """
    Manually trigger a voice call to a single account.
    Body: {"account_id": "<uuid>", "purpose": "optional reason for the call"}.
    """
    from app.services.voice_agent.voice_call_scheduler import trigger_voice_call_for_account

    account_id = body.get("account_id") if isinstance(body, dict) else None
    purpose = (body.get("purpose") or "").strip() or None if isinstance(body, dict) else None
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    result = await trigger_voice_call_for_account(account_id, purpose=purpose)
    if result.get("success"):
        return {"status": "success", "message": result.get("message"), "call_sid": result.get("call_sid")}
    raise HTTPException(status_code=400, detail=result.get("error", "Failed to trigger call"))
