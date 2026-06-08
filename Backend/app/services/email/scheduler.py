"""
Email scheduler service - sends automated emails daily at 12:00 PM IST.
Checks if N days have passed since last email before sending, where N is
configurable via settings (followUpDays) or EMAIL_SCHEDULE_INTERVAL_DAYS.
"""
import asyncio
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv
from app.core.logging import get_logger
from app.core.config import settings as app_settings
from app.services.email.email_service import email_service
from app.services.email.templates import (
    get_renewal_reminder_template,
    get_upsell_opportunity_template,
    get_churn_prevention_template,
    get_wellness_check_template,
    get_churn_discount_template,
)
from app.services.email.llm_personalization import personalize_email_content
import os

# Load .env file
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Helper: resolve the best reply_to address for outgoing emails.
#
# Priority:
#   1. INBOUND_REPLY_EMAIL env var  (e.g. reply@yourdomain.com)
#      → Set this to the address whose MX record points to mx.sendgrid.net
#        so that SendGrid Inbound Parse intercepts the reply and POSTs it to
#        /api/v1/email/webhook → Sentiment tab shows the customer reply.
#   2. from_email (fallback – replies land in a regular inbox, NOT captured)
# ---------------------------------------------------------------------------
def _get_reply_to() -> Optional[str]:
    inbound = (
        os.getenv("INBOUND_REPLY_EMAIL")
        or getattr(app_settings, "INBOUND_REPLY_EMAIL", None)
    )
    if inbound:
        return inbound
    return email_service.from_email or None


def get_supabase_client():
    """Get Supabase client or None if not configured."""
    from supabase import create_client
    from app.core.config import settings

    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or settings.SUPABASE_KEY
    )

    if not supabase_url or not supabase_key:
        logger.warning("Supabase URL/key missing; returning no client for scheduler/settings.")
        return None

    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error("Failed to create Supabase client: %s", e)
        return None


def _get_app_settings_config(client: Any) -> Dict[str, Any]:
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
        raw_config = rows[0].get("config") or {}
        return raw_config if isinstance(raw_config, dict) else {}
    except Exception as e:
        logger.error(f"Failed to read app_settings config for scheduler: {e}")
        return {}


def _get_metrics_config(client: Any | None) -> Dict[str, Any]:
    if client is None:
        return {}
    cfg = _get_app_settings_config(client)
    return cfg.get("metrics") or {}


def get_email_interval_days(client: Any | None = None) -> int:
    if client is not None:
        cfg = _get_app_settings_config(client)
        schedule_cfg = cfg.get("schedule") or {}
        follow_up_days = schedule_cfg.get("followUpDays")
        if isinstance(follow_up_days, int) and follow_up_days > 0:
            return follow_up_days

    env_val = os.getenv("EMAIL_SCHEDULE_INTERVAL_DAYS")
    if env_val:
        try:
            env_days = int(env_val)
            if env_days > 0:
                return env_days
        except ValueError:
            logger.warning(f"Invalid EMAIL_SCHEDULE_INTERVAL_DAYS value: {env_val}")

    try:
        settings_days = int(getattr(app_settings, "EMAIL_SCHEDULE_INTERVAL_DAYS", 7))
        if settings_days > 0:
            return settings_days
    except Exception:
        pass

    return 7


