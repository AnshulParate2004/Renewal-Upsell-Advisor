"""
Twilio Call Service for making outbound voice calls.
"""
import os
from typing import Optional, Dict, Any
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather, Say
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TwilioCallService:
    """Service for making outbound calls via Twilio."""
    
    def __init__(self):
        """Initialize Twilio client."""
        # Read from .env first, then fallback to settings
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID") or settings.TWILIO_ACCOUNT_SID
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN") or settings.TWILIO_AUTH_TOKEN
        self.phone_number = os.getenv("TWILIO_PHONE_NUMBER") or settings.TWILIO_PHONE_NUMBER
        
        if not self.account_sid or not self.auth_token:
            logger.warning("Twilio credentials not configured")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
            logger.info("Twilio client initialized")
    
    def is_configured(self) -> bool:
        """Check if Twilio is configured."""
        return self.client is not None
    
    def make_call(
        self,
        to_phone: str,
        webhook_url: str,
        from_phone: Optional[str] = None,
        status_callback: Optional[str] = None
    ) -> Optional[str]:
        """
        Make an outbound call.
        
        Args:
            to_phone: Recipient phone number (E.164 format)
            webhook_url: URL to handle call events (Twilio will POST to this)
            from_phone: Caller ID (defaults to TWILIO_PHONE_NUMBER)
            status_callback: URL for call status updates
            
        Returns:
            Call SID if successful, None otherwise
        """
        if not self.client:
            logger.error("Twilio not configured. Cannot make call.")
            return None
        
        if not from_phone:
            from_phone = self.phone_number
        
        if not from_phone:
            logger.error("No Twilio phone number configured")
            return None
        
        try:
            call = self.client.calls.create(
                to=to_phone,
                from_=from_phone,
                url=webhook_url,
                status_callback=status_callback,
                status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
                record=True,  # Record the call
                recording_status_callback=status_callback.replace('/call-status', '/recording-status') if status_callback else None
            )
            
            logger.info(f"Call initiated: {call.sid} to {to_phone}")
            return call.sid
            
        except Exception as e:
            logger.error(f"Failed to make call to {to_phone}: {e}")
            return None
    
    def generate_twiml_response(
        self,
        message: str,
        gather_input: bool = False,
        action_url: Optional[str] = None,
        num_digits: int = 1,
        timeout: int = 10
    ) -> str:
        """
        Generate TwiML response for voice call.
        
        Args:
            message: Text to speak
            gather_input: Whether to gather user input
            action_url: URL to send gathered input to
            num_digits: Number of digits to gather (if gather_input=True)
            timeout: Timeout in seconds for gathering input
            
        Returns:
            TwiML XML string
        """
        # Clean message - remove any default/system messages
        if not message or len(message.strip()) < 10:
            logger.warning("Message is empty or too short, using safe fallback")
            message = "Hello, thank you for calling Renewal & Upsell Advisor. How can I assist you today?"
        
        # Remove any unwanted default messages - COMPREHENSIVE CHECK
        unwanted_phrases = [
            "press any key",
            "press any",
            "any key",
            "execute",
            "execute code",
            "execute your code",
            "remove your account",
            "remove account",
            "anytime press",
            "remove this message",
            "trial account",
            "trial",
            "upgrade",
            "upgrade to",
            "upgrade to full",
            "full account",
            "you can upgrade",
            "have a trial",
            "trial version"
        ]
        message_lower = message.lower()
        for phrase in unwanted_phrases:
            if phrase in message_lower:
                logger.error(f"CRITICAL: Detected unwanted phrase '{phrase}' in message!")
                logger.error(f"Original message was: {message[:200]}...")
                message = "Hello, thank you for calling Renewal & Upsell Advisor. How can I assist you today?"
                break
        
        # FINAL CHECK: One more validation before generating TwiML
        message_lower_final = message.lower()
        final_check_phrases = ["trial", "upgrade", "execute", "press any", "remove account"]
        if any(phrase in message_lower_final for phrase in final_check_phrases):
            logger.error(f"FINAL TWIML CHECK: Unwanted phrase detected! Using safe fallback.")
            message = "Hello, thank you for calling Renewal & Upsell Advisor. How can I assist you today?"
        
        # Ensure message is not empty
        if not message or len(message.strip()) < 10:
            logger.error(f"Message is empty in TwiML generation! Using safe fallback.")
            message = "Hello, thank you for calling Renewal & Upsell Advisor. How can I assist you today?"
        
        logger.info(f"✅ Final validated message for TwiML: {message[:100]}...")
        
        response = VoiceResponse()
        
        if gather_input:
            gather = Gather(
                input='speech dtmf',
                action=action_url,
                method='POST',
                num_digits=num_digits,
                timeout=timeout,
                speech_timeout='auto'
            )
            # Use clear, natural voice settings
            gather.say(message, voice='alice', language='en-US')
            response.append(gather)
            # Add redirect in case of timeout/no input
            response.redirect(action_url or '', method='POST')
        else:
            response.say(message, voice='alice', language='en-US')
        
        return str(response)
    
    def get_call_status(self, call_sid: str) -> Optional[Dict[str, Any]]:
        """
        Get call status from Twilio.
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            Call status dictionary or None
        """
        if not self.client:
            return None
        
        try:
            call = self.client.calls(call_sid).fetch()
            return {
                'sid': call.sid,
                'status': call.status,
                'duration': call.duration,
                'from': call.from_,
                'to': call.to,
                'start_time': call.start_time.isoformat() if call.start_time else None,
                'end_time': call.end_time.isoformat() if call.end_time else None
            }
        except Exception as e:
            logger.error(f"Failed to get call status for {call_sid}: {e}")
            return None
    
    def get_call_recording(self, call_sid: str) -> Optional[str]:
        """
        Get call recording URL.
        
        Args:
            call_sid: Twilio Call SID
            
        Returns:
            Recording URL or None
        """
        if not self.client:
            return None
        
        try:
            recordings = self.client.recordings.list(call_sid=call_sid)
            if recordings:
                return recordings[0].uri
            return None
        except Exception as e:
            logger.error(f"Failed to get recording for call {call_sid}: {e}")
            return None


# Global instance
twilio_call_service = TwilioCallService()
