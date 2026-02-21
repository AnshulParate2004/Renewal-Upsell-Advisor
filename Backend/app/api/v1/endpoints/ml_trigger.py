"""
Manual trigger for ML pipeline: run Relationship -> Health -> Churn -> Upsell and push to Supabase.
"""
import asyncio
from fastapi import APIRouter, HTTPException

from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


@router.post("/trigger")
async def trigger_ml_pipeline():
    """
    Manually run the full ML pipeline for all accounts and push results to Supabase.
    Runs in a thread so the request does not block. Same as the daily 12:00 AM job.
    """
    from app.services.ml.ml_pipeline_job import run_pipeline_and_push_to_supabase
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, run_pipeline_and_push_to_supabase)
    except Exception as e:
        logger.exception(f"ML trigger failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    if not result.get("success") and result.get("accounts_processed", 0) == 0:
        raise HTTPException(
            status_code=500,
            detail=result.get("error", "Pipeline failed"),
        )
    try:
        from app.services.activity_log import log_activity
        log_activity(
            "ml_pipeline_trigger",
            details={
                "source": "manual",
                "accounts_processed": result.get("accounts_processed", 0),
                "accounts_updated": result.get("accounts_updated", 0),
                "churn_inserted": result.get("churn_inserted", 0),
                "upsell_inserted": result.get("upsell_inserted", 0),
                "errors_count": len(result.get("errors", [])),
            },
        )
    except Exception:
        pass
    return {
        "success": result.get("success", False),
        "accounts_processed": result.get("accounts_processed", 0),
        "accounts_updated": result.get("accounts_updated", 0),
        "churn_inserted": result.get("churn_inserted", 0),
        "upsell_inserted": result.get("upsell_inserted", 0),
        "errors": result.get("errors", []),
    }
