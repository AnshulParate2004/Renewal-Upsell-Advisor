"""
Email service for sending automated emails.
Supports SMTP and SendGrid.
"""
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from app.core.logging import get_logger
from app.core.config import settings

logger = get_logger(__name__)

# Load .env file
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)


class EmailService:
    """Email service for sending emails via SMTP or SendGrid."""
    
    def __init__(self):
        """Initialize email service with configuration.

        IMPORTANT: SMTP credentials are NOT loaded from environment variables.
        They must be configured via the Settings UI, which persists to the
        Supabase `app_settings` table (config.email).
        """
        # Default host/port only; no credentials from env
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.smtp_username = None
        self.smtp_password = None
        self.from_email = None
        self.from_name = "Renewal & Upsell Advisor"

        # SendGrid configuration (optional, still from env/settings)
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY") or settings.SENDGRID_API_KEY

        # Load dynamic email config from Supabase app_settings.email
        email_cfg = self._load_email_config_from_supabase()
        if email_cfg:
            if email_cfg.get("sendgridApiKey"):
                self.sendgrid_api_key = email_cfg.get("sendgridApiKey")
            self.from_email = email_cfg.get("fromEmail") or self.from_email
            self.from_name = email_cfg.get("fromName") or self.from_name

        # Check if email is configured
        self.is_configured = bool(self.sendgrid_api_key)

        if not self.is_configured:
            logger.warning(
                "Email service not configured. Go to Settings → Email & SMTP to configure SendGrid API Key."
            )
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
            to_name: Recipient name (optional)
            reply_to: Reply-to email address (optional)
            
        Returns:
            True if email sent successfully, False otherwise
        """
        if not self.is_configured:
            logger.error("Email service not configured. Cannot send email.")
            return False
        
        # Try SendGrid first if API key is available
        if self.sendgrid_api_key:
            return self._send_via_sendgrid(to_email, subject, html_body, text_body, to_name, reply_to)
        else:
            return self._send_via_smtp(to_email, subject, html_body, text_body, to_name, reply_to)

    def _get_supabase_client(self):
        """Local helper to get Supabase client without creating import cycles."""
        try:
            from supabase import create_client
        except ImportError:
            logger.debug("supabase-py not installed; skipping email config from Supabase.")
            return None

        supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
        supabase_key = (
            os.getenv("SUPABASE_SERVICE_ROLE_SECRET")
            or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            or os.getenv("SUPABASE_KEY")
            or os.getenv("SUPABASE_ANON_KEY")
            or settings.SUPABASE_KEY
        )

        if not supabase_url or not supabase_key:
            return None

        try:
            return create_client(supabase_url, supabase_key)
        except Exception as e:
            logger.error(f"Failed to create Supabase client for email config: {e}")
            return None

    def _load_email_config_from_supabase(self) -> Dict[str, Any]:
        """
        Read email config from the new `setup_config` table.
        Returns {} when not configured or on error.
        """
        client = self._get_supabase_client()
        if client is None:
            return {}
        try:
            result = (
                client.table("setup_config")
                .select("sendgrid_api_key,from_email,from_name,automation_paused")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if not rows:
                return {}
            
            row = rows[0]
            # Map SQL snake_case to the JS/old JSON camelCase expected downstream
            # or just return it mapped
            return {
                "sendgridApiKey": row.get("sendgrid_api_key"),
                "fromEmail": row.get("from_email"),
                "fromName": row.get("from_name"),
                "automation_paused": row.get("automation_paused", False)
            }
        except Exception as e:
            logger.error(f"Failed to load email config from setup_config: {e}")
            return {}
    
    def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send email via SMTP."""
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            if reply_to:
                msg['Reply-To'] = reply_to
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_body, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None,
        reply_to: Optional[str] = None
    ) -> bool:
        """Send email via SendGrid API."""
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            sg = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
            
            from_email = Email(self.from_email, self.from_name)
            to_email_obj = To(to_email, to_name) if to_name else To(to_email)
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email_obj,
                subject=subject,
                html_content=Content("text/html", html_body)
            )
            
            if text_body:
                message.add_content(Content("text/plain", text_body))
            
            if reply_to:
                message.reply_to = Email(reply_to)
            
            response = sg.send(message)
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully via SendGrid to {to_email}")
                return True
            else:
                logger.error(f"SendGrid API error: {response.status_code} - {response.body}")
                return False
                
        except ImportError:
            logger.error("SendGrid library not installed. Install with: pip install sendgrid")
            return False
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid to {to_email}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def send_bulk_emails(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> Dict[str, bool]:
        """
        Send emails to multiple recipients.
        
        Args:
            recipients: List of dicts with 'email' and optionally 'name'
            subject: Email subject
            html_body: HTML email body
            text_body: Plain text email body (optional)
            
        Returns:
            Dict mapping email addresses to success status
        """
        results = {}
        for recipient in recipients:
            email = recipient.get('email')
            name = recipient.get('name')
            if email:
                results[email] = self.send_email(email, subject, html_body, text_body, name)
        return results


# Global email service instance
email_service = EmailService()
