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
    get_wellness_check_template
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
    """
    Internal helper to read the app-wide settings config from Supabase.
    Safe to call even if the table does not exist; returns {} on failure.
    """
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
    """Read metrics (including percentage thresholds) from app_settings. Returns {} if unavailable."""
    if client is None:
        return {}
    cfg = _get_app_settings_config(client)
    return cfg.get("metrics") or {}


def get_email_interval_days(client: Any | None = None) -> int:
    """
    Determine how many days must pass between automated emails.

    Priority:
    1) Supabase app_settings.schedule.followUpDays (UI-driven)
    2) EMAIL_SCHEDULE_INTERVAL_DAYS env var
    3) Settings.EMAIL_SCHEDULE_INTERVAL_DAYS (backend config)
    4) Fallback default of 7 days
    """
    # 1) From Supabase settings (if available)
    if client is not None:
        cfg = _get_app_settings_config(client)
        schedule_cfg = cfg.get("schedule") or {}
        follow_up_days = schedule_cfg.get("followUpDays")
        if isinstance(follow_up_days, int) and follow_up_days > 0:
            return follow_up_days

    # 2) From environment variable
    env_val = os.getenv("EMAIL_SCHEDULE_INTERVAL_DAYS")
    if env_val:
        try:
            env_days = int(env_val)
            if env_days > 0:
                return env_days
        except ValueError:
            logger.warning(f"Invalid EMAIL_SCHEDULE_INTERVAL_DAYS value: {env_val}")

    # 3) From typed settings
    try:
        settings_days = int(getattr(app_settings, "EMAIL_SCHEDULE_INTERVAL_DAYS", 7))
        if settings_days > 0:
            return settings_days
    except Exception:
        pass

    # 4) Hard fallback
    return 7
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


