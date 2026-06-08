"""
Twilio Call Service for making outbound voice calls and sending SMS.
Replaces Cube Software integration.
"""
import os
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather
from app.core.logging import get_logger

logger = get_logger(__name__)

def _get_twilio_credentials_from_db() -> Dict[str, Optional[str]]:
    """Load Twilio credentials from Supabase setup_config."""
    try:
        from app.services.email.scheduler import get_supabase_client
        client = get_supabase_client()
        if not client:
            return {}
        result = (
            client.table("setup_config")
            .select("twilio_account_sid,twilio_auth_token,twilio_phone_number")
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
        }
    except Exception as e:
        logger.warning(f"Could not load Twilio credentials from DB: {e}")
        return {}

class TwilioCallService:
    """Service for making outbound calls and SMS via Twilio Programmable Voice/Messaging."""

    def __init__(self):
        db = _get_twilio_credentials_from_db()
        self.account_sid = db.get("account_sid")
        self.auth_token = db.get("auth_token")
        self.phone_number = db.get("phone_number")

        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio client initialized")

    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.phone_number)

    def make_call(
        self,
        to_phone: str,
        webhook_url: str,
        from_phone: Optional[str] = None,
        status_callback: Optional[str] = None,
    ) -> Optional[str]:
        """Initiates an outbound call."""
        if not self.client:
            logger.error("Twilio client not initialized")
            return None
            
        from_number = from_phone or self.phone_number
        if not from_number:
            logger.error("No from_phone provided and no default configured")
            return None
            
        try:
            call_params = {
                "to": to_phone,
                "from_": from_number,
                "url": webhook_url,
                "method": "POST"
            }
            if status_callback:
                call_params["status_callback"] = status_callback
                call_params["status_callback_event"] = ['initiated', 'ringing', 'answered', 'completed']
                call_params["status_callback_method"] = "POST"

            call = self.client.calls.create(**call_params)
            logger.info(f"Twilio call initiated to {to_phone}: {call.sid}")
            return call.sid
            
        except Exception as e:
            logger.error(f"Exception making Twilio call to {to_phone}: {e}")
            return None


    def generate_twiml_response(
        self,
        message: str,
        gather_input: bool = False,
        action_url: Optional[str] = None,
        timeout: int = 10,
    ) -> str:
        """Generates a TwiML XML response payload."""
        response = VoiceResponse()
        
        fallback = "Hello, thank you for calling. How can I assist you today?"
        if not message or len(message.strip()) < 10:
            message = fallback

        if gather_input:
            gather = Gather(
                input='speech',
                action=action_url,
                method='POST',
                timeout=timeout,
                speechTimeout='auto'
            )
            gather.say(message)
            response.append(gather)
            response.say("We didn't receive any input. Goodbye.")
        else:
            response.say(message)
            
        return str(response)

twilio_call_service = TwilioCallService()

def get_twilio_client() -> TwilioCallService:
    return TwilioCallService()
