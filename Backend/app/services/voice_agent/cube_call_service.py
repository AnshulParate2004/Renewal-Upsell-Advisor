"""
Cube Software Call Service for making outbound voice calls.
"""
import os
import requests
from datetime import datetime
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

def _get_cube_credentials_from_db() -> Dict[str, Optional[str]]:
    """Load Cube Software credentials from Supabase setup_config."""
    try:
        from app.services.email.scheduler import get_supabase_client
        client = get_supabase_client()
        if not client:
            return {}
        result = (
            client.table("setup_config")
            .select("cube_api_url,cube_api_key")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return {}
        
        row = rows[0]
        return {
            "api_url": row.get("cube_api_url"),
            "api_key": row.get("cube_api_key"),
        }
    except Exception as e:
        logger.warning(f"Could not load Cube credentials from DB: {e}")
        return {}

class CubeCallService:
    """Service for making outbound calls via Cube Software."""

    def __init__(self):
        db = _get_cube_credentials_from_db()
        self.api_url = db.get("api_url") or os.getenv("CUBE_API_URL")
        self.api_key = db.get("api_key") or os.getenv("CUBE_API_KEY")

        if not self.api_url or not self.api_key:
            logger.warning("Cube Software credentials not configured")
        else:
            logger.info("Cube Software client initialized")

    def is_configured(self) -> bool:
        return bool(self.api_url and self.api_key)

    def make_call(
        self,
        to_phone: str,
        webhook_url: Optional[str] = None,
        from_phone: Optional[str] = None,
        status_callback: Optional[str] = None,
    ) -> Optional[str]:
        # For Click2Call, Cube API might not need webhook_url or status_callback from the request
        # since it's preconfigured on the campaign ID, but we keep the signature for compatibility.
        
        click2call_url = os.getenv("CUBE_CLICK2CALL_URL", "https://cubesoftservices.com/QuickCallRHICL/Click2Call.php")
        campaign_id = os.getenv("CUBE_CAMPAIGN_ID", "Ailife_SIPBot")
        did = os.getenv("CUBE_DID", "08037367028")
        
        try:
            payload = {
                "campaign_id": campaign_id,
                "did": did,
                "phone": to_phone
            }
            # The manual uses url-encoded form data (-d from curl)
            response = requests.post(click2call_url, data=payload, timeout=10)
            
            if response.status_code in (200, 201, 202):
                call_id = f"cube_outbound_{int(datetime.now().timestamp())}"
                logger.info(f"Click2Call initiated via Cube: {call_id} to {to_phone}. Response: {response.text[:100]}")
                return call_id
            else:
                logger.error(f"Failed to make Cube call to {to_phone}: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Exception making Cube call to {to_phone}: {e}")
            return None

    def generate_webhook_response(
        self,
        message: str,
        gather_input: bool = False,
        action_url: Optional[str] = None,
        num_digits: int = 1,
        timeout: int = 10,
    ) -> str:
        """Generates a JSON response payload for the webhook."""
        import json
        
        fallback = "Hello, thank you for calling. How can I assist you today?"
        if not message or len(message.strip()) < 10:
            message = fallback

        response_data: Dict[str, Any] = {
            "action": "play_and_gather" if gather_input else "play",
            "message": message,
        }
        
        if gather_input:
            response_data["gather_options"] = {
                "action_url": action_url,
                "timeout": timeout,
                "num_digits": num_digits,
                "input": ["speech", "dtmf"]
            }
            
        return json.dumps(response_data)

cube_call_service = CubeCallService()

def get_cube_client() -> CubeCallService:
    return CubeCallService()
