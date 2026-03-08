"""
Write activity log rows to the existing Supabase activity_logs table.
Does not create any table; only inserts into activity_logs.
Logs: ml_pipeline_trigger, ml_pipeline_run, email_scheduler_run,
email_scheduler_completed, voice_scheduler_run, voice_scheduler_completed,
renewal_pipeline_scheduler_run, renewal_pipeline_scheduler_completed,
campaign_created, campaign_run, plus send_email and voice_call_initiated.
"""
from typing import Any, Dict, Optional
from uuid import UUID

from app.core.logging import get_logger

logger = get_logger(__name__)


def _get_supabase_client():
    """Get Supabase client (shared with email scheduler)."""
    from app.services.email.scheduler import get_supabase_client
    return get_supabase_client()


def log_activity(
    action: str,
    *,
    account_id: Optional[str] = None,
    title: Optional[str] = None,
    sentiment: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Append one row to Supabase activity_logs.

    Args:
        action: Action name (e.g. ml_pipeline_trigger, email_scheduler_run, email_sent, voice_scheduler_run, voice_call_initiated).
        account_id: Optional account UUID (string).
        title: Optional title for the activity log.
        sentiment: Optional sentiment string (positive, neutral, negative).
        details: Optional JSON-serializable dict (counts, source, campaign_type, etc.).

    Returns:
        True if insert succeeded, False otherwise (logs error).
    """
    client = _get_supabase_client()
    if not client:
        logger.debug("Activity log skipped: Supabase not configured")
        return False

    # Use only columns that exist in Supabase activity_logs: id, account_id, action, entity_type, entity_id, details, ip_address, user_agent, created_at (no title/sentiment).
    details_payload = dict(details or {})
    if title is not None:
        details_payload["title"] = title
    if sentiment is not None:
        details_payload["sentiment"] = sentiment

    row = {
        "action": action,
        "details": details_payload,
    }
    if account_id is not None:
        row["account_id"] = str(account_id) if isinstance(account_id, UUID) else account_id

    try:
        client.table("activity_logs").insert(row).execute()
        return True
    except Exception as e:
        logger.warning("Failed to write activity_logs: %s", e)
        return False
