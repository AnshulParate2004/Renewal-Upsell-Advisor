"""
Twilio WhatsApp service for sending outbound WhatsApp messages.
"""
import os
from typing import Optional

from twilio.rest import Client

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


def _get_twilio_credentials_from_db() -> dict:
    """Load Twilio credentials from Supabase setup_config."""
    try:
        from app.services.email.scheduler import get_supabase_client
        client = get_supabase_client()
        if not client:
            return {}
        result = (
            client.table("setup_config")
            .select("twilio_account_sid,twilio_auth_token,twilio_phone_number,twilio_whatsapp_number")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return {}
        
        row = rows[0]
        return {
            "account_sid": row.get("twilio_account_sid"),
            "auth_token": row.get("twilio_auth_token"),
            "phone_number": row.get("twilio_phone_number"),
            "whatsapp_number": row.get("twilio_whatsapp_number"),
        }
    except Exception as e:
        logger.warning(f"Could not load Twilio credentials from DB for WhatsApp: {e}")
        return {}


class WhatsAppService:
    """Service for sending WhatsApp messages via Twilio."""

    def __init__(self) -> None:
        # Prefer DB-stored credentials; fall back to env / pydantic settings
        db = _get_twilio_credentials_from_db()

        self.account_sid = (
            db.get("account_sid")
            or os.getenv("TWILIO_ACCOUNT_SID")
            or settings.TWILIO_ACCOUNT_SID
        )
        self.auth_token = (
            db.get("auth_token")
            or os.getenv("TWILIO_AUTH_TOKEN")
            or settings.TWILIO_AUTH_TOKEN
        )
        # Prefer dedicated WhatsApp number; fall back to voice number
        self.phone_number = (
            db.get("whatsapp_number")
            or os.getenv("TWILIO_WHATSAPP_NUMBER")
            or db.get("phone_number")
            or os.getenv("TWILIO_WHATSAPP_PHONE_NUMBER")
            or os.getenv("TWILIO_PHONE_NUMBER")
            or settings.TWILIO_WHATSAPP_NUMBER
            or settings.TWILIO_PHONE_NUMBER
        )

        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured for WhatsApp")
            self.client: Optional[Client] = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
            source = "DB" if db.get("account_sid") else "env"
            logger.info(f"Twilio WhatsApp client initialized from {source}")

    def is_configured(self) -> bool:
        return self.client is not None and bool(self.phone_number)

    def _format_whatsapp_number(self, phone: str) -> str:
        phone = (phone or "").strip()
        if not phone:
            raise ValueError("Empty WhatsApp phone")
        if phone.startswith("whatsapp:"):
            return phone
        cleaned = "".join(ch for ch in phone if ch.isdigit() or ch == "+")
        if not cleaned:
            raise ValueError(f"Invalid WhatsApp phone: {phone!r}")
        if not cleaned.startswith("+"):
            cleaned = "+" + cleaned
        return f"whatsapp:{cleaned}"

    def send_message(self, to_phone: str, body: str) -> Optional[str]:
        """Send a WhatsApp message. Returns Twilio SID or None on error."""
        if not self.client or not self.phone_number:
            logger.error("WhatsApp service not configured")
            return None
        if not body or not body.strip():
            logger.error("Cannot send empty WhatsApp message")
            return None

        try:
            from_number = self._format_whatsapp_number(self.phone_number)
            to_number = self._format_whatsapp_number(to_phone)
            msg = self.client.messages.create(
                body=body.strip(),
                from_=from_number,
                to=to_number,
            )
            logger.info(f"WhatsApp message sent to {to_number}: {msg.sid}")
            return msg.sid
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {to_phone}: {e}")
            return None


def get_whatsapp_service() -> WhatsAppService:
    """
    Factory that returns a WhatsAppService with fresh DB credentials.
    Call this inside background tasks / request handlers instead of using
    the module-level singleton when up-to-date credentials are required.
    """
    return WhatsAppService()


# Module-level singleton (initialised at import time from env/DB snapshot).
# For tasks that need the latest DB credentials, call get_whatsapp_service() instead.
whatsapp_service = WhatsAppService()
