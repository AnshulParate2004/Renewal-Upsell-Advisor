"""
Twilio WhatsApp service for sending outbound WhatsApp messages.
"""
import os
from typing import Optional

from twilio.rest import Client

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class WhatsAppService:
    """Service for sending WhatsApp messages via Twilio."""

    def __init__(self) -> None:
        # Use same credentials as voice calls
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID") or settings.TWILIO_ACCOUNT_SID
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN") or settings.TWILIO_AUTH_TOKEN
        # Prefer dedicated WhatsApp number if provided; fall back to generic Twilio number.
        self.phone_number = (
            os.getenv("TWILIO_WHASTASPP_PHONE_NUMBER")  # user-requested env var name
            or os.getenv("TWILIO_WHATSAPP_PHONE_NUMBER")  # common spelling, as a fallback
            or os.getenv("TWILIO_PHONE_NUMBER")
            or settings.TWILIO_PHONE_NUMBER
        )

        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured for WhatsApp")
            self.client: Optional[Client] = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio WhatsApp client initialized")

    def is_configured(self) -> bool:
        return self.client is not None and bool(self.phone_number)

    def _format_whatsapp_number(self, phone: str) -> str:
        phone = (phone or "").strip()
        if not phone:
            raise ValueError("Empty WhatsApp phone")
        if phone.startswith("whatsapp:"):
            return phone
        # Normalize: remove spaces/dashes and ensure leading + for E.164
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


whatsapp_service = WhatsAppService()

