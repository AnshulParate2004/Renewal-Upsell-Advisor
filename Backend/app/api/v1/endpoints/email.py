"""
Email API endpoints for manual email sending and management.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from app.core.logging import get_logger
from app.services.email.email_service import email_service
from app.services.email.scheduler import send_scheduled_emails
import os

# Load .env file
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

logger = get_logger(__name__)
router = APIRouter()


@router.post("/send-test")
async def send_test_email(to_email: str):
    """Send a test email to verify email configuration."""
    if not email_service.is_configured:
        raise HTTPException(status_code=503, detail="Email service not configured. Set SMTP_USERNAME/SMTP_PASSWORD or SENDGRID_API_KEY")
    
    subject = "Test Email - Renewal & Upsell Advisor"
    html_body = """
    <html>
    <body>
        <h1>Test Email</h1>
        <p>This is a test email from the Renewal & Upsell Advisor system.</p>
        <p>If you received this, your email configuration is working correctly!</p>
    </body>
    </html>
    """
    text_body = "Test Email\n\nThis is a test email from the Renewal & Upsell Advisor system.\n\nIf you received this, your email configuration is working correctly!"
    
    success = email_service.send_email(to_email, subject, html_body, text_body)
    
    if success:
        return {"status": "success", "message": f"Test email sent to {to_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send test email")


@router.post("/trigger-campaign")
async def trigger_email_campaign():
    """Manually trigger email campaign (sends personalized emails to customers)."""
    try:
        await send_scheduled_emails()
        return {"status": "success", "message": "Email campaign triggered successfully"}
    except Exception as e:
        logger.error(f"Error triggering email campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger email campaign: {str(e)}")


@router.get("/status")
async def get_email_status():
    """Get email service status and configuration."""
    return {
        "configured": email_service.is_configured,
        "smtp_host": email_service.smtp_host if email_service.is_configured else None,
        "from_email": email_service.from_email if email_service.is_configured else None,
        "from_name": email_service.from_name if email_service.is_configured else None,
        "has_sendgrid": bool(email_service.sendgrid_api_key)
    }
