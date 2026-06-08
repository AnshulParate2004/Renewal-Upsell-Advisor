"""
Resend Inbound Email Poller.

Resend does not push webhooks for incoming emails — instead it provides a
polling API (`resend.Emails.Receiving.list()`).

This module:
  1. Polls the Resend Receiving API every N seconds (default 120s).
  2. For each email not already processed, finds the matching account by sender.
  3. Runs LLM intent detection and stores the reply in `email_campaigns`.
  4. Tracks processed IDs in Supabase (column: resend_inbound_id on email_campaigns)
     so we never process the same reply twice.
"""

import asyncio
import os
import email.utils
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.core.logging import get_logger

logger = get_logger(__name__)

POLL_INTERVAL_SECONDS = 120   # poll every 2 minutes


def _get_resend_api_key() -> Optional[str]:
    """Load Resend API key from Supabase setup_config or env."""
    try:
        from app.services.email.scheduler import get_supabase_client
        client = get_supabase_client()
        if client:
            result = (
                client.table("setup_config")
                .select("resend_api_key")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if rows and rows[0].get("resend_api_key"):
                return rows[0]["resend_api_key"]
    except Exception:
        pass
    return os.getenv("RESEND_API_KEY")


def _get_already_processed_ids(client) -> set:
    """
    Return set of resend_id values already in resend_inbound_ids table (persistent).
    Falls back to email_campaigns metadata if the new table doesn't exist yet.
    """
    try:
        # Primary source: persistent ledger table
        result = (
            client.table("resend_inbound_ids")
            .select("resend_id")
            .order("created_at", desc=True)
            .limit(1000)
            .execute()
        )
        if result.data:
            return {row.get("resend_id") for row in result.data if row.get("resend_id")}
    except Exception as e:
        logger.debug(f"[INBOUND-POLLER] resend_inbound_ids table not accessible yet: {e}")

    # Fallback/Legacy: check email_campaigns metadata
    try:
        result = (
            client.table("email_campaigns")
            .select("metadata")
            .eq("campaign_type", "inbound_reply")
            .order("sent_at", desc=True)
            .limit(200)
            .execute()
        )
        ids = set()
        for row in (result.data or []):
            meta = row.get("metadata") or {}
            rid = meta.get("resend_inbound_id")
            if rid:
                ids.add(rid)
        return ids
    except Exception as e:
        logger.warning(f"[INBOUND-POLLER] Could not fetch processed IDs from any source: {e}")
        return set()


def _update_persistent_ledger(client, resend_id: str, account_id: str = None):
    """Mark a Resend ID as processed in the persistent table."""
    if not resend_id:
        return
    try:
        client.table("resend_inbound_ids").insert({
            "resend_id": resend_id,
            "account_id": account_id
        }).execute()
        logger.info(f"[INBOUND-POLLER] Persistent ledger updated for {resend_id}")
    except Exception as e:
        # Likely the ID already exists or table isn't created yet
        logger.debug(f"[INBOUND-POLLER] Persistent ledger update skipped/failed: {e}")


def _process_single_email(client, resend_email: dict) -> bool:
    """
    Process one Resend inbound email.
    Returns True if handled, False if skipped (no matching account).
    """
    from app.api.v1.endpoints.email import _detect_intent_and_act

    resend_id  = resend_email.get("id", "")
    from_raw   = resend_email.get("from", "") or ""
    subject    = resend_email.get("subject", "") or ""
    body_text  = resend_email.get("text", "") or resend_email.get("plain_text", "") or ""
    body_html  = resend_email.get("html", "") or ""

    _, from_email = email.utils.parseaddr(str(from_raw))
    if not from_email:
        logger.debug(f"[INBOUND-POLLER] Skipping email {resend_id}: no valid from address")
        return False

    # Find matching account
    try:
        acc_res = client.table("accounts").select("id, name, primary_contact_email, csm_email").or_(
            f"primary_contact_email.ilike.%{from_email}%,csm_email.ilike.%{from_email}%"
        ).execute()

        account = None
        if acc_res.data:
            for row in acc_res.data:
                p_email = (row.get("primary_contact_email") or "").strip()
                c_email = (row.get("csm_email") or "").strip()
                if p_email.lower() == from_email.lower() or c_email.lower() == from_email.lower():
                    account = row
                    break

        if not account:
            logger.info(f"[INBOUND-POLLER] No account matches sender {from_email} — marking as processed (orphan)")
            # 🚨 CRITICAL FIX: Record in persistent ledger even if orphan to prevent infinite re-polling
            _update_persistent_ledger(client, resend_id, None)
            return False

    except Exception as e:
        logger.error(f"[INBOUND-POLLER] DB lookup failed for {from_email}: {e}")
        return False

    account_id = account["id"]
    sent_at_iso = datetime.now(timezone.utc).isoformat()

    logger.info(f"[INBOUND-POLLER] Processing reply from {from_email} → account '{account['name']}'")

    # 1. Intent detection + follow-up actions
    intent_result = _detect_intent_and_act(
        client, account_id, account["name"], subject, body_text, sent_at_iso
    )

    # 2. Store in email_campaigns
    metadata = {
        "direction":        "inbound",
        "detected_intent":  intent_result,
        "sender_email":     from_email,
        "html_body":        str(body_html),
        "account_id":       str(account_id),
        "sent_at":          sent_at_iso,
        "resend_inbound_id": resend_id,
        "source":           "resend_inbound_poller",
    }
    try:
        client.table("email_campaigns").insert({
            "id": str(uuid.uuid4()),
            "account_id": account_id,
            "campaign_type": "inbound_reply",
            "subject": str(subject),
            "body": str(body_text),
            "sent_at": sent_at_iso,
            "replied_at": sent_at_iso,
            "status": "received",
            "metadata": metadata,
        }).execute()
    except Exception as e:
        logger.error(f"[INBOUND-POLLER] DB insert failed: {e}")

    # 3. Mark as processed in the persistent ledger (MUST happen if we processed)
    _update_persistent_ledger(client, resend_id, account_id)

    # Mark outbound email as replied
    try:
        outbound = (
            client.table("email_campaigns")
            .select("id")
            .eq("account_id", account_id)
            .eq("status", "sent")
            .order("sent_at", desc=True)
            .limit(1)
            .execute()
        )
        if outbound.data:
            client.table("email_campaigns").update({
                "replied_at": sent_at_iso, "status": "replied"
            }).eq("id", outbound.data[0]["id"]).execute()
    except Exception as e:
        logger.warning(f"[INBOUND-POLLER] Could not mark outbound replied: {e}")

    logger.info(f"[INBOUND-POLLER] ✅ Stored reply, intent={intent_result}, account={account['name']}")
    return True


async def poll_resend_inbound_once():
    """Single poll cycle: fetch Resend received emails and process new ones."""
    api_key = _get_resend_api_key()
    if not api_key:
        logger.debug("[INBOUND-POLLER] No Resend API key — skipping poll")
        return

    try:
        import resend
        resend.api_key = api_key
        response = resend.Emails.Receiving.list()
        # SDK returns a dict or an object with .data
        if isinstance(response, dict):
            emails = response.get("data") or []
        elif hasattr(response, "data"):
            emails = response.data or []
        else:
            emails = list(response) if response else []
    except Exception as e:
        logger.error(f"[INBOUND-POLLER] Resend list() call failed: {e}")
        return

    if not emails:
        logger.debug("[INBOUND-POLLER] No inbound emails found")
        return

    logger.info(f"[INBOUND-POLLER] Found {len(emails)} received email(s) from Resend")

    try:
        from app.services.email.scheduler import get_supabase_client
        client = get_supabase_client()
        if not client:
            logger.error("[INBOUND-POLLER] Supabase not configured")
            return
    except Exception as e:
        logger.error(f"[INBOUND-POLLER] Could not get Supabase client: {e}")
        return

    already_processed = _get_already_processed_ids(client)
    new_count = 0

    for email_summary in emails:
        try:
            if isinstance(email_summary, dict):
                rid = email_summary.get("id", "")
            else:
                rid = getattr(email_summary, "id", "")
                email_summary = vars(email_summary) if not isinstance(email_summary, dict) else email_summary

            if rid and rid in already_processed:
                logger.debug(f"[INBOUND-POLLER] Already processed {rid} — skipping")
                continue

            # Fetch FULL email (body text not included in list() response)
            import resend as _resend
            try:
                full_email = _resend.Emails.Receiving.get(email_id=rid)
                if isinstance(full_email, dict):
                    email_data = full_email
                elif hasattr(full_email, "__dict__"):
                    email_data = vars(full_email)
                else:
                    email_data = email_summary  # fallback
                # Merge summary fields (like 'from') with full email fields
                merged = dict(email_summary)
                merged.update(email_data if isinstance(email_data, dict) else {})
                email_data = merged
            except Exception as e:
                logger.warning(f"[INBOUND-POLLER] Could not fetch full email {rid}: {e}. Using summary.")
                email_data = email_summary

            logger.info(f"[INBOUND-POLLER] Email {rid} keys: {list(email_data.keys())}")
            logger.info(f"[INBOUND-POLLER] body snippet: {str(email_data.get('text', '') or email_data.get('plain_text', ''))[:100]!r}")

            handled = _process_single_email(client, email_data)
            if handled:
                new_count += 1
        except Exception as e:
            logger.error(f"[INBOUND-POLLER] Error processing email: {e}", exc_info=True)

    if new_count:
        logger.info(f"[INBOUND-POLLER] ✅ Processed {new_count} new reply(ies)")
    else:
        logger.debug("[INBOUND-POLLER] No new replies to process")
    
    return new_count


async def run_resend_inbound_poller():
    """Background task: poll Resend inbound emails on a fixed interval."""
    logger.info(f"[INBOUND-POLLER] Started — polling every {POLL_INTERVAL_SECONDS}s")
    while True:
        try:
            await poll_resend_inbound_once()
        except Exception as e:
            logger.error(f"[INBOUND-POLLER] Unexpected error: {e}", exc_info=True)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
