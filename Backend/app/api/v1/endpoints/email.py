"""
Email API endpoints for manual email sending and management.
"""
from fastapi import APIRouter, HTTPException, Body
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from app.core.logging import get_logger
from app.services.email.email_service import email_service
from app.services.email.scheduler import send_scheduled_emails, send_email_to_single_account, generate_email_preview_for_account
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
async def trigger_email_campaign(body: Optional[dict] = Body(None)):
    """Manually trigger email campaign (sends personalized emails to all eligible customers). Body may include optional 'purpose' to tailor all messages."""
    purpose = (body or {}).get("purpose") if isinstance(body, dict) else None
    purpose = str(purpose).strip() or None
    try:
        await send_scheduled_emails(purpose=purpose)
        return {"status": "success", "message": "Email campaign triggered successfully"}
    except Exception as e:
        logger.error(f"Error triggering email campaign: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger email campaign: {str(e)}")


@router.get("/preview")
async def get_email_preview(account_id: str, purpose: Optional[str] = None):
    """Generate personalized email preview for an account (subject, html_body, text_body). Optional purpose: tailor message to this intent."""
    result = await generate_email_preview_for_account(account_id, purpose=purpose or None)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/send-to-account")
async def send_email_to_account(body: dict):
    """
    Send email to one account. Body: {"account_id": "<uuid>"} for auto-generated personalized email,
    or {"account_id": "<uuid>", "subject": "...", "html_body": "...", "text_body": "..."} for custom content.
    Optional "purpose" field to tailor auto-generated content.
    """
    account_id = body.get("account_id") if isinstance(body, dict) else None
    if not account_id:
        raise HTTPException(status_code=400, detail="account_id is required")
    subject = body.get("subject") if isinstance(body, dict) else None
    html_body = body.get("html_body") if isinstance(body, dict) else None
    text_body = body.get("text_body") if isinstance(body, dict) else None
    purpose = body.get("purpose") if isinstance(body, dict) else None
    result = await send_email_to_single_account(account_id, subject=subject, html_body=html_body, text_body=text_body, purpose=purpose)
    if result.get("success"):
        return {"status": "success", "message": result.get("message", "Email sent."), "email_type": result.get("email_type")}
    raise HTTPException(status_code=400, detail=result.get("error", "Failed to send email"))


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