def _process_contract_expirations(client: Any):
    """
    Check for accounts whose contract has ended and they haven't renewed.
    Mark them as 'churned'.
    """
    try:
        # Use timezone-aware UTC now
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # Scenario A: Churn (Not Renewed)
        # Find active or at_risk accounts whose contract has expired
        result = client.table("accounts").select("id, name, contract_end_date, status").not_.in_("status", ["churned", "renewed"]).lte("contract_end_date", now_iso).execute()
        
        expired_accounts = result.data or []
        for acc in expired_accounts:
            acc_id = acc["id"]
            acc_name = acc["name"]
            logger.info(f"[EXPIRY-CHECK] 🚨 Account {acc_name} ({acc_id}) has expired contract. Transitioning to CHURNED.")
            client.table("accounts").update({"status": "churned"}).eq("id", acc_id).execute()

        # Scenario B: Renewal Loop Reset (Already Renewed)
        # Find 'renewed' accounts whose old contract has officially ended
        res_renewed = client.table("accounts").select("id, name, contract_start_date, contract_end_date, status").eq("status", "renewed").lte("contract_end_date", now_iso).execute()
        
        turnover_accounts = res_renewed.data or []
        for acc in turnover_accounts:
            acc_id = acc["id"]
            acc_name = acc["name"]
            logger.info(f"[EXPIRY-CHECK] ♻️ Account {acc_name} ({acc_id}) reached end of term and already renewed. Resetting for NEXT year.")
            
            # Simple date advancement: add 1 year (365 days)
            old_start = datetime.fromisoformat(acc["contract_start_date"].replace('Z', '+00:00'))
            old_end = datetime.fromisoformat(acc["contract_end_date"].replace('Z', '+00:00'))
            new_start = (old_start + timedelta(days=365)).isoformat()
            new_end = (old_end + timedelta(days=365)).isoformat()
            
            client.table("accounts").update({
                "status": "active",
                "contract_start_date": new_start,
                "contract_end_date": new_end,
                "health_score": 100,
                "risk_score": 0,
                "relationship_score": 100,
                "renewal_date": None,
                "renewal_stage": None
            }).eq("id", acc_id).execute()
            
    except Exception as e:
        logger.error(f"[EXPIRY-CHECK] Failed to process contract expirations: {e}")


