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


def _build_chat_messages(history: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Convert conversation rows into Azure OpenAI chat messages.
    history: list of {direction, message} sorted oldest->newest.
    """
    messages: List[Dict[str, str]] = [
        {
            "role": "system",
            "content": (
                "You are a helpful WhatsApp chatbot for a B2B SaaS product called "
                "'Renewal & Upsell Advisor'. Reply concisely in 1-3 short paragraphs. "
                "Be friendly, professional, and avoid code or markdown."
            ),
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

    # 1. Insert user message
    try:
        client.table("whatsapp_conversations").insert(
            {
                "phone_number": from_phone,
                "direction": "user",
                "message": incoming,
            }
        ).execute()
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

    # 3. Build prompt and call Azure OpenAI
    try:
        messages = _build_chat_messages(history_rows or [{"direction": "user", "message": incoming}])
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
    try:
        log_activity(
            "whatsapp_message_received",
            details={"phone_number": from_phone, "message": incoming},
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

    # Send via Twilio WhatsApp
    sid = whatsapp_service.send_message(to_phone, text)
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

