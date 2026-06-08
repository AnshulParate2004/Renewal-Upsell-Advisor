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
        """
        Initialize email service with bare defaults.

        Credentials (SendGrid API key, from_email, from_name) are loaded from
        the Supabase `setup_config` table — NOT from environment variables.
        They are intentionally re-read from the DB on every send so that changes
        made in the Settings UI take effect immediately without a server restart.
        """
        self.smtp_host = "smtp.gmail.com"
        self.smtp_port = 587
        self.smtp_username = None
        self.smtp_password = None

        # These start empty; reload_config() fills them from Supabase each send.
        self.resend_api_key: Optional[str] = None
        self.from_email: Optional[str] = None
        self.from_name: str = "Renewal & Upsell Advisor"

        # is_configured is refreshed by reload_config() on every send.
        # It also starts as False so status checks before any send are accurate.
        self.is_configured: bool = False

        # Stores last send error so endpoints can surface a useful message.
        self.last_error: Optional[str] = None

        # Do an initial load so /email/status works correctly on startup.
        self._apply_config(self._load_email_config_from_supabase())

    # ------------------------------------------------------------------
    # Config management
    # ------------------------------------------------------------------

    def reload_config(self) -> None:
        """
        Re-read credentials from Supabase setup_config (latest row).
        Called automatically at the start of every send_email() so that
        any changes made via the Settings UI are picked up without a restart.
        """
        self._apply_config(self._load_email_config_from_supabase())

    def _apply_config(self, cfg: Dict[str, Any]) -> None:
        """Apply a config dict returned by _load_email_config_from_supabase."""
        if cfg.get("resendApiKey"):
            self.resend_api_key = cfg["resendApiKey"]
        if cfg.get("fromEmail"):
            self.from_email = cfg["fromEmail"]
        if cfg.get("fromName"):
            self.from_name = cfg["fromName"]

        # is_configured requires BOTH an API key AND a sender address.
        self.is_configured = bool(self.resend_api_key and self.from_email)

        if not self.is_configured:
            missing = []
            if not self.resend_api_key:
                missing.append("Resend API key")
            if not self.from_email:
                missing.append("from_email")
            logger.warning(
                "Email service not fully configured — missing: %s. "
                "Go to Settings → Email & Resend in the UI to configure.",
                ", ".join(missing),
            )

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
        Read email credentials from the `setup_config` table (latest row).
        Returns {} when not configured or on any error.
        """
        client = self._get_supabase_client()
        if client is None:
            return {}
        try:
            result = (
                client.table("setup_config")
                .select("resend_api_key,from_email,from_name,automation_paused")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if not rows:
                logger.warning(
                    "setup_config table is empty — no email credentials saved yet. "
                    "Open Settings → Email & Resend in the UI and save your configuration."
                )
                return {}

            row = rows[0]
            return {
                "resendApiKey": row.get("resend_api_key"),
                "fromEmail":      row.get("from_email"),
                "fromName":       row.get("from_name"),
                "automation_paused": row.get("automation_paused", False),
            }
        except Exception as e:
            logger.error(f"Failed to load email config from setup_config: {e}")
            return {}

    # ------------------------------------------------------------------
    # Public sending API
    # ------------------------------------------------------------------

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> bool:
        """
        Send an email.

        Always reloads credentials from Supabase first so that any config
        change made in the Settings UI takes effect without a server restart.

        Returns True if sent successfully, False otherwise.
        """
        # Always refresh from DB so Settings-UI changes take effect immediately.
        self.reload_config()

        if not self.is_configured:
            logger.error(
                "Email service not configured. "
                "Missing: %s. Configure via Settings → Email & Resend.",
                "Resend API key" if not self.resend_api_key else "from_email",
            )
            return False

        if self.resend_api_key:
            return self._send_via_resend(to_email, subject, html_body, text_body, to_name, reply_to)
        else:
            return self._send_via_smtp(to_email, subject, html_body, text_body, to_name, reply_to)

    # ------------------------------------------------------------------
    # Transport implementations
    # ------------------------------------------------------------------

    def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> bool:
        """Send email via SMTP."""
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email
            if reply_to:
                msg["Reply-To"] = reply_to

            if text_body:
                msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent successfully via SMTP to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email via SMTP to {to_email}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    def _send_via_resend(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
        to_name: Optional[str] = None,
        reply_to: Optional[str] = None,
    ) -> bool:
        """Send email via Resend API."""
        self.last_error = None
        try:
            import resend

            resend.api_key = self.resend_api_key

            to_field = f"{to_name} <{to_email}>" if to_name else to_email

            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_field],
                "subject": subject,
                "html": html_body,
            }

            if text_body:
                params["text"] = text_body

            if reply_to:
                params["reply_to"] = reply_to

            logger.info(f"[RESEND] Sending from='{self.from_email}' to='{to_email}' subject='{subject[:60]}'")
            response = resend.Emails.send(params)

            if response and (getattr(response, "id", None) or (isinstance(response, dict) and "id" in response)):
                logger.info(f"[RESEND] ✅ Email sent to {to_email} — id={getattr(response, 'id', response.get('id') if isinstance(response, dict) else 'unknown')}")
                return True
            else:
                # Try to extract a human-readable error from the response
                err_msg = str(response)
                if isinstance(response, dict):
                    err_msg = response.get("message") or response.get("error") or err_msg
                elif hasattr(response, "message"):
                    err_msg = response.message
                self.last_error = f"Resend rejected the request: {err_msg}"
                logger.error(f"[RESEND] ❌ {self.last_error}")
                return False

        except ImportError:
            self.last_error = "Resend library not installed. Run: pip install resend"
            logger.error(f"[RESEND] ❌ {self.last_error}")
            return False
        except Exception as e:
            self.last_error = str(e)
            logger.error(f"[RESEND] ❌ Exception sending to {to_email}: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    # ------------------------------------------------------------------
    # Bulk sending
    # ------------------------------------------------------------------

    def send_bulk_emails(
        self,
        recipients: List[Dict[str, Any]],
        subject: str,
        html_body: str,
        text_body: Optional[str] = None,
    ) -> Dict[str, bool]:
        """
        Send emails to multiple recipients.

        Args:
            recipients: List of dicts with 'email' and optionally 'name'.
            subject:    Email subject.
            html_body:  HTML email body.
            text_body:  Plain-text email body (optional).

        Returns:
            Dict mapping email addresses to success status.
        """
        results = {}
        for recipient in recipients:
            email = recipient.get("email")
            name = recipient.get("name")
            if email:
                results[email] = self.send_email(email, subject, html_body, text_body, name)
        return results


# Global email service singleton.
# Credentials are loaded from Supabase setup_config on every send_email() call,
# so no restart is needed after updating settings in the UI.
email_service = EmailService()
