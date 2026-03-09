"""
Auto-campaign runner: runs daily and executes campaigns whose recurring_frequency is due
(daily = every run, weekly = every 7 days, monthly = every 28 days).
Uses filter_config to select target accounts and triggers email_sequence or voice_bot per campaign.
"""
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.services.email.scheduler import get_supabase_client, send_email_to_single_account
from app.services.voice_agent.voice_call_scheduler import trigger_voice_call_for_account
from app.services.voice_agent.azure_openai import azure_openai
from app.services.whatsapp.whatsapp_service import whatsapp_service

logger = get_logger(__name__)


def _get_pipeline_stage(account: Dict[str, Any]) -> str:
    """Pipeline stage (same as frontend): q1–q4 by days; days < 0 and not renewed → no_renewed. Renewed accounts bucketed by days to contract end."""
    s = (account.get("status") or "").strip().lower()
    r = (account.get("renewal_stage") or "").strip().lower()
    is_renewed = s in ("renewed", "renewal") or r == "renewed"
    days = _renewal_days(
        account.get("renewal_date"),
        account.get("contract_end_date"),
        account.get("status"),
    )
    if days is None:
        return "q4"
    if not is_renewed and days < 0:
        return "no_renewed"
    if days > 270:
        return "q1"
    if days > 180:
        return "q2"
    if days > 90:
        return "q3"
    return "q4"


def _renewal_days(renewal_date: Optional[str], contract_end: Optional[str], status: Optional[str]) -> Optional[int]:
    """Days from today to renewal/contract end. If status is renewed and both dates set, use contract_end."""
    s = (status or "").strip().lower() if status else ""
    is_renewed = s in ("renewed", "renewal")
    end = None
    if renewal_date and str(renewal_date).strip():
        end = str(renewal_date).strip()
    if not end and contract_end and str(contract_end).strip():
        end = str(contract_end).strip()
    if is_renewed and renewal_date and contract_end and str(renewal_date).strip() and str(contract_end).strip():
        end = str(contract_end).strip()
    if not end:
        return None
    try:
        target = datetime.fromisoformat(end.replace("Z", "+00:00")) if "T" in end else datetime.strptime(end[:10], "%Y-%m-%d").replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = target - now
        return int(delta.total_seconds() / 86400)
    except Exception:
        return None


def _account_matches_filter(account: Dict[str, Any], config: Dict[str, Any]) -> bool:
    """Apply filter_config (same logic as frontend). If no filter config, returns True so campaign runs for all accounts."""
    if not config:
        return True
    risk = float(account.get("risk_score") or 0)
    health = float(account.get("health_score") or 0)
    arr = float(account.get("arr") or 0)
    renewal = _renewal_days(
        account.get("renewal_date"),
        account.get("contract_end_date"),
        account.get("status"),
    )
    if renewal is None:
        renewal = 0
    util = account.get("utilization_percentage")
    if util is not None:
        u = float(util)
        util = u * 100 if 0 <= u <= 1 else u
    else:
        util = 0
    rel = float(account.get("relationship_score") or 0)
    churn_pct = float(account.get("churn_probability") or 0) * 100

    if "risk" in config:
        r = config["risk"]
        if r.get("min") is not None and risk < r["min"]:
            return False
        if r.get("max") is not None and risk > r["max"]:
            return False
    if "healthScore" in config:
        h = config["healthScore"]
        if h.get("min") is not None and health < h["min"]:
            return False
        if h.get("max") is not None and health > h["max"]:
            return False
    if "arr" in config:
        a = config["arr"]
        if a.get("min") is not None and arr < a["min"]:
            return False
        if a.get("max") is not None and arr > a["max"]:
            return False
    if "renewal" in config:
        rn = config["renewal"]
        if rn.get("min") is not None and renewal < rn["min"]:
            return False
        if rn.get("max") is not None and renewal > rn["max"]:
            return False
    if "utilization" in config:
        u = config["utilization"]
        if u.get("min") is not None and util < u["min"]:
            return False
        if u.get("max") is not None and util > u["max"]:
            return False
    if "relationshipScore" in config:
        rs = config["relationshipScore"]
        if rs.get("min") is not None and rel < rs["min"]:
            return False
        if rs.get("max") is not None and rel > rs["max"]:
            return False
    if "churn" in config:
        c = config["churn"]
        if c.get("min") is not None and churn_pct < c["min"]:
            return False
        if c.get("max") is not None and churn_pct > c["max"]:
            return False
    loc_kw = (config.get("locationKeyword") or "").strip().lower()
    if loc_kw:
        city = (account.get("primary_contact_city") or "").lower()
        state = (account.get("primary_contact_state") or "").lower()
        if loc_kw not in f"{city} {state}".strip():
            return False
    partner_kw = (config.get("partnerNameKeyword") or "").strip().lower()
    if partner_kw:
        partner = (account.get("partner_name") or account.get("csm_name") or "").lower()
        if partner_kw not in partner:
            return False
    # Pipeline stage (Q1–Q4, No Renewed). Filter "renewed" = by status; others by bucket.
    pipeline_stage = (config.get("pipelineStage") or "").strip().lower()
    if pipeline_stage:
        if pipeline_stage == "renewed":
            acc_s = (account.get("status") or "").strip().lower()
            acc_r = (account.get("renewal_stage") or "").strip().lower()
            if acc_s not in ("renewed", "renewal") and acc_r != "renewed":
                return False
        else:
            account_stage = _get_pipeline_stage(account)
            if account_stage != pipeline_stage:
                return False
    return True