async def send_scheduled_emails(purpose: Optional[str] = None):
    """
    Send scheduled emails to accounts.
    Optional purpose: when set, all emails are tailored to this intent.
    """
    client = get_supabase_client()
    if not client:
        logger.error("Supabase not configured. Cannot send scheduled emails.")
        return

    # 🚨 CRITICAL: Automated Status Management
    # 1. Check for contract expirations and mark as 'churned' if passed.
    _process_contract_expirations(client)

    try:
        accounts_result = client.table("accounts").select("*").in_("status", ["active", "churned", "at_risk"]).execute()
        accounts = accounts_result.data if accounts_result.data else []

        if not accounts:
            logger.info("No active accounts found for email campaign")
            return

        logger.info(f"Processing {len(accounts)} accounts for email campaign")
        try:
            from app.services.activity_log import log_activity
            log_activity("email_scheduler_run", details={"accounts_count": len(accounts)})
        except Exception:
            pass

        sent_count = 0
        skipped_count = 0
        error_count = 0

        current_time = datetime.now(timezone.utc)
        interval_days = get_email_interval_days(client)
        logger.info(f"Email scheduler using interval of {interval_days} day(s) between emails.")
        metrics_cfg = _get_metrics_config(client)
        schedule_cfg = _get_app_settings_config(client).get("schedule") or {}
        stop_on_churn = schedule_cfg.get("stopStandardCampaignsOnChurn", True)
        stop_on_critical = schedule_cfg.get("stopWorkflowsOnCritical", True)
        reminder_days_before_renewal = int(schedule_cfg.get("reminderDaysBeforeRenewal", 1))
        reminder_days_before_renewal = max(0, min(365, reminder_days_before_renewal))
        email_milestones = metrics_cfg.get("emailMilestonePercents")
        if isinstance(email_milestones, list) and len(email_milestones) > 0:
            renewal_pct = int(max(email_milestones))
        else:
            renewal_pct = int(metrics_cfg.get("renewalReminderAtCompletionPercent", 95))
        risk_threshold_pct = int(metrics_cfg.get("highRiskScoreThresholdPercent", 70))
        churn_threshold_pct = int(metrics_cfg.get("churnProbabilityThresholdPercent", 70))
        churn_prob_threshold = churn_threshold_pct / 100.0

        for account in accounts:
            try:
                account_id = account.get("id")
                account_name = account.get("name", "Unknown")
                account_status = account.get("status", "active")

                # Skip standard campaigns if account is churned and toggle is ON
                if account_status == "churned" and stop_on_churn:
                    logger.debug(f"Account {account_name} is churned. Skipping standard email campaign.")
                    continue
                
                # Skip if account is at_risk and stopWorkflowsOnCritical toggle is ON
                if account_status == "at_risk" and stop_on_critical:
                    logger.debug(f"Account {account_name} is critical. Skipping per global 'stopWorkflowsOnCritical' setting.")
                    continue
                
                # Skip if account-level automation is disabled
                if not account.get("automation_enabled", True):
                    logger.debug(f"Automation manually disabled for {account_name}. Skipping.")
                    continue

                email_campaigns_result = client.table("email_campaigns").select(
                    "sent_at, campaign_type, status"
                ).eq("account_id", account_id).order("sent_at", desc=True).limit(1).execute()

                last_email_sent = None
                should_send = False

                if email_campaigns_result.data and len(email_campaigns_result.data) > 0:
                    last_email_data = email_campaigns_result.data[0]
                    last_email_sent_str = last_email_data.get("sent_at")
                    last_email_status = last_email_data.get("status", "").lower()

                    if last_email_sent_str:
                        try:
                            if isinstance(last_email_sent_str, str):
                                if last_email_sent_str.endswith('Z'):
                                    last_email_sent = datetime.fromisoformat(last_email_sent_str.replace('Z', '+00:00'))
                                elif '+' in last_email_sent_str or last_email_sent_str.count('-') > 2:
                                    last_email_sent = datetime.fromisoformat(last_email_sent_str)
                                else:
                                    last_email_sent = datetime.fromisoformat(last_email_sent_str).replace(tzinfo=timezone.utc)
                            else:
                                last_email_sent = last_email_sent_str

                            if last_email_sent.tzinfo is None:
                                last_email_sent = last_email_sent.replace(tzinfo=timezone.utc)

                            days_since_email = (current_time - last_email_sent).days

                            full_config = _get_app_settings_config(client)
                            notifications = full_config.get("notifications") or {}
                            failed_calls_enabled = notifications.get("failedCalls", True)

                            allowed_interval = interval_days
                            if last_email_status == "failed" and failed_calls_enabled:
                                allowed_interval = 1

                            if days_since_email >= allowed_interval:
                                should_send = True
                                logger.info(
                                    f"Account {account_name}: Last email sent {days_since_email} days ago. "
                                    f"Threshold is {allowed_interval} days. Will send email."
                                )
                            else:
                                should_send = False
                                skipped_count += 1
                                logger.debug(
                                    f"Account {account_name}: Last email sent {days_since_email} days ago. "
                                    f"Skipping (need {allowed_interval} days)."
                                )
                        except Exception as e:
                            logger.warning(f"Error parsing last email date for account {account_name}: {e}. Will send email.")
                            should_send = True
                    else:
                        should_send = True
                        logger.info(f"Account {account_name}: No previous email found. Will send email.")
                else:
                    should_send = True
                    logger.info(f"Account {account_name}: No email history found. Will send email.")

                if not should_send:
                    continue

                contract_start_date = account.get("contract_start_date")
                contract_end_date = account.get("contract_end_date")
                renewal_date = account.get("renewal_date")
                risk_score = account.get("risk_score") if account.get("risk_score") is not None else 0
                churn_probability = account.get("churn_probability") if account.get("churn_probability") is not None else 0

                opportunities_result = client.table("upsell_opportunities").select(
                    "*"
                ).eq("account_id", account_id).eq("status", "identified").limit(1).execute()

                has_upsell_opportunity = opportunities_result.data and len(opportunities_result.data) > 0

                email_type = "wellness_check"
                plan_completion_percentage = None

                if has_upsell_opportunity:
                    email_type = "upsell"
                elif risk_score >= risk_threshold_pct or churn_probability >= churn_prob_threshold:
                    email_type = "churn_prevention"
                elif contract_start_date and contract_end_date:
                    try:
                        if isinstance(contract_start_date, str):
                            start_dt = datetime.fromisoformat(contract_start_date.replace('Z', '+00:00'))
                        else:
                            start_dt = contract_start_date

                        if isinstance(contract_end_date, str):
                            end_dt = datetime.fromisoformat(contract_end_date.replace('Z', '+00:00'))
                        else:
                            end_dt = contract_end_date

                        start_dt = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
                        end_dt = end_dt.replace(tzinfo=None) if end_dt.tzinfo else end_dt
                        current_dt = datetime.now()

                        total_days = (end_dt - start_dt).days
                        days_elapsed = (current_dt - start_dt).days

                        if total_days > 0:
                            plan_completion_percentage = (days_elapsed / total_days) * 100
                            plan_completion_percentage = max(0, min(100, plan_completion_percentage))
                            logger.info(f"Account {account_name}: Plan {plan_completion_percentage:.1f}% completed ({days_elapsed}/{total_days} days)")
                            if plan_completion_percentage >= renewal_pct:
                                email_type = "renewal_reminder"
                            else:
                                email_type = "wellness_check"
                        else:
                            logger.warning(f"Invalid contract dates for {account_name}: start={contract_start_date}, end={contract_end_date}")
                            email_type = "wellness_check"
                    except Exception as e:
                        logger.warning(f"Error calculating plan completion for {account_name}: {e}")
                        email_type = "wellness_check"
                elif renewal_date:
                    try:
                        if isinstance(renewal_date, str):
                            renewal_dt = datetime.fromisoformat(renewal_date.replace('Z', '+00:00'))
                        else:
                            renewal_dt = renewal_date
                        days_until_renewal = (renewal_dt.replace(tzinfo=None) - datetime.now()).days

                        if 0 <= days_until_renewal <= reminder_days_before_renewal:
                            email_type = "renewal_reminder"
                        else:
                            email_type = "wellness_check"
                    except Exception as e:
                        logger.warning(f"Error calculating days until renewal for {account_name}: {e}")
                        email_type = "wellness_check"
                else:
                    email_type = "wellness_check"

                recipient_email = (
                    account.get("primary_contact_email") or
                    account.get("contact_email") or
                    account.get("csm_email")
                )

                if not recipient_email:
                    logger.warning(f"No email address found for account {account.get('name')}")
                    continue

                opportunity = None
                if email_type == "churn_discount":
                    discount_percentage = app_settings.metrics.get("churnDiscountPercentage", 20)
                    base_subject, base_html_body, base_text_body = get_churn_discount_template(account, discount_percentage)
                elif email_type == "upsell" and has_upsell_opportunity:
                    opportunity = opportunities_result.data[0]
                    base_subject, base_html_body, base_text_body = get_upsell_opportunity_template(account, opportunity)
                elif email_type == "churn_prevention":
                    base_subject, base_html_body, base_text_body = get_churn_prevention_template(account)
                elif email_type == "renewal_reminder":
                    base_subject, base_html_body, base_text_body = get_renewal_reminder_template(account)
                elif email_type == "wellness_check":
                    base_subject, base_html_body, base_text_body = get_wellness_check_template(account)
                else:
                    base_subject, base_html_body, base_text_body = get_wellness_check_template(account)

                try:
                    subject, html_body, text_body = personalize_email_content(
                        account=account,
                        email_type=email_type,
                        base_subject=base_subject,
                        base_html_body=base_html_body,
                        base_text_body=base_text_body,
                        opportunity=opportunity,
                        user_purpose=purpose,
                    )
                except Exception as e:
                    logger.warning(f"LLM personalization failed, using base templates: {e}")
                    subject, html_body, text_body = base_subject, base_html_body, base_text_body

                recipient_name = account.get("primary_contact_name") or account.get("contact_name")

                # ✅ FIX: Use INBOUND_REPLY_EMAIL as reply_to so real user replies are
                # intercepted by SendGrid Inbound Parse → /api/v1/email/webhook → Sentiment tab.
                success = email_service.send_email(
                    to_email=recipient_email,
                    subject=subject,
                    html_body=html_body,
                    text_body=text_body,
                    to_name=recipient_name,
                    reply_to=_get_reply_to(),
                )

                if success:
                    try:
                        sent_at_iso = current_time.isoformat()
                        sent_at_formatted = current_time.strftime("%Y-%m-%d %H:%M:%S UTC")

                        plan_completion_info = {}
                        if contract_start_date and contract_end_date:
                            try:
                                if isinstance(contract_start_date, str):
                                    start_dt = datetime.fromisoformat(contract_start_date.replace('Z', '+00:00'))
                                else:
                                    start_dt = contract_start_date

                                if isinstance(contract_end_date, str):
                                    end_dt = datetime.fromisoformat(contract_end_date.replace('Z', '+00:00'))
                                else:
                                    end_dt = contract_end_date

                                start_dt = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
                                end_dt = end_dt.replace(tzinfo=None) if end_dt.tzinfo else end_dt
                                current_dt = datetime.now()

                                total_days = (end_dt - start_dt).days
                                days_elapsed = (current_dt - start_dt).days

                                if total_days > 0:
                                    plan_completion_percentage = (days_elapsed / total_days) * 100
                                    plan_completion_percentage = max(0, min(100, plan_completion_percentage))
                                    plan_completion_info = {
                                        "plan_completion_percentage": round(plan_completion_percentage, 2),
                                        "days_elapsed": days_elapsed,
                                        "total_days": total_days,
                                        "contract_start_date": contract_start_date,
                                        "contract_end_date": contract_end_date
                                    }
                            except:
                                pass

                        email_metadata = {
                            "sent_at": sent_at_iso,
                            "sent_at_formatted": sent_at_formatted,
                            "sent_timestamp": current_time.timestamp(),
                            "email_type": email_type,
                            "recipient_email": recipient_email,
                            "recipient_name": recipient_name,
                            "subject": subject,
                            "html_body": html_body,
                            "text_body_length": len(text_body),
                            "html_body_length": len(html_body),
                            "llm_personalized": True,
                            "account_id": str(account_id),
                            "account_name": account_name,
                            "account_domain": account.get("domain"),
                            "account_industry": account.get("industry"),
                            "account_company_size": account.get("company_size"),
                            "arr": float(account.get("arr", 0)) if account.get("arr") else 0,
                            "mrr": float(account.get("mrr", 0)) if account.get("mrr") else 0,
                            "health_score": account.get("health_score"),
                            "risk_score": account.get("risk_score"),
                            "relationship_score": account.get("relationship_score"),
                            "churn_probability": float(account.get("churn_probability", 0)) if account.get("churn_probability") else 0,
                            "sentiment_category": account.get("sentiment_category"),
                            "renewal_date": account.get("renewal_date"),
                            "contract_start_date": account.get("contract_start_date"),
                            "contract_end_date": account.get("contract_end_date"),
                            **plan_completion_info,
                            "csm_name": account.get("csm_name"),
                            "csm_email": account.get("csm_email"),
                            "scheduler_version": "1.0",
                            "scheduled_at": "12:00 PM IST (daily)"
                        }

                        email_campaign_result = client.table("email_campaigns").insert({
                            "account_id": account_id,
                            "campaign_type": email_type,
                            "subject": subject,
                            "body": text_body,
                            "sent_at": sent_at_iso,
                            "status": "sent",
                            "metadata": email_metadata
                        }).execute()

                        email_campaign_id = email_campaign_result.data[0]["id"] if email_campaign_result.data else None

                        client.table("accounts").update({
                            "last_contact_date": sent_at_iso
                        }).eq("id", account_id).execute()

                        try:
                            plan_completion_info = plan_completion_info if 'plan_completion_info' in locals() else {}

                            client.table("activity_logs").insert({
                                "account_id": account_id,
                                "action": "send_email",
                                "title": f"Sent {email_type} email",
                                "details": {
                                    "campaign_type": email_type,
                                    "recipient_email": recipient_email,
                                    "recipient_name": recipient_name,
                                    "subject": subject,
                                    "sent_at": sent_at_iso,
                                    "llm_personalized": True,
                                    "plan_completion_percentage": plan_completion_info.get("plan_completion_percentage") if plan_completion_info else None
                                }
                            }).execute()
                        except Exception as log_error:
                            logger.warning(f"Failed to log activity for email campaign: {log_error}")

                        sent_count += 1
                        logger.info(f"Email sent and logged to database: {recipient_email} for account {account_name} (Type: {email_type})")
                    except Exception as e:
                        logger.error(f"Failed to record email campaign in Supabase: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                        sent_count += 1
                else:
                    error_count += 1
                    logger.error(f"Failed to send email to {recipient_email} for account {account_name}")

            except Exception as e:
                error_count += 1
                logger.error(f"Error processing account {account.get('name', 'unknown')}: {e}")
                import traceback
                logger.error(traceback.format_exc())

        logger.info(f"Email campaign completed: {sent_count} sent, {skipped_count} skipped (within 7 days), {error_count} errors")
        try:
            from app.services.activity_log import log_activity
            log_activity(
                "email_scheduler_completed",
                details={"sent_count": sent_count, "skipped_count": skipped_count, "error_count": error_count},
            )
        except Exception:
            pass
    except Exception as e:
        logger.error(f"Error in send_scheduled_emails: {e}")
        import traceback
        logger.error(traceback.format_exc())


def _get_email_content_for_account(client: Any, account_id: str, purpose: Optional[str] = None) -> Dict[str, Any]:
    result = client.table("accounts").select("*").eq("id", account_id).execute()
    if not result.data or len(result.data) == 0:
        return {"error": "Account not found."}
    account = result.data[0]
    account_id_val = account.get("id")
    account_name = account.get("name", "Unknown")
    recipient_email = (
        account.get("primary_contact_email") or
        account.get("contact_email") or
        account.get("csm_email")
    )
    if not recipient_email:
        return {"error": f"No email address for account {account_name}."}
    metrics_cfg = _get_metrics_config(client)
    full_cfg = _get_app_settings_config(client)
    schedule_cfg = full_cfg.get("schedule") or {}
    reminder_days_before_renewal = max(0, min(365, int(schedule_cfg.get("reminderDaysBeforeRenewal", 1))))
    email_milestones = metrics_cfg.get("emailMilestonePercents")
    if isinstance(email_milestones, list) and len(email_milestones) > 0:
        renewal_pct = int(max(email_milestones))
    else:
        renewal_pct = int(metrics_cfg.get("renewalReminderAtCompletionPercent", 95))
    risk_threshold_pct = int(metrics_cfg.get("highRiskScoreThresholdPercent", 70))
    churn_threshold_pct = int(metrics_cfg.get("churnProbabilityThresholdPercent", 70))
    churn_prob_threshold = churn_threshold_pct / 100.0
    contract_start_date = account.get("contract_start_date")
    contract_end_date = account.get("contract_end_date")
    renewal_date = account.get("renewal_date")
    risk_score = account.get("risk_score") if account.get("risk_score") is not None else 0
    churn_probability = account.get("churn_probability") if account.get("churn_probability") is not None else 0
    opportunities_result = client.table("upsell_opportunities").select("*").eq("account_id", account_id_val).eq("status", "identified").limit(1).execute()
    has_upsell_opportunity = opportunities_result.data and len(opportunities_result.data) > 0
    email_type = "wellness_check"
    plan_completion_percentage = None

    purpose_lower = (purpose or "").strip().lower()
    if purpose_lower:
        if "renewal" in purpose_lower:
            email_type = "renewal_reminder"
        elif "upsell" in purpose_lower or "expansion" in purpose_lower:
            email_type = "upsell" if has_upsell_opportunity else "wellness_check"
        elif "churn" in purpose_lower or "at risk" in purpose_lower or "at-risk" in purpose_lower:
            email_type = "churn_prevention"

    if email_type == "wellness_check":
        if has_upsell_opportunity:
            email_type = "upsell"
        elif risk_score >= risk_threshold_pct or churn_probability >= churn_prob_threshold:
            email_type = "churn_prevention"
        elif contract_start_date and contract_end_date:
            try:
                start_dt = datetime.fromisoformat(contract_start_date.replace("Z", "+00:00")) if isinstance(contract_start_date, str) else contract_start_date
                end_dt = datetime.fromisoformat(contract_end_date.replace("Z", "+00:00")) if isinstance(contract_end_date, str) else contract_end_date
                start_dt = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
                end_dt = end_dt.replace(tzinfo=None) if end_dt.tzinfo else end_dt
                total_days = (end_dt - start_dt).days
                days_elapsed = (datetime.now() - start_dt).days
                if total_days > 0:
                    plan_completion_percentage = max(0, min(100, (days_elapsed / total_days) * 100))
                    email_type = "renewal_reminder" if plan_completion_percentage >= renewal_pct else "wellness_check"
            except Exception:
                pass
        elif renewal_date:
            try:
                renewal_dt = datetime.fromisoformat(renewal_date.replace("Z", "+00:00")) if isinstance(renewal_date, str) else renewal_date
                days_until = (renewal_dt.replace(tzinfo=None) - datetime.now()).days if renewal_dt.tzinfo else (renewal_dt - datetime.now()).days
                email_type = "renewal_reminder" if 0 <= days_until <= reminder_days_before_renewal else "wellness_check"
            except Exception:
                pass
    opportunity = opportunities_result.data[0] if (email_type == "upsell" and has_upsell_opportunity) else None
    if email_type == "upsell" and opportunity:
        base_subject, base_html_body, base_text_body = get_upsell_opportunity_template(account, opportunity)
    elif email_type == "churn_prevention":
        base_subject, base_html_body, base_text_body = get_churn_prevention_template(account)
    elif email_type == "renewal_reminder":
        base_subject, base_html_body, base_text_body = get_renewal_reminder_template(account)
    else:
        base_subject, base_html_body, base_text_body = get_wellness_check_template(account)
    try:
        subject, html_body, text_body = personalize_email_content(
            account=account, email_type=email_type,
            base_subject=base_subject, base_html_body=base_html_body, base_text_body=base_text_body,
            opportunity=opportunity, user_purpose=purpose
        )
    except Exception as e:
        logger.warning(f"LLM personalization failed for single account: {e}")
        subject, html_body, text_body = base_subject, base_html_body, base_text_body
    return {
        "subject": subject, "html_body": html_body, "text_body": text_body,
        "email_type": email_type, "recipient_email": recipient_email, "account_name": account_name,
        "account_id_val": account_id_val, "account": account,
    }


async def generate_email_preview_for_account(account_id: str, purpose: Optional[str] = None) -> Dict[str, Any]:
    client = get_supabase_client()
    if not client:
        return {"error": "Supabase not configured."}
    try:
        content = _get_email_content_for_account(client, account_id, purpose=purpose)
        if "error" in content:
            return content
        return {
            "subject": content["subject"],
            "html_body": content["html_body"],
            "text_body": content["text_body"],
            "email_type": content["email_type"],
            "recipient_email": content["recipient_email"],
            "account_name": content["account_name"],
        }
    except Exception as e:
        logger.error(f"Error in generate_email_preview_for_account: {e}", exc_info=True)
        return {"error": str(e)}


async def send_email_to_single_account(
    account_id: str,
    subject: Optional[str] = None,
    html_body: Optional[str] = None,
    text_body: Optional[str] = None,
    purpose: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send a single email to the selected account (manual trigger).
    Does not apply the 7-day throttle.
    """
    client = get_supabase_client()
    if not client:
        return {"success": False, "error": "Supabase not configured."}
    email_service.reload_config()
    if not email_service.is_configured:
        return {
            "success": False,
            "error": "Email service not configured. Please save your SendGrid API key and From Email in Settings → Email & SendGrid.",
        }
    try:
        if subject is not None and html_body is not None and text_body is not None:
            result = client.table("accounts").select(
                "id, name, primary_contact_email, csm_email, primary_contact_name"
            ).eq("id", account_id).limit(1).execute()
            if not result.data or len(result.data) == 0:
                return {"success": False, "error": "Account not found."}
            account = result.data[0]
            recipient_email = account.get("primary_contact_email") or account.get("csm_email")
            if not recipient_email:
                return {"success": False, "error": f"No email address for account {account.get('name', 'Unknown')}."}
            account_name = account.get("name", "Unknown")
            account_id_val = account.get("id")
            recipient_name = account.get("primary_contact_name")
            email_type = "manual_custom"
        else:
            content = _get_email_content_for_account(client, account_id, purpose=purpose)
            if "error" in content:
                return {"success": False, "error": content["error"]}
            subject = content["subject"]
            html_body = content["html_body"]
            text_body = content["text_body"]
            email_type = content["email_type"]
            recipient_email = content["recipient_email"]
            account_name = content["account_name"]
            account_id_val = content["account_id_val"]
            recipient_name = content["account"].get("primary_contact_name") or content["account"].get("contact_name")

        # ✅ FIX: Use INBOUND_REPLY_EMAIL as reply_to so real user replies are
        # intercepted by SendGrid Inbound Parse → /api/v1/email/webhook → Sentiment tab.
        success = email_service.send_email(
            to_email=recipient_email, subject=subject, html_body=html_body, text_body=text_body,
            to_name=recipient_name, reply_to=_get_reply_to(),
        )
        if not success:
            err_detail = getattr(email_service, "last_error", None) or f"Failed to send email to {recipient_email}."
            return {"success": False, "error": err_detail}
        current_time = datetime.now(timezone.utc)
        sent_at_iso = current_time.isoformat()
        client.table("email_campaigns").insert({
            "account_id": account_id_val, "campaign_type": email_type, "subject": subject,
            "body": text_body, "sent_at": sent_at_iso, "status": "sent", "metadata": {
                "sent_at": sent_at_iso, "email_type": email_type, "recipient_email": recipient_email,
                "account_id": str(account_id_val), "account_name": account_name, "scheduled_at": "manual",
            }
        }).execute()
        client.table("accounts").update({"last_contact_date": sent_at_iso}).eq("id", account_id_val).execute()
        try:
            from app.services.activity_log import log_activity
            log_activity("send_email", account_id=account_id_val, title=f"Sent {email_type} email", details={"campaign_type": email_type, "recipient_email": recipient_email})
        except Exception:
            pass
        logger.info(f"Manual email sent to {recipient_email} for account {account_name} (Type: {email_type})")
        return {"success": True, "message": f"Email sent to {recipient_email} ({account_name}).", "email_type": email_type}
    except Exception as e:
        logger.error(f"Error in send_email_to_single_account: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


def _parse_schedule_time(value: Any) -> tuple[int, int]:
    if not value or not isinstance(value, str):
        return (12, 0)
    parts = value.strip().split(":")
    try:
        h = int(parts[0]) if len(parts) > 0 else 12
        m = int(parts[1]) if len(parts) > 1 else 0
        return (max(0, min(23, h)), max(0, min(59, m)))
    except (ValueError, TypeError):
        return (12, 0)


def get_auto_email_schedule_hm(client: Any | None) -> tuple[int, int]:
    if client is None:
        return (12, 0)
    cfg = _get_app_settings_config(client)
    schedule = cfg.get("schedule") or {}
    return _parse_schedule_time(schedule.get("autoEmailScheduleTime") or "12:00")


def get_next_scheduled_ist(hour: int, minute: int):
    ist_offset = timedelta(hours=5, minutes=30)
    ist_timezone = timezone(ist_offset)
    current_utc = datetime.now(timezone.utc)
    current_ist = current_utc.astimezone(ist_timezone)
    target_ist = current_ist.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if current_ist >= target_ist:
        target_ist += timedelta(days=1)
    return target_ist.astimezone(timezone.utc)


def get_next_12pm_ist():
    return get_next_scheduled_ist(12, 0)


async def run_email_scheduler():
    client = get_supabase_client()
    hour, minute = get_auto_email_schedule_hm(client)
    logger.info("Email scheduler started - will run daily at %02d:%02d IST", hour, minute)

    while True:
        try:
            next_run = get_next_scheduled_ist(hour, minute)
            current_utc = datetime.now(timezone.utc)
            wait_seconds = (next_run - current_utc).total_seconds()

            if wait_seconds > 0:
                logger.info("Next email check at %s UTC (%02d:%02d IST)", next_run.strftime("%Y-%m-%d %H:%M:%S"), hour, minute)
                await asyncio.sleep(wait_seconds)
            else:
                await asyncio.sleep(60)
                continue

            logger.info("Running scheduled email check at %02d:%02d IST", hour, minute)
            try:
                from app.services.campaign_runner import run_auto_campaigns
                result = await run_auto_campaigns()
                if result.get("campaigns_processed"):
                    logger.info("Auto campaigns run: %s", result)
            except Exception as camp_err:
                logger.warning("Auto campaigns run failed: %s", camp_err)
            await send_scheduled_emails()

            client = get_supabase_client()
            hour, minute = get_auto_email_schedule_hm(client)

        except Exception as e:
            logger.error(f"Error in email scheduler: {e}")
            import traceback
            logger.error(traceback.format_exc())
            await asyncio.sleep(60 * 60)
