"""
Voice call scheduler that runs periodically to check and make calls.
Runs daily at 2:00 PM IST.
"""
import asyncio
from datetime import datetime, time, timedelta
import pytz
from app.services.voice_agent.voice_call_scheduler import process_scheduled_calls
from app.core.logging import get_logger

logger = get_logger(__name__)

# IST timezone
IST = pytz.timezone('Asia/Kolkata')

# Schedule: Run daily at 2:00 PM IST (after email scheduler at 12:00 PM)
SCHEDULE_HOUR = 14
SCHEDULE_MINUTE = 0


async def run_voice_call_scheduler():
    """
    Run voice call scheduler that checks for accounts needing calls.
    Runs daily at exactly 2:00 PM IST.
    """
    logger.info("Voice call scheduler started - will run daily at 2:00 PM IST")
    
    last_run_date = None
    
    while True:
        try:
            # Get current IST time
            now_ist = datetime.now(IST)
            current_hour = now_ist.hour
            current_minute = now_ist.minute
            current_date = now_ist.date()
            
            # Check if it's time to run (2:00 PM IST) and we haven't run today
            if (current_hour == SCHEDULE_HOUR and 
                current_minute == SCHEDULE_MINUTE and 
                last_run_date != current_date):
                
                logger.info(f"Running scheduled voice call processing at {now_ist.strftime('%Y-%m-%d %H:%M:%S %Z')} IST")
                await process_scheduled_calls()
                
                # Mark that we've run today
                last_run_date = current_date
                logger.info(f"Voice call processing completed. Next run: Tomorrow at 2:00 PM IST")
                
                # Wait 60 seconds to avoid running multiple times in the same minute
                await asyncio.sleep(60)
            else:
                # Check every minute
                await asyncio.sleep(60)
                
        except Exception as e:
            logger.error(f"Error in voice call scheduler: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Wait before retrying
            await asyncio.sleep(60)
