"""
ML pipeline scheduler: runs at 12:00 AM IST every day (Relationship -> Health -> Churn -> Upsell, then push to Supabase).
"""
import asyncio
from datetime import datetime, timedelta, timezone

from app.core.logging import get_logger

logger = get_logger(__name__)


def _get_next_12am_ist():
    """Next 12:00 AM (midnight) IST in UTC."""
    ist_offset = timedelta(hours=5, minutes=30)
    ist_timezone = timezone(ist_offset)
    current_utc = datetime.now(timezone.utc)
    current_ist = current_utc.astimezone(ist_timezone)
    target_ist = current_ist.replace(hour=0, minute=0, second=0, microsecond=0)
    if current_ist >= target_ist:
        target_ist += timedelta(days=1)
    return target_ist.astimezone(timezone.utc)


async def run_ml_pipeline_scheduler():
    """Run ML pipeline job daily at 12:00 AM IST."""
    logger.info("ML pipeline scheduler started - runs daily at 12:00 AM IST")
    while True:
        try:
            next_run = _get_next_12am_ist()
            current_utc = datetime.now(timezone.utc)
            wait_seconds = (next_run - current_utc).total_seconds()
            if wait_seconds > 0:
                logger.info(f"Next ML pipeline at {next_run.strftime('%Y-%m-%d %H:%M:%S UTC')} (12:00 AM IST)")
                await asyncio.sleep(wait_seconds)
            else:
                await asyncio.sleep(60)
                continue
            logger.info("Running scheduled ML pipeline at 12:00 AM IST")
            from app.services.ml.ml_pipeline_job import run_pipeline_and_push_to_supabase
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, run_pipeline_and_push_to_supabase)
            if result.get("success"):
                logger.info(f"ML pipeline completed: {result.get('accounts_updated', 0)} accounts updated")
            else:
                logger.warning(f"ML pipeline had errors: {result.get('errors', [])}")
            try:
                from app.services.activity_log import log_activity
                log_activity(
                    "ml_pipeline_run",
                    details={
                        "source": "scheduled",
                        "accounts_processed": result.get("accounts_processed", 0),
                        "accounts_updated": result.get("accounts_updated", 0),
                        "churn_inserted": result.get("churn_inserted", 0),
                        "upsell_inserted": result.get("upsell_inserted", 0),
                        "errors_count": len(result.get("errors", [])),
                    },
                )
            except Exception:
                pass
        except Exception as e:
            logger.error(f"ML pipeline scheduler error: {e}", exc_info=True)
            await asyncio.sleep(3600)
