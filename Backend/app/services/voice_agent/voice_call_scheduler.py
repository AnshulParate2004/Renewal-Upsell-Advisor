"""
Voice call scheduler that calls customers based on usage percentage milestones.
Calls at 20%, 40%, 60%, 80%, 90%, 95% usage and 1 day before renewal.
"""
import os
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from app.services.email.scheduler import get_supabase_client
from app.services.voice_agent.twilio_call_service import twilio_call_service
from app.services.voice_agent.voice_conversation import voice_conversation_handler
from app.services.voice_agent.sentiment_analyzer import sentiment_analyzer
from app.core.logging import get_logger

logger = get_logger(__name__)

# Default usage percentage milestones for Quarterly calls (Q1, Q2, Q3, Renewal)
DEFAULT_CALL_MILESTONES = [25, 50, 75, 95]


def _get_app_config(client) -> Dict[str, Any]:
    """Read full app_settings config. Returns {} if unavailable."""
    if not client:
        return {}
    try:
        result = (
            client.table("app_settings")
            .select("config")
            .eq("key", "default")
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return {}
        config = rows[0].get("config")
        if config is None:
            return {}
        if isinstance(config, str):
            import json
            try:
                return json.loads(config) or {}
            except Exception:
                return {}
        if isinstance(config, dict):
            return config
        return {}
    except Exception:
        return {}


def _get_metrics_config(client) -> Dict[str, Any]:
    """Read metrics from app_settings. Returns {} if unavailable."""
    config = _get_app_config(client)
    if not isinstance(config, dict):
        return {}
    return config.get("metrics") or {}


def _get_usage_milestones(client) -> List[int]:
    """Milestones to use for calls based on Quarterly boundaries."""
    cfg = _get_metrics_config(client)
    base = list(DEFAULT_CALL_MILESTONES)
    
    min_pct = int(cfg.get("minUsagePercentForCall", 0))
    min_pct = max(0, min(100, min_pct))
    return [m for m in base if m >= min_pct] or ([min_pct] if min_pct <= 100 else base)


def calculate_plan_completion_percentage(account: Dict[str, Any]) -> float:
    """
    Calculate plan completion percentage based on contract dates.
    
    Args:
        account: Account dictionary
        
    Returns:
        Completion percentage (0-100)
    """
    try:
        contract_start_date = account.get('contract_start_date')
        contract_end_date = account.get('contract_end_date')
        
        if not contract_start_date or not contract_end_date:
            return 0.0
        
        # Parse dates
        if isinstance(contract_start_date, str):
            start_dt = datetime.fromisoformat(contract_start_date.replace('Z', '+00:00'))
        elif isinstance(contract_start_date, datetime):
            start_dt = contract_start_date
        else:
            return 0.0
        
        if isinstance(contract_end_date, str):
            end_dt = datetime.fromisoformat(contract_end_date.replace('Z', '+00:00'))
        elif isinstance(contract_end_date, datetime):
            end_dt = contract_end_date
        else:
            return 0.0
        
        # Ensure timezone awareness
        if start_dt.tzinfo is None:
            start_dt = start_dt.replace(tzinfo=timezone.utc)
        if end_dt.tzinfo is None:
            end_dt = end_dt.replace(tzinfo=timezone.utc)
        
        current_dt = datetime.now(timezone.utc)
        
        # Calculate percentage
        total_days = (end_dt - start_dt).days
        days_elapsed = (current_dt - start_dt).days
        
        if total_days > 0:
            percentage = (days_elapsed / total_days) * 100
            return max(0.0, min(100.0, percentage))
        
        return 0.0
        
    except Exception as e:
        logger.error(f"Error calculating plan completion: {e}")
        return 0.0


def get_call_type_for_percentage(usage_percentage: float) -> str:
    """
    Determine call type based on usage percentage.
    
    Args:
        usage_percentage: Current usage percentage
        
    Returns:
        Call type string
    """
    if usage_percentage >= 95:
        return 'renewal_reminder'
    elif usage_percentage >= 90:
        return 'renewal_reminder'
    elif usage_percentage >= 80:
        return 'renewal_discussion'
    else:
        return 'check_in'


def should_make_call(
    account: Dict[str, Any],
    usage_percentage: float,
    client
) -> tuple[bool, Optional[str]]:
    """
    Check if a call should be made based on usage percentage and call history.
    
    Args:
        account: Account dictionary
        usage_percentage: Current usage percentage
        client: Supabase client
        
    Returns:
        Tuple of (should_call, reason)
    """
    account_id = account.get('id')
    if not account_id:
        return False, "No account ID"
    
    # Check if account has phone number
    phone_number = account.get('primary_contact_phone')
    if not phone_number:
        return False, "No phone number"
    
    milestones = _get_usage_milestones(client)
    min_threshold = min(milestones) if milestones else 20
    current_milestone = None
    for milestone in milestones:
        if usage_percentage >= milestone:
            current_milestone = milestone

    if current_milestone is None:
        return False, f"Usage {usage_percentage:.1f}% below {min_threshold}% threshold"
    
    # Check if we've already called for this milestone
    try:
        # Get recent calls for this account
        calls_result = client.table("voice_calls").select(
            "call_type, completed_at, outcome, status"
        ).eq("account_id", account_id).order("completed_at", desc=True).limit(10).execute()
        
        recent_calls = calls_result.data if calls_result.data else []
        
        # Check if we've called for this milestone recently
        call_type = get_call_type_for_percentage(usage_percentage)
        
        # Check for calls in the last 7 days for the same milestone
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        
        full_config = _get_app_config(client)
        notifications = full_config.get("notifications") or {}
        failed_calls_enabled = notifications.get("failedCalls", True)

        for call in recent_calls:
            call_completed = call.get('completed_at')
            call_status = call.get('status', '').lower()
            call_outcome = call.get('outcome', '').lower()
            
            # If call was completed (answered), skip for 7 days
            if call_completed and call_completed >= seven_days_ago:
                if call_status == 'completed' and call_outcome not in ['no_answer', 'busy', 'failed']:
                    # Already had a successful call recently, skip
                    return False, f"Already called successfully recently (completed: {call_completed})"
                elif call_outcome in ['no_answer', 'busy', 'failed'] or call_status == 'failed' or call_status == 'no_answer':
                    if failed_calls_enabled:
                        # If retries are enabled, retry after 1 day
                        one_day_ago = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
                        if call_completed >= one_day_ago:
                            return False, f"Failed call recently ({call_completed}), retry tomorrow"
                    else:
                        # Retries disabled, wait the full 7 days interval
                        return False, f"Failed call recently ({call_completed}) but retries are disabled"
        
    except Exception as e:
        logger.error(f"Error checking call history: {e}")
        # Continue to check other conditions
    
    # Special check: within configured days before renewal (e.g. 1 day before)
    full_config = _get_app_config(client)
    schedule = full_config.get("schedule") or {}
    reminder_days = int(schedule.get("reminderDaysBeforeRenewal", 1))
    reminder_days = max(0, min(365, reminder_days))
    renewal_date = account.get('renewal_date')
    if renewal_date:
        try:
            if isinstance(renewal_date, str):
                renewal_dt = datetime.fromisoformat(renewal_date.replace('Z', '+00:00'))
            else:
                renewal_dt = renewal_date

            if renewal_dt.tzinfo is None:
                renewal_dt = renewal_dt.replace(tzinfo=timezone.utc)

            days_until_renewal = (renewal_dt - datetime.now(timezone.utc)).days

            if 0 <= days_until_renewal <= reminder_days:
                return True, f"Within {reminder_days} day(s) of renewal - urgent call needed"
        except Exception as e:
            logger.error(f"Error checking renewal date: {e}")
    
    # Check if we're at a milestone
    if current_milestone:
        return True, f"Usage milestone reached: {current_milestone}%"
    
    return False, "No call needed"


async def make_voice_call(
    account: Dict[str, Any],
    client,
    *,
    skip_eligibility_check: bool = False,
    purpose: Optional[str] = None,
    **kwargs: Any,
) -> Optional[str]:
    """
    Make a voice call to an account.

    Args:
        account: Account dictionary
        client: Supabase client
        skip_eligibility_check: If True, do not check milestones/history (e.g. for manual trigger).
        purpose: Optional reason for the call (e.g. "review follow-up"); stored in metadata and used to tailor the script.
        **kwargs: Ignored (allows callers to pass purpose= for compatibility).

    Returns:
        Call SID if successful, None otherwise
    """
    purpose = purpose or kwargs.pop("purpose", None)
    account_id = account.get('id')
    account_name = account.get('name', 'Customer')
    phone_number = account.get('primary_contact_phone')

    if not phone_number:
        logger.warning(f"No phone number for account {account_name}")
        return None

    # Calculate usage percentage
    usage_percentage = calculate_plan_completion_percentage(account)
    call_type = get_call_type_for_percentage(usage_percentage)

    # Check if we should make the call (skip for manual single-account trigger)
    if not skip_eligibility_check:
        should_call, reason = should_make_call(account, usage_percentage, client)
        if not should_call:
            logger.info(f"Skipping call to {account_name}: {reason}")
            return None

    milestones = _get_usage_milestones(client)
    
    # Get webhook URL from environment (.env first, then settings, then default)
    from app.core.config import settings as app_settings
    webhook_base_url = os.getenv("WEBHOOK_BASE_URL") or app_settings.WEBHOOK_BASE_URL or "http://localhost:8000"
    webhook_url = f"{webhook_base_url}/api/v1/voice/handle-call"
    status_callback = f"{webhook_base_url}/api/v1/voice/call-status"
    
    # Create call record in database first
    try:
        # Try to insert with metadata, fallback without if column doesn't exist
        insert_data = {
            "account_id": account_id,
            "call_type": call_type,
            "phone_number": phone_number,
            "status": "scheduled",
            "scheduled_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Try to include metadata (will fail gracefully if column doesn't exist)
        try:
            insert_data["metadata"] = {
                "usage_percentage": usage_percentage,
                "milestone": next((m for m in milestones if usage_percentage >= m), None),
                "account_name": account_name,
                **({"call_purpose": purpose} if purpose else {}),
            }
        except Exception:
            pass  # Metadata column doesn't exist, skip it
        
        call_record = client.table("voice_calls").insert(insert_data).execute()
        
        call_id = call_record.data[0]["id"] if call_record.data else None
        
        # Make the call via Twilio
        call_sid = twilio_call_service.make_call(
            to_phone=phone_number,
            webhook_url=f"{webhook_url}?call_id={call_id}",
            status_callback=status_callback
        )
        
        if call_sid:
            attempted_at = datetime.now(timezone.utc).isoformat()
            
            # Update call record with Twilio call SID
            # Try to update with metadata, fallback to without if column doesn't exist
            update_data = {
                "status": "initiated",
                "attempted_at": attempted_at
            }
            
            # Try to include metadata if column exists
            try:
                existing_metadata = call_record.data[0].get("metadata", {}) if call_record.data else {}
                update_data["metadata"] = {
                    **existing_metadata,
                    "twilio_call_sid": call_sid
                }
            except:
                # Metadata column doesn't exist, skip it
                pass
            
            client.table("voice_calls").update(update_data).eq("id", call_id).execute()
            
            # Log activity to activity_logs table (only columns: action, account_id, details)
            try:
                client.table("activity_logs").insert({
                    "account_id": account_id,
                    "action": "voice_call_initiated",
                    "details": {
                        "title": "Voice Call Initiated",
                        "call_type": call_type,
                        "phone_number": phone_number,
                        "usage_percentage": usage_percentage,
                        "milestone": next((m for m in milestones if usage_percentage >= m), None),
                        "twilio_call_sid": call_sid,
                        "attempted_at": attempted_at
                    }
                }).execute()
            except Exception as log_error:
                logger.error(f"Failed to log call initiation: {log_error}")
            
            logger.info(f"Call initiated to {account_name} ({phone_number}): {call_sid}")
            return call_sid
        else:
            # Update call record as failed
            client.table("voice_calls").update({
                "status": "failed"
            }).eq("id", call_id).execute()
            
            logger.error(f"Failed to initiate call to {account_name}")
            return None
            
    except Exception as e:
        logger.error(f"Error making call to {account_name}: {e}")
        return None


async def process_scheduled_calls():
    """
    Process scheduled voice calls.
    Calls customers one by one based on usage percentage milestones.
    """
    client = get_supabase_client()
    if not client:
        logger.error("Supabase not configured. Cannot process calls.")
        return

    # Check if automation is paused (set via logout from frontend)
    app_config = _get_app_config(client)
    if app_config.get("automation_paused", False):
        logger.warning("Automation is PAUSED (automation_paused=True in settings). Skipping all voice calls. Log back in and re-initialize setup to resume.")
        return

    try:
        # Get all active accounts
        accounts_result = client.table("accounts").select("*").eq("status", "active").execute()
        accounts = accounts_result.data if accounts_result.data else []
        
        if not accounts:
            logger.info("No active accounts found for voice calls")
            return
        
        logger.info(f"Processing {len(accounts)} accounts for voice calls")
        try:
            from app.services.activity_log import log_activity
            log_activity("voice_scheduler_run", details={"accounts_count": len(accounts)})
        except Exception:
            pass
        # Process accounts one by one (sequential to avoid server load)
        calls_made: int = 0
        calls_skipped: int = 0
        
        for account in accounts:
            try:
                # Calculate usage percentage
                usage_percentage = calculate_plan_completion_percentage(account)
                
                # Check if we should make a call
                should_call, reason = should_make_call(account, usage_percentage, client)
                
                if should_call:
                    # Make the call
                    call_sid = await make_voice_call(account, client)
                    
                    if call_sid:
                        calls_made = calls_made + 1
                        logger.info(f"Call made to {account.get('name')} (Usage: {usage_percentage:.1f}%)")
                    else:
                        calls_skipped = calls_skipped + 1
                    
                    # Wait between calls to avoid server load (30 seconds delay)
                    await asyncio.sleep(30)
                else:
                    calls_skipped = calls_skipped + 1
                    logger.debug(f"Skipped {account.get('name')}: {reason}")
                
            except Exception as e:
                logger.error(f"Error processing account {account.get('name')}: {e}")
                continue
        
        logger.info(f"Voice call processing completed: {calls_made} calls made, {calls_skipped} skipped")
        try:
            from app.services.activity_log import log_activity
            log_activity(
                "voice_scheduler_completed",
                details={"accounts_processed": len(accounts), "calls_made": calls_made, "calls_skipped": calls_skipped},
            )
        except Exception:
            pass
    except Exception as e:
        logger.error(traceback.format_exc())

async def process_explicitly_scheduled_calls():
    """
    Process explicitly rescheduled voice calls (e.g. from a 'busy' intent extraction).
    Queries for calls where status = 'scheduled' and scheduled_at <= NOW().
    """
    client = get_supabase_client()
    if not client:
        return
        
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Get pending scheduled calls
        calls_result = client.table("voice_calls").select(
            "id, account_id, metadata"
        ).eq("status", "scheduled").lte("scheduled_at", now_iso).execute()
        
        pending_calls = calls_result.data if calls_result.data else []
        
        if not pending_calls:
            return
            
        logger.info(f"Processing {len(pending_calls)} explicitly scheduled callback(s)")
        
        for call_record in pending_calls:
            try:
                account_id = call_record.get("account_id")
                call_id = call_record.get("id")
                
                # Fetch full account data
                acc_result = client.table("accounts").select("*").eq("id", account_id).execute()
                if not acc_result.data:
                    client.table("voice_calls").update({"status": "failed", "outcome": "account_not_found"}).eq("id", call_id).execute()
                    continue
                    
                account = acc_result.data[0]
                
                # Make the call
                call_sid = await make_voice_call(account, client, skip_eligibility_check=True, purpose="Scheduled Callback")
                
                if call_sid:
                    logger.info(f"Triggered scheduled callback to {account.get('name')} (SID: {call_sid})")
                    client.table("voice_calls").update({
                        "status": "in_progress",
                        "metadata": {
                            **(call_record.get("metadata") or {}),
                            "processed_at": now_iso
                        }
                    }).eq("id", call_id).execute()
                else:
                    client.table("voice_calls").update({
                        "status": "failed",
                        "outcome": "twilio_error"
                    }).eq("id", call_id).execute()
                    
                # Rate limiting
                await asyncio.sleep(5)
                
            except Exception as loop_e:
                logger.error(f"Error triggering explicit callback for call {call_record.get('id')}: {loop_e}")
                
    except Exception as e:
        logger.error(f"Error in process_explicitly_scheduled_calls: {e}", exc_info=True)


async def trigger_voice_call_for_account(account_id: str, purpose: Optional[str] = None) -> Dict[str, Any]:
    """
    Manually trigger a voice call to a single account.
    Optional purpose: reason for the call (e.g. "review follow-up", "renewal discussion"); used to tailor the script.
    """
    client = get_supabase_client()
    if not client:
        return {"success": False, "error": "Supabase not configured."}
    try:
        result = client.table("accounts").select(
            "id, name, primary_contact_phone, contract_start_date, contract_end_date"
        ).eq("id", account_id).limit(1).execute()
        if not result.data or len(result.data) == 0:
            return {"success": False, "error": "Account not found."}
        account = result.data[0]
        if not account.get("primary_contact_phone"):
            return {"success": False, "error": f"No phone number for account {account.get('name', 'Unknown')}."}
        call_sid = await make_voice_call(account, client, skip_eligibility_check=True, purpose=purpose)
        if call_sid:
            return {"success": True, "message": f"Voice call initiated to {account.get('name')}.", "call_sid": call_sid}
        return {"success": False, "error": "Failed to initiate call (Twilio or internal error)."}
    except Exception as e:
        logger.error(f"Error in trigger_voice_call_for_account: {e}", exc_info=True)
        return {"success": False, "error": str(e)}