async def send_scheduled_emails():
    """
    Send scheduled emails to accounts.
    Checks email_campaigns table in Supabase to see if email was sent before 7 days.
    Only sends if 7 days have passed since last email or if no email was sent before.
    """
    client = get_supabase_client()
    if not client:
        logger.error("Supabase not configured. Cannot send scheduled emails.")
        return
    
    try:
        # Get all active accounts
        accounts_result = client.table("accounts").select("*").eq("status", "active").execute()
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
        
        # Current time in UTC
        current_time = datetime.now(timezone.utc)

        # Determine dynamic throttle interval (in days) for follow-ups
        interval_days = get_email_interval_days(client)
        logger.info(f"Email scheduler using interval of {interval_days} day(s) between emails.")
        metrics_cfg = _get_metrics_config(client)
        schedule_cfg = _get_app_settings_config(client).get("schedule") or {}
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
                
                # Check last email sent for this account from Supabase email_campaigns table
                email_campaigns_result = client.table("email_campaigns").select(
                    "sent_at, campaign_type, status"
                ).eq("account_id", account_id).eq("status", "sent").order("sent_at", desc=True).limit(1).execute()
                
                last_email_sent = None
                should_send = False
                
                if email_campaigns_result.data and len(email_campaigns_result.data) > 0:
                    last_email_data = email_campaigns_result.data[0]
                    last_email_sent_str = last_email_data.get("sent_at")
                    
                    if last_email_sent_str:
                        try:
                            # Parse the sent_at timestamp
                            if isinstance(last_email_sent_str, str):
                                # Handle ISO format with or without timezone
                                if last_email_sent_str.endswith('Z'):
                                    last_email_sent = datetime.fromisoformat(last_email_sent_str.replace('Z', '+00:00'))
                                elif '+' in last_email_sent_str or last_email_sent_str.count('-') > 2:
                                    last_email_sent = datetime.fromisoformat(last_email_sent_str)
                                else:
                                    # Try parsing as naive datetime and assume UTC
                                    last_email_sent = datetime.fromisoformat(last_email_sent_str).replace(tzinfo=timezone.utc)
                            else:
                                last_email_sent = last_email_sent_str
                            
                            # Calculate days since last email
                            if last_email_sent.tzinfo is None:
                                last_email_sent = last_email_sent.replace(tzinfo=timezone.utc)
                            
                            days_since_email = (current_time - last_email_sent).days
                            
                            # Only send if N or more days have passed
                            if days_since_email >= interval_days:
                                should_send = True
                                logger.info(
                                    f"Account {account_name}: Last email sent {days_since_email} days ago. "
                                    f"Threshold is {interval_days} days. Will send email."
                                )
                            else:
                                should_send = False
                                skipped_count += 1
                                logger.debug(
                                    f"Account {account_name}: Last email sent {days_since_email} days ago. "
                                    f"Skipping (need {interval_days} days)."
                                )
                        except Exception as e:
                            logger.warning(f"Error parsing last email date for account {account_name}: {e}. Will send email.")
                            should_send = True
                    else:
                        # No sent_at date, send email (first time)
                        should_send = True
                        logger.info(f"Account {account_name}: No previous email found. Will send email.")
                else:
                    # No email campaigns found, send email (first time)
                    should_send = True
                    logger.info(f"Account {account_name}: No email history found. Will send email.")
                
                if not should_send:
                    continue
                
                # Determine email type based on plan completion percentage
                contract_start_date = account.get("contract_start_date")
                contract_end_date = account.get("contract_end_date")
                renewal_date = account.get("renewal_date")
                risk_score = account.get("risk_score")
                churn_probability = account.get("churn_probability")
                
                # Handle None values - default to 0 for comparison
                risk_score = risk_score if risk_score is not None else 0
                churn_probability = churn_probability if churn_probability is not None else 0
                
                # Check for upsell opportunities
                opportunities_result = client.table("upsell_opportunities").select(
                    "*"
                ).eq("account_id", account_id).eq("status", "identified").limit(1).execute()
                
                has_upsell_opportunity = opportunities_result.data and len(opportunities_result.data) > 0
                
                # Determine email type based on priority:
                # 1. Upsell opportunities (highest priority)
                # 2. Churn prevention (high risk accounts)
                # 3. Plan completion percentage:
                #    - 0-90%: Wellness check emails
                #    - 90-100%: Renewal reminder emails
                
                email_type = "wellness_check"  # Default: wellness check-in
                plan_completion_percentage = None
                
                if has_upsell_opportunity:
                    email_type = "upsell"
                elif risk_score >= risk_threshold_pct or churn_probability >= churn_prob_threshold:
                    email_type = "churn_prevention"
                elif contract_start_date and contract_end_date:
                    # Calculate plan completion percentage
                    try:
                        # Parse dates
                        if isinstance(contract_start_date, str):
                            start_dt = datetime.fromisoformat(contract_start_date.replace('Z', '+00:00'))
                        else:
                            start_dt = contract_start_date
                        
                        if isinstance(contract_end_date, str):
                            end_dt = datetime.fromisoformat(contract_end_date.replace('Z', '+00:00'))
                        else:
                            end_dt = contract_end_date
                        
                        # Remove timezone for calculation
                        start_dt = start_dt.replace(tzinfo=None) if start_dt.tzinfo else start_dt
                        end_dt = end_dt.replace(tzinfo=None) if end_dt.tzinfo else end_dt
                        current_dt = datetime.now()
                        
                        # Calculate total contract duration and days elapsed
                        total_days = (end_dt - start_dt).days
                        days_elapsed = (current_dt - start_dt).days
                        
                        if total_days > 0:
                            # Calculate percentage of plan completed
                            plan_completion_percentage = (days_elapsed / total_days) * 100
                            
                            # Clamp percentage between 0 and 100
                            plan_completion_percentage = max(0, min(100, plan_completion_percentage))
                            
                            logger.info(f"Account {account_name}: Plan {plan_completion_percentage:.1f}% completed ({days_elapsed}/{total_days} days)")
                            
                            # If configured % or more of plan is completed, send renewal reminder
                            if plan_completion_percentage >= renewal_pct:
                                email_type = "renewal_reminder"
                            else:
                                # Less than 90% completed - send wellness check
                                email_type = "wellness_check"
                        else:
                            logger.warning(f"Invalid contract dates for {account_name}: start={contract_start_date}, end={contract_end_date}")
                            email_type = "wellness_check"
                    except Exception as e:
                        logger.warning(f"Error calculating plan completion for {account_name}: {e}")
                        # Default to wellness check if we can't calculate
                        email_type = "wellness_check"
                elif renewal_date:
                    # Fallback: Use renewal date if contract dates not available
                    try:
                        if isinstance(renewal_date, str):
                            renewal_dt = datetime.fromisoformat(renewal_date.replace('Z', '+00:00'))
                        else:
                            renewal_dt = renewal_date
                        days_until_renewal = (renewal_dt.replace(tzinfo=None) - datetime.now()).days

                        # If within configured days before renewal (e.g. 1 day before), send renewal reminder
                        if 0 <= days_until_renewal <= reminder_days_before_renewal:
                            email_type = "renewal_reminder"
                        else:
                            email_type = "wellness_check"
                    except Exception as e:
                        logger.warning(f"Error calculating days until renewal for {account_name}: {e}")
                        email_type = "wellness_check"
                else:
                    # No contract dates or renewal date - send wellness check
                    email_type = "wellness_check"
                
                # Get recipient email
                recipient_email = (
                    account.get("primary_contact_email") or 
                    account.get("contact_email") or
                    account.get("csm_email")
                )
                
                if not recipient_email:
                    logger.warning(f"No email address found for account {account.get('name')}")
                    continue
                
                # Generate base email content from templates
                opportunity = None
                if email_type == "upsell" and has_upsell_opportunity:
                    opportunity = opportunities_result.data[0]
                    base_subject, base_html_body, base_text_body = get_upsell_opportunity_template(account, opportunity)
                elif email_type == "churn_prevention":
                    base_subject, base_html_body, base_text_body = get_churn_prevention_template(account)
                elif email_type == "renewal_reminder":
                    base_subject, base_html_body, base_text_body = get_renewal_reminder_template(account)
                elif email_type == "wellness_check":
                    base_subject, base_html_body, base_text_body = get_wellness_check_template(account)
                else:
                    # Fallback to wellness check
                    base_subject, base_html_body, base_text_body = get_wellness_check_template(account)
                
                # Personalize email content using LLM
                try:
                    subject, html_body, text_body = personalize_email_content(
                        account=account,
                        email_type=email_type,
                        base_subject=base_subject,
                        base_html_body=base_html_body,
                        base_text_body=base_text_body,
                        opportunity=opportunity
                    )
                except Exception as e:
                    logger.warning(f"LLM personalization failed, using base templates: {e}")
                    subject, html_body, text_body = base_subject, base_html_body, base_text_body
                
                # Send email
                recipient_name = account.get("primary_contact_name") or account.get("contact_name")
                success = email_service.send_email(
                    to_email=recipient_email,
                    subject=subject,
                    html_body=html_body,
                    text_body=text_body,
                    to_name=recipient_name
                )
                
                if success:
                    # Record email in email_campaigns table in Supabase
                    try:
                        sent_at_iso = current_time.isoformat()
                        sent_at_formatted = current_time.strftime("%Y-%m-%d %H:%M:%S UTC")
                        
                        # Calculate plan completion percentage if available
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
                        
                        # Store complete email information including HTML body and detailed metadata
                        email_metadata = {
                            # Email sending details
                            "sent_at": sent_at_iso,
                            "sent_at_formatted": sent_at_formatted,
                            "sent_timestamp": current_time.timestamp(),
                            "email_type": email_type,
                            
                            # Recipient information
                            "recipient_email": recipient_email,
                            "recipient_name": recipient_name,
                            
                            # Email content
                            "subject": subject,
                            "html_body": html_body,  # Full HTML version
                            "text_body_length": len(text_body),
                            "html_body_length": len(html_body),
                            "llm_personalized": True,
                            
                            # Account information
                            "account_id": str(account_id),
                            "account_name": account_name,
                            "account_domain": account.get("domain"),
                            "account_industry": account.get("industry"),
                            "account_company_size": account.get("company_size"),
                            
                            # Financial metrics
                            "arr": float(account.get("arr", 0)) if account.get("arr") else 0,
                            "mrr": float(account.get("mrr", 0)) if account.get("mrr") else 0,
                            
                            # Account health metrics
                            "health_score": account.get("health_score"),
                            "risk_score": account.get("risk_score"),
                            "relationship_score": account.get("relationship_score"),
                            "churn_probability": float(account.get("churn_probability", 0)) if account.get("churn_probability") else 0,
                            "sentiment_category": account.get("sentiment_category"),
                            
                            # Contract and renewal information
                            "renewal_date": account.get("renewal_date"),
                            "contract_start_date": account.get("contract_start_date"),
                            "contract_end_date": account.get("contract_end_date"),
                            **plan_completion_info,  # Include plan completion percentage if calculated
                            
                            # CSM information
                            "csm_name": account.get("csm_name"),
                            "csm_email": account.get("csm_email"),
                            
                            # System information
                            "scheduler_version": "1.0",
                            "scheduled_at": "12:00 PM IST (daily)"
                        }
                        
                        # Store HTML body and recipient info in metadata (schema only has body TEXT field)
                        email_metadata["html_body"] = html_body
                        email_metadata["recipient_email"] = recipient_email
                        email_metadata["recipient_name"] = recipient_name
                        
                        # Insert email campaign record (matching original schema)
                        email_campaign_result = client.table("email_campaigns").insert({
                            "account_id": account_id,
                            "campaign_type": email_type,
                            "subject": subject,
                            "body": text_body,  # Store text version in body field (TEXT)
                            "sent_at": sent_at_iso,
                            "status": "sent",
                            "metadata": email_metadata  # Store HTML body, recipient info, and all other details in metadata JSONB
                        }).execute()
                        
                        email_campaign_id = email_campaign_result.data[0]["id"] if email_campaign_result.data else None
                        
                        # Update last_contact_date in accounts table
                        client.table("accounts").update({
                            "last_contact_date": sent_at_iso
                        }).eq("id", account_id).execute()
                        
                        # Log activity to activity_logs table for audit trail
                        try:
                            # Initialize plan_completion_info if not already set
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
                            # Don't fail the email send if activity logging fails
                        
                        sent_count += 1
                        logger.info(f"Email sent and logged to database: {recipient_email} for account {account_name} (Type: {email_type})")
                    except Exception as e:
                        logger.error(f"Failed to record email campaign in Supabase: {e}")
                        import traceback
                        logger.error(traceback.format_exc())
                        sent_count += 1  # Email was sent, just failed to record
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