def _parse_date(s: Optional[str]) -> Optional[datetime]:
    """Parse YYYY-MM-DD or ISO date string to date-only comparison value (UTC midnight)."""
    if not s or not str(s).strip():
        return None
    s = str(s).strip()[:10]
    try:
        return datetime.strptime(s, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _is_campaign_in_date_range(campaign: Dict[str, Any]) -> bool:
    """True if today is within campaign start_date and end_date (when set)."""
    now = datetime.now(timezone.utc)
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = _parse_date(campaign.get("start_date"))
    end = _parse_date(campaign.get("end_date"))
    if start and today < start:
        return False
    if end and today > end:
        return False
    return True


def _parse_time_hhmm(s: Optional[str]) -> Optional[tuple[int, int]]:
    """Parse HH:MM or H:MM to (hour, minute). Returns None if invalid or empty."""
    if not s or not str(s).strip():
        return None
    s = str(s).strip()
    if len(s) < 4:
        return None
    try:
        parts = s.split(":")
        h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
        if 0 <= h <= 23 and 0 <= m <= 59:
            return (h, m)
    except (ValueError, IndexError):
        pass
    return None


# Indian Standard Time = UTC + 5:30 (used for campaign send time window)
IST_OFFSET_MINUTES = 5 * 60 + 30  # 330


def _is_campaign_within_send_time(campaign: Dict[str, Any]) -> bool:
    """True if current time in IST is within campaign's schedule_start_time and schedule_end_time (when set). Times are interpreted as Indian Standard Time (IST)."""
    start_hm = _parse_time_hhmm(campaign.get("schedule_start_time"))
    end_hm = _parse_time_hhmm(campaign.get("schedule_end_time"))
    if not start_hm and not end_hm:
        return True
    now_utc = datetime.now(timezone.utc)
    utc_minutes = now_utc.hour * 60 + now_utc.minute
    current_minutes = (utc_minutes + IST_OFFSET_MINUTES) % (24 * 60)  # current time of day in IST
    if start_hm:
        start_minutes = start_hm[0] * 60 + start_hm[1]
        if current_minutes < start_minutes:
            return False
    if end_hm:
        end_minutes = end_hm[0] * 60 + end_hm[1]
        if current_minutes > end_minutes:
            return False
    return True


def _is_campaign_due(campaign: Dict[str, Any]) -> bool:
    """True if campaign is within start/end date, within send time window, and due per its plan: daily (≥1 day), weekly (≥7 days), monthly (≥28 days) since last_run_at."""
    if not _is_campaign_in_date_range(campaign):
        return False
    if not _is_campaign_within_send_time(campaign):
        return False
    freq = (campaign.get("recurring_frequency") or "weekly").strip().lower()
    last = campaign.get("last_run_at")
    now = datetime.now(timezone.utc)
    if not last:
        return True
    try:
        if isinstance(last, str):
            last_dt = datetime.fromisoformat(last.replace("Z", "+00:00"))
        else:
            last_dt = last
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        delta_days = (now - last_dt).total_seconds() / 86400
        if freq == "daily":
            return delta_days >= 1
        if freq == "weekly":
            return delta_days >= 7
        if freq == "month":
            return delta_days >= 28
        return True
    except Exception:
        return True


def _is_run_complete_for_today(campaign: Dict[str, Any]) -> bool:
    """True if campaign has already run today (IST). Once run is done, show in Completed immediately."""
    last_run = campaign.get("last_run_at")
    if not last_run:
        return False
    now_utc = datetime.now(timezone.utc)
    try:
        if isinstance(last_run, str):
            last_dt = datetime.fromisoformat(last_run.replace("Z", "+00:00"))
        else:
            last_dt = last_run
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        # Last run date in IST
        last_utc_ts = last_dt.timestamp()
        last_ist_ts = last_utc_ts + IST_OFFSET_MINUTES * 60
        last_ist_dt = datetime.fromtimestamp(last_ist_ts, tz=timezone.utc)
        last_ist_date = (last_ist_dt.day, last_ist_dt.month, last_ist_dt.year)
        # Today in IST
        now_utc_ts = now_utc.timestamp()
        now_ist_ts = now_utc_ts + IST_OFFSET_MINUTES * 60
        now_ist_dt = datetime.fromtimestamp(now_ist_ts, tz=timezone.utc)
        now_ist_date = (now_ist_dt.day, now_ist_dt.month, now_ist_dt.year)
        return last_ist_date == now_ist_date
    except Exception:
        return False


def get_campaign_display_section(campaign: Dict[str, Any]) -> str:
    """
    Compute display section for UI: upcoming | ongoing | incomplete | completed.
    Used by the campaigns API so the frontend does not duplicate date/time logic.
    """
    is_active = campaign.get("is_active") is True
    today_utc = datetime.now(timezone.utc).date()
    today_str = today_utc.isoformat()
    start_date = (campaign.get("start_date") or "").strip() if campaign.get("start_date") else ""
    end_date = (campaign.get("end_date") or "").strip() if campaign.get("end_date") else ""
    last_run_incomplete = campaign.get("last_run_incomplete") is True

    if is_active and start_date and start_date > today_str:
        return "upcoming"
    if is_active and last_run_incomplete:
        return "incomplete"
    if not is_active or (end_date and end_date < today_str):
        return "completed"
    if _is_run_complete_for_today(campaign):
        return "completed"
    return "ongoing"


async def run_auto_campaigns() -> Dict[str, Any]:
    """
    Load active auto_campaigns; for each that is due and within its IST send window,
    select accounts by filter_config (if no filters, use all accounts), then trigger
    email or voice per account. Updates last_run_at after each campaign run.
    Backend runs continuously—no restart needed; values are read from DB each run.
    """
    client = get_supabase_client()
    if not client:
        logger.warning("Campaign runner: Supabase not configured.")
        return {"campaigns_processed": 0, "error": "Supabase not configured", "campaigns_loaded": 0, "accounts_loaded": 0}

    try:
        campaigns_result = client.table("auto_campaigns").select("*").eq("is_active", True).execute()
        campaigns = campaigns_result.data or []
    except Exception as e:
        logger.warning("Campaign runner: could not load auto_campaigns (table may not exist): %s", e)
        return {"campaigns_processed": 0, "error": str(e), "campaigns_loaded": 0, "accounts_loaded": 0}

    logger.info("Renewal pipeline scheduler: loaded from database: %d active campaign(s)", len(campaigns))
    for c in campaigns:
        due = _is_campaign_due(c)
        logger.info(
            "  - id=%s name=%s frequency=%s last_run_at=%s due=%s",
            c.get("id"),
            c.get("name", "?"),
            c.get("recurring_frequency", "?"),
            c.get("last_run_at") or "never",
            due,
        )

    if not campaigns:
        return {"campaigns_processed": 0, "campaigns_loaded": 0, "accounts_loaded": 0}

    try:
        accounts_result = client.table("accounts").select(
            "id, name, risk_score, health_score, arr, renewal_date, contract_end_date, status, renewal_stage, "
            "utilization_percentage, relationship_score, churn_probability, "
            "primary_contact_city, primary_contact_state, partner_name, csm_name"
        ).execute()
        all_accounts = accounts_result.data or []
    except Exception as e:
        logger.error("Campaign runner: failed to load accounts: %s", e)
        return {"campaigns_processed": 0, "error": str(e), "campaigns_loaded": len(campaigns), "accounts_loaded": 0}

    logger.info("Renewal pipeline scheduler: loaded from database: %d account(s) for matching", len(all_accounts))
    processed = 0
    for campaign in campaigns:
        if not _is_campaign_due(campaign):
            continue
        cid = campaign.get("id")
        name = campaign.get("name", "Unnamed")
        config = campaign.get("filter_config") or {}
        action = (campaign.get("action_type") or "email_sequence").strip().lower()
        description = (campaign.get("description") or "").strip() or None  # Used as purpose for email/call content
        matching = [a for a in all_accounts if _account_matches_filter(a, config)]
        if not matching:
            logger.info("Campaign '%s' due but no matching accounts (filter_config: %s).", name, bool(config))
            try:
                run_at = datetime.now(timezone.utc).isoformat()
                payload = {"last_run_at": run_at, "status": get_campaign_display_section({**campaign, "last_run_at": run_at})}
                client.table("auto_campaigns").update(payload).eq("id", cid).execute()
            except Exception:
                try:
                    client.table("auto_campaigns").update({"last_run_at": datetime.now(timezone.utc).isoformat()}).eq("id", cid).execute()
                except Exception:
                    pass
            processed += 1
            continue
        logger.info(
            "Campaign '%s' running: %s for %d accounts (%s).",
            name, action, len(matching),
            "all accounts (no filter)" if not config else "filtered accounts",
        )
        failed_count = 0
        for acc in matching:
            aid = acc.get("id")
            if not aid:
                continue
            try:
                if action == "voice_bot":
                    await trigger_voice_call_for_account(str(aid), purpose=description)
                elif action == "whatsapp":
                    # WhatsApp campaign: generate short message and send via Twilio WhatsApp
                    to_phone = acc.get("primary_contact_phone") or ""
                    if not to_phone:
                        raise ValueError("primary_contact_phone missing")
                    account_name = acc.get("name") or acc.get("primary_contact_name") or "Customer"
                    system_msg = (
                        "You are a professional customer success manager writing WhatsApp messages "
                        "to B2B customers. Keep messages concise (3-6 short lines), friendly, and clear."
                    )
                    user_msg = (
                        f"Account name: {account_name}\n"
                        f"Campaign name: {name}\n"
                        f"Purpose/description: {description or 'No extra description provided.'}\n\n"
                        "Write a WhatsApp message I can send as part of an automated campaign."
                    )
                    text = azure_openai.chat_completion(
                        [
                            {"role": "system", "content": system_msg},
                            {"role": "user", "content": user_msg},
                        ],
                        temperature=0.7,
                        max_tokens=220,
                    )
                    sid = whatsapp_service.send_message(str(to_phone), text)
                    if not sid:
                        raise RuntimeError("WhatsApp send failed")
                    # Store in whatsapp_conversations for history
                    try:
                        client.table("whatsapp_conversations").insert(
                            {
                                "phone_number": to_phone,
                                "direction": "bot",
                                "message": text,
                                "metadata": {
                                    "source": "auto_campaign",
                                    "campaign_id": str(cid),
                                    "account_id": str(aid),
                                },
                            }
                        ).execute()
                    except Exception as e2:
                        logger.warning("Campaign '%s' failed to write whatsapp_conversations: %s", name, e2)
                else:
                    await send_email_to_single_account(str(aid), purpose=description)
            except Exception as e:
                failed_count += 1
                logger.warning("Campaign '%s' action failed for account %s: %s", name, aid, e)
        last_run_at = datetime.now(timezone.utc).isoformat()
        last_run_incomplete = failed_count > 0
        campaign_after_run = {**campaign, "last_run_at": last_run_at, "last_run_incomplete": last_run_incomplete}
        status_str = get_campaign_display_section(campaign_after_run)
        try:
            update_payload = {
                "last_run_at": last_run_at,
                "last_run_incomplete": last_run_incomplete,
                "status": status_str,
            }
            client.table("auto_campaigns").update(update_payload).eq("id", cid).execute()
        except Exception as e:
            try:
                client.table("auto_campaigns").update({"last_run_at": last_run_at, "status": status_str}).eq("id", cid).execute()
            except Exception:
                try:
                    client.table("auto_campaigns").update({"last_run_at": last_run_at}).eq("id", cid).execute()
                except Exception:
                    pass
            logger.warning("Failed to update last_run_at for campaign %s: %s", cid, e)
        try:
            from app.services.activity_log import log_activity
            log_activity(
                "campaign_run",
                title=f"Campaign run: {name}",
                details={
                    "campaign_id": str(cid),
                    "campaign_name": name,
                    "action_type": action,
                    "accounts_targeted": len(matching),
                    "accounts_sent": len(matching) - failed_count,
                    "accounts_failed": failed_count,
                    "last_run_incomplete": last_run_incomplete,
                },
            )
        except Exception:
            pass
        processed += 1

    logger.info("Renewal pipeline scheduler: process finished. campaigns_processed=%d", processed)
    return {
        "campaigns_processed": processed,
        "campaigns_loaded": len(campaigns),
        "accounts_loaded": len(all_accounts),
    }


# How often to check for due campaigns (seconds). Runs this often so campaigns with narrow send windows (e.g. 08:05–08:10 UTC) are triggered during their window.
CAMPAIGN_CHECK_INTERVAL_SEC = 300  # 5 minutes


async def run_campaign_scheduler():
    """
    Backend runs once and stays up; no restart needed. Values (campaigns, filters, times) are
    read from the DB on each run. Every CAMPAIGN_CHECK_INTERVAL_SEC (e.g. 5 min) we evaluate
    active campaigns: only those that are due (daily/weekly/monthly) and within their IST
    send window are executed. Email or voice is sent to filtered accounts, or to all accounts
    when the campaign has no filters.
    """
    logger.info(
        "Renewal pipeline scheduler started (checks every %s seconds; campaigns run when due and within their send time window).",
        CAMPAIGN_CHECK_INTERVAL_SEC,
    )
    await asyncio.sleep(60)  # Let app finish startup
    while True:
        try:
            run_at = datetime.now(timezone.utc).isoformat()
            logger.info("Renewal pipeline scheduler: running process at %s UTC", datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S"))
            try:
                from app.services.activity_log import log_activity
                log_activity(
                    "renewal_pipeline_scheduler_run",
                    title="Renewal pipeline scheduler triggered",
                    details={"triggered_at": run_at, "source": "scheduled"},
                )
            except Exception:
                pass
            result = await run_auto_campaigns()
            logger.info("Renewal pipeline scheduler: run result: %s", result)
            try:
                from app.services.activity_log import log_activity
                log_activity(
                    "renewal_pipeline_scheduler_completed",
                    title="Renewal pipeline scheduler completed",
                    details={
                        "triggered_at": run_at,
                        "campaigns_processed": result.get("campaigns_processed", 0),
                        "campaigns_loaded": result.get("campaigns_loaded", 0),
                        "accounts_loaded": result.get("accounts_loaded", 0),
                        "error": result.get("error"),
                    },
                )
            except Exception:
                pass
            await asyncio.sleep(CAMPAIGN_CHECK_INTERVAL_SEC)
        except Exception as e:
            logger.warning("Renewal pipeline scheduler run failed: %s", e)
            await asyncio.sleep(3600)  # On error, retry in 1 hour
