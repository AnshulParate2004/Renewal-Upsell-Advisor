"""
Voice call scheduler that runs periodically to check and make calls.
Runs daily at configured time (app_settings.autoCallScheduleTime, default 14:00 IST).
"""
import asyncio
from datetime import datetime
from typing import Any, Tuple

import pytz
from app.services.voice_agent.voice_call_scheduler import process_scheduled_calls
from app.services.email.scheduler import get_supabase_client
from app.core.logging import get_logger

logger = get_logger(__name__)

IST = pytz.timezone("Asia/Kolkata")


def _parse_schedule_time(value: Any) -> Tuple[int, int]:
    """Parse 'HH:MM' to (hour, minute). Default (14, 0)."""
    if not value or not isinstance(value, str):
        return (14, 0)
    parts = value.strip().split(":")
    try:
        h = int(parts[0]) if len(parts) > 0 else 14
        m = int(parts[1]) if len(parts) > 1 else 0
        return (max(0, min(23, h)), max(0, min(59, m)))
    except (ValueError, TypeError):
        return (14, 0)


def _get_auto_call_schedule_hm() -> Tuple[int, int]:
    """Read daily call run time from app_settings. Default (14, 0) IST."""
    client = get_supabase_client()
    if not client:
        return (14, 0)
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
            return (14, 0)
        config = rows[0].get("config") or {}
        schedule = config.get("schedule") or {}
        return _parse_schedule_time(schedule.get("autoCallScheduleTime") or "14:00")
    except Exception as e:
        logger.debug("Could not read autoCallScheduleTime: %s", e)
        return (14, 0)


async def run_voice_call_scheduler():
    """
    Run voice call scheduler at configured time (default 14:00 IST).
    """
    schedule_hour, schedule_minute = _get_auto_call_schedule_hm()
    logger.info(
        "Voice call scheduler started - will run daily at %02d:%02d IST",
        schedule_hour,
        schedule_minute,
    )
    last_run_date = None

    while True:
        try:
            schedule_hour, schedule_minute = _get_auto_call_schedule_hm()
            now_ist = datetime.now(IST)
            current_date = now_ist.date()

            if (
                now_ist.hour == schedule_hour
                and now_ist.minute == schedule_minute
                and last_run_date != current_date
            ):
                logger.info(
                    "Running scheduled voice call processing at %s IST",
                    now_ist.strftime("%Y-%m-%d %H:%M:%S"),
                )
                await process_scheduled_calls()
                last_run_date = current_date
                logger.info(
                    "Voice call processing completed. Next run: Tomorrow at %02d:%02d IST",
                    schedule_hour,
                    schedule_minute,
                )
            await asyncio.sleep(60)
        except Exception as e:
            logger.error("Error in voice call scheduler: %s", e)
            import traceback
            logger.error(traceback.format_exc())
            await asyncio.sleep(60)