def _get_email_content_for_account(client: Any, account_id: str) -> Dict[str, Any]:
    """
    Build personalized email content for an account. Returns dict with subject, html_body, text_body,
    email_type, recipient_email, account_name, account_id_val, account, or error key on failure.
    """
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
            opportunity=opportunity
        )
    except Exception as e:
        logger.warning(f"LLM personalization failed for single account: {e}")
        subject, html_body, text_body = base_subject, base_html_body, base_text_body
    return {
        "subject": subject, "html_body": html_body, "text_body": text_body,
        "email_type": email_type, "recipient_email": recipient_email, "account_name": account_name,
        "account_id_val": account_id_val, "account": account,
    }


async def generate_email_preview_for_account(account_id: str) -> Dict[str, Any]:
    """
    Generate personalized email content for an account (for UI preview/edit before sending).
    Returns subject, html_body, text_body, email_type, recipient_email, account_name.
    """
    client = get_supabase_client()
    if not client:
        return {"error": "Supabase not configured."}
    try:
        content = _get_email_content_for_account(client, account_id)
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
) -> Dict[str, Any]:
    """
    Send a single email to the selected account (manual trigger).
    If subject/html_body/text_body are provided, send that content; otherwise generate personalized content.
    Does not apply the 7-day throttle.
    """
    client = get_supabase_client()
    if not client:
        return {"success": False, "error": "Supabase not configured."}
    if not email_service.is_configured:
        return {"success": False, "error": "Email service not configured."}
    try:
        if subject is not None and html_body is not None and text_body is not None:
            # Custom content: fetch account for recipient only (schema has primary_contact_*, csm_email; no contact_email/contact_name)
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
            # Generate personalized content
            content = _get_email_content_for_account(client, account_id)
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

        success = email_service.send_email(
            to_email=recipient_email, subject=subject, html_body=html_body, text_body=text_body, to_name=recipient_name
        )
        if not success:
            return {"success": False, "error": f"Failed to send email to {recipient_email}."}
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
    """Parse 'HH:MM' string to (hour, minute). Default (12, 0) on error."""
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
    """Get (hour, minute) for daily email run from app_settings. Default (12, 0) IST."""
    if client is None:
        return (12, 0)
    cfg = _get_app_settings_config(client)
    schedule = cfg.get("schedule") or {}
    return _parse_schedule_time(schedule.get("autoEmailScheduleTime") or "12:00")


