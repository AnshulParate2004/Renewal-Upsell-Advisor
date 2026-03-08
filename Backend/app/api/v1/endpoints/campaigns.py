from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import UUID

from app.schemas.campaign import (
    AutoCampaignCreate,
    AutoCampaignUpdate,
    AutoCampaignResponse
)
from app.api.deps import get_supabase_client

router = APIRouter()

TABLE_MISSING_MSG = (
    "Table 'auto_campaigns' does not exist in Supabase. "
    "Run the SQL in Backend/app/db/sql/auto_campaigns_schema.sql in your Supabase SQL Editor to create it."
)

# Columns present in the original auto_campaigns table (before start_date, end_date, schedule_*, follow_up_offset_days).
# If Supabase returns 400 (e.g. column does not exist), we retry with only these so save still works.
BASE_CAMPAIGN_COLUMNS = {
    "name", "description", "target_audience_filter", "filter_min_value", "filter_max_value",
    "filter_config", "recurring_frequency", "action_type", "is_active", "last_run_at",
}
# Optional new columns; add to payload only if table has them (we try full payload first).
EXTENDED_CAMPAIGN_COLUMNS = {
    "start_date", "end_date", "schedule_start_time", "schedule_end_time", "follow_up_offset_days",
}


def _is_table_missing(err: Exception) -> bool:
    if getattr(err, "code", None) == "PGRST205":
        return True
    if hasattr(err, "args") and len(err.args) > 0 and isinstance(err.args[0], dict):
        if err.args[0].get("code") == "PGRST205":
            return True
    err_str = str(err).lower()
    if "auto_campaigns" in err_str and ("schema cache" in err_str or "pgrst205" in err_str or "could not find the table" in err_str):
        return True
    return False


def _is_bad_request_or_unknown_column(err: Exception) -> bool:
    """True if error looks like 400 / unknown column from Supabase."""
    err_str = str(err).lower()
    if "400" in err_str or "bad request" in err_str:
        return True
    if "column" in err_str and ("does not exist" in err_str or "unknown" in err_str):
        return True
    if hasattr(err, "status_code") and err.status_code == 400:
        return True
    return False


@router.get("/", response_model=List[dict])
async def list_campaigns(client=Depends(get_supabase_client)):
    """Get all auto campaigns. Computes status (upcoming|ongoing|incomplete|completed) and writes it to DB."""
    try:
        from app.services.campaign_runner import get_campaign_display_section

        result = client.table("auto_campaigns").select("*").execute()
        campaigns = result.data if result.data else []
        for c in campaigns:
            cid = c.get("id")
            status = get_campaign_display_section(c)
            c["status"] = status
            try:
                client.table("auto_campaigns").update({"status": status}).eq("id", cid).execute()
            except Exception:
                pass
        return campaigns
    except Exception as e:
        if _is_table_missing(e):
            return []
        raise


@router.post("/run-now", response_model=dict)
async def run_campaigns_now():
    """Run all due campaigns now (no backend restart needed). Evaluates date range, IST send window, and frequency."""
    try:
        from app.services.campaign_runner import run_auto_campaigns
        result = await run_auto_campaigns()
        return {"status": "ok", **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{campaign_id}", response_model=dict)
async def get_campaign(campaign_id: str, client=Depends(get_supabase_client)):
    try:
        result = client.table("auto_campaigns").select("*").eq("id", campaign_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=TABLE_MISSING_MSG)
        raise


REQUIRED_ACTION_TYPES = ("email_sequence", "voice_bot")


@router.post("/", response_model=dict)
async def create_campaign(campaign: AutoCampaignCreate, client=Depends(get_supabase_client)):
    # Require name, description, start_date, end_date, and a valid action_type
    name = (campaign.name or "").strip()
    description = (campaign.description or "").strip()
    start_date = (campaign.start_date or "").strip()
    end_date = (campaign.end_date or "").strip()
    action_type = (campaign.action_type or "").strip().lower()
    if not name:
        raise HTTPException(status_code=422, detail="Campaign name is required.")
    if not description:
        raise HTTPException(status_code=422, detail="Campaign description is required.")
    if not start_date:
        raise HTTPException(status_code=422, detail="Campaign start date is required.")
    if not end_date:
        raise HTTPException(status_code=422, detail="Campaign end date is required.")
    if action_type not in REQUIRED_ACTION_TYPES:
        raise HTTPException(status_code=422, detail="Action must be one of: email_sequence, voice_bot.")

    payload = campaign.model_dump(exclude_none=True)
    # Remove last_run_at from insert (backend sets it when campaign runs)
    payload.pop("last_run_at", None)

    try:
        result = client.table("auto_campaigns").insert(payload).execute()
        created = result.data[0] if result.data else None
        if created:
            try:
                from app.services.activity_log import log_activity
                log_activity(
                    "campaign_created",
                    title=f"Campaign created: {created.get('name', '')}",
                    details={
                        "campaign_id": str(created.get("id", "")),
                        "campaign_name": created.get("name"),
                        "action_type": created.get("action_type"),
                        "start_date": created.get("start_date"),
                        "end_date": created.get("end_date"),
                    },
                )
            except Exception:
                pass
        return created
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=TABLE_MISSING_MSG)
        if _is_bad_request_or_unknown_column(e):
            # Table may lack new columns (start_date, end_date, schedule_*, follow_up_offset_days). Retry with base columns only.
            try:
                safe_payload = {k: v for k, v in payload.items() if k in BASE_CAMPAIGN_COLUMNS}
                result = client.table("auto_campaigns").insert(safe_payload).execute()
                created = result.data[0] if result.data else None
                if created:
                    try:
                        from app.services.activity_log import log_activity
                        log_activity("campaign_created", title=f"Campaign created: {created.get('name', '')}", details={"campaign_id": str(created.get("id", "")), "campaign_name": created.get("name")})
                    except Exception:
                        pass
                return created
            except Exception as retry_err:
                raise HTTPException(
                    status_code=400,
                    detail=f"Campaign insert failed. If you added start/end date or time, run the migration in Backend/app/db/sql/auto_campaigns_add_start_end_date.sql in Supabase SQL Editor. Error: {retry_err!s}",
                )
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{campaign_id}", response_model=dict)
async def update_campaign(campaign_id: str, campaign: AutoCampaignUpdate, client=Depends(get_supabase_client)):
    try:
        result = client.table("auto_campaigns").update(campaign.model_dump(exclude_unset=True)).eq("id", campaign_id).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=TABLE_MISSING_MSG)
        raise


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, client=Depends(get_supabase_client)):
    try:
        client.table("auto_campaigns").delete().eq("id", campaign_id).execute()
        return {"success": True}
    except Exception as e:
        if _is_table_missing(e):
            raise HTTPException(status_code=503, detail=TABLE_MISSING_MSG)
        raise
