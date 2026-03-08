"""
Opportunities API endpoints.
"""
from typing import Any, List, Optional
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client
from app.core.config import settings

# Load .env file explicitly
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

router = APIRouter()

def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY") or
        settings.SUPABASE_KEY
    )
    return create_client(supabase_url, supabase_key)

class OpportunityUpdate(BaseModel):
    status: str
    predicted_value: Optional[float] = None
    reasoning: Optional[str] = None

@router.get("/")
async def get_opportunities(account_id: Optional[str] = None):
    """
    Get all upsell opportunities, optionally filtered by account.
    """
    client = get_supabase_client()
    query = client.table("upsell_opportunities").select("*")
    
    if account_id:
        query = query.eq("account_id", account_id)
    
    result = query.order("probability", desc=True).execute()
    opportunities = result.data or []

    # Enrich with account names without relying on FK join
    if opportunities:
        account_ids = list({opp["account_id"] for opp in opportunities if opp.get("account_id")})
        try:
            accounts_result = client.table("accounts").select("id, name").in_("id", account_ids).execute()
            account_map = {acc["id"]: acc["name"] for acc in (accounts_result.data or [])}
            for opp in opportunities:
                opp["account_name"] = account_map.get(opp.get("account_id"), "Unknown")
        except Exception:
            pass

    return opportunities

@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    """
    Get a specific opportunity by ID.
    """
    client = get_supabase_client()
    result = client.table("upsell_opportunities").select("*").eq("id", opportunity_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    opp = result.data[0]
    # Enrich with account name
    try:
        acc = client.table("accounts").select("id, name").eq("id", opp["account_id"]).limit(1).execute()
        opp["account_name"] = acc.data[0]["name"] if acc.data else "Unknown"
    except Exception:
        pass
    return opp

@router.put("/{opportunity_id}")
async def update_opportunity(opportunity_id: str, update: OpportunityUpdate):
    """
    Update opportunity status or value.
    """
    client = get_supabase_client()
    update_data = update.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.now().isoformat()
    
    result = client.table("upsell_opportunities").update(update_data).eq("id", opportunity_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return result.data[0]
