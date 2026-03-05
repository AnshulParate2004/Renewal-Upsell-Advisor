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

@router.get("/", response_model=List[dict])
async def list_campaigns(client=Depends(get_supabase_client)):
    """Get all auto campaigns."""
    result = client.table("auto_campaigns").select("*").execute()
    return result.data if result.data else []

@router.get("/{campaign_id}", response_model=dict)
async def get_campaign(campaign_id: str, client=Depends(get_supabase_client)):
    result = client.table("auto_campaigns").select("*").eq("id", campaign_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return result.data[0]

@router.post("/", response_model=dict)
async def create_campaign(campaign: AutoCampaignCreate, client=Depends(get_supabase_client)):
    result = client.table("auto_campaigns").insert(campaign.model_dump()).execute()
    return result.data[0] if result.data else None

@router.put("/{campaign_id}", response_model=dict)
async def update_campaign(campaign_id: str, campaign: AutoCampaignUpdate, client=Depends(get_supabase_client)):
    # To support partial updates, exclude unset
    result = client.table("auto_campaigns").update(campaign.model_dump(exclude_unset=True)).eq("id", campaign_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return result.data[0]

@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str, client=Depends(get_supabase_client)):
    result = client.table("auto_campaigns").delete().eq("id", campaign_id).execute()
    return {"success": True}
