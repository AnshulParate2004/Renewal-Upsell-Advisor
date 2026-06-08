"""Account history for history-aware NBA recommendations."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        s = str(value).replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def _within_days(dt: Optional[datetime], days: int) -> bool:
    if not dt:
        return False
    now = datetime.now(timezone.utc)
    return (now - dt) <= timedelta(days=days)


def fetch_account_history(client: Any, account_id: str) -> Dict[str, List[Dict[str, Any]]]:
    history: Dict[str, List[Dict[str, Any]]] = {
        "voice_calls": [],
        "email_campaigns": [],
        "activity_logs": [],
    }
    try:
        calls = (
            client.table("voice_calls")
            .select("id, outcome, status, sentiment_category, completed_at, created_at")
            .eq("account_id", account_id)
            .order("completed_at", desc=True)
            .limit(10)
            .execute()
        )
        history["voice_calls"] = calls.data or []
    except Exception:
        pass

    try:
        emails = (
            client.table("email_campaigns")
            .select("id, campaign_type, status, sent_at, created_at")
            .eq("account_id", account_id)
            .order("sent_at", desc=True)
            .limit(10)
            .execute()
        )
        history["email_campaigns"] = emails.data or []
    except Exception:
        pass

    try:
        logs = (
            client.table("activity_logs")
            .select("id, action, details, created_at")
            .eq("account_id", account_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        history["activity_logs"] = logs.data or []
    except Exception:
        pass

    return history


def adjust_for_history(
    stage: str,
    channel: str,
    action: str,
    channel_reason: str,
    history: Dict[str, List[Dict[str, Any]]],
) -> Tuple[str, str, str, List[str]]:
    """
    Refine channel/action based on past outreach.
    Returns (channel, action, channel_reason, history_insights).
    """
    insights: List[str] = []
    calls = history.get("voice_calls") or []
    emails = history.get("email_campaigns") or []

    recent_calls = [
        c for c in calls
        if _within_days(_parse_dt(c.get("completed_at") or c.get("created_at")), 7)
    ]
    recent_emails = [
        e for e in emails
        if _within_days(_parse_dt(e.get("sent_at") or e.get("created_at")), 7)
    ]

    if recent_calls:
        insights.append(f"{len(recent_calls)} voice call(s) in the last 7 days")
    if recent_emails:
        insights.append(f"{len(recent_emails)} email(s) sent in the last 7 days")

    if stage != "protect":
        return channel, action, channel_reason, insights

    successful_calls = [
        c for c in recent_calls
        if (c.get("outcome") or "").lower() not in ("no_answer", "busy", "failed", "voicemail")
        and (c.get("status") or "").lower() in ("completed", "answered", "")
    ]
    negative_calls = [
        c for c in recent_calls
        if (c.get("sentiment_category") or "").lower() in ("negative", "very_negative")
    ]

    if successful_calls and not negative_calls:
        return (
            "email",
            "Send executive follow-up email — document outcomes from recent call",
            "Voice outreach completed in the last 7 days; send written retention summary before next touch.",
            insights + ["Prior call succeeded — switching to email for documentation"],
        )

    if negative_calls:
        return (
            "call",
            "Executive escalation call — prior call flagged negative sentiment",
            "Recent voice interaction had negative sentiment; escalate with executive sponsor on live call.",
            insights + ["Last call sentiment was negative — escalation recommended"],
        )

    if recent_emails and not recent_calls:
        return (
            "call",
            "Schedule executive call — email sent with no voice follow-up",
            "Critical account received email in past 7 days without voice escalation; schedule call now.",
            insights + ["Email sent recently without call — voice escalation needed"],
        )

    if recent_calls and not successful_calls:
        return (
            "message",
            "Send WhatsApp check-in — recent call attempts unanswered",
            "Voice calls did not connect; try WhatsApp for faster partner response on critical account.",
            insights + ["Recent calls unanswered — alternate channel suggested"],
        )

    return channel, action, channel_reason, insights