def get_next_scheduled_ist(hour: int, minute: int):
    """
    Next occurrence of given hour:minute in IST (UTC+5:30).
    Returns datetime in UTC timezone.
    """
    ist_offset = timedelta(hours=5, minutes=30)
    ist_timezone = timezone(ist_offset)
    current_utc = datetime.now(timezone.utc)
    current_ist = current_utc.astimezone(ist_timezone)
    target_ist = current_ist.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if current_ist >= target_ist:
        target_ist += timedelta(days=1)
    return target_ist.astimezone(timezone.utc)


def get_next_12pm_ist():
    """
    Calculate the next 12:00 PM IST (UTC+5:30) time.
    Returns datetime in UTC timezone.
    """
    return get_next_scheduled_ist(12, 0)


async def run_email_scheduler():
    """
    Run email scheduler - checks daily at configured time (app_settings.autoEmailScheduleTime, default 12:00 IST).
    Sends emails only if N days have passed since last email (followUpDays from settings).
    """
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
            await send_scheduled_emails()

            # Re-read schedule time so user changes take effect next run
            client = get_supabase_client()
            hour, minute = get_auto_email_schedule_hm(client)
            # The loop will recalculate and wait automatically
            
        except Exception as e:
            logger.error(f"Error in email scheduler: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Wait 1 hour before retrying on error
            await asyncio.sleep(60 * 60)  # 1 hour
