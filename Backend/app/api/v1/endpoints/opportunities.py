"""
Opportunity API endpoints using Supabase.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
from app.core.config import settings
from app.core.logging import get_logger
from supabase import create_client, Client
import os

# Load .env file explicitly
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

logger = get_logger(__name__)
router = APIRouter()

# Only these two types are supported (frontend and API)
ALLOWED_OPPORTUNITY_TYPES = ("upsell", "expansion")

# Pipeline stages for display; used when status is missing or generic "identified"
OPPORTUNITY_STAGES = ("prospecting", "qualification", "proposal", "negotiation", "identified", "closed_won", "closed_lost")


def _stage_from_probability(probability: float) -> str:
    """Derive a display stage from probability when status is missing or 'identified'."""
    p = float(probability) if probability is not None else 0
    if p < 0.25:
        return "prospecting"
    if p < 0.45:
        return "qualification"
    if p < 0.65:
        return "proposal"
    if p < 0.85:
        return "negotiation"
    return "identified"


def _normalize_stage(status: Optional[str], probability: float) -> str:
    """Return status if set and not generic 'identified'; otherwise derive from probability."""
    s = (status or "").strip().lower() if status else ""
    if s and s not in ("identified",):
        return s if s in OPPORTUNITY_STAGES else "identified"
    return _stage_from_probability(probability)


def _normalize_type(opportunity_type: Optional[str]) -> str:
    """Return only 'upsell' or 'expansion'. Legacy values map to expansion."""
    if opportunity_type in ALLOWED_OPPORTUNITY_TYPES:
        return opportunity_type
    return "expansion"  # renewal, cross_sell, or any other legacy value


def get_supabase_client() -> Optional[Client]:
    """Get or create Supabase client."""
    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY") or
        settings.SUPABASE_KEY
    )
    
    if not supabase_url or not supabase_key:
        return None
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


@router.get("/")
async def get_opportunities(skip: int = 0, limit: int = 100):
    """Get list of opportunities from Supabase."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        # Query upsell_opportunities table
        result = client.table("upsell_opportunities").select(
            "id, account_id, opportunity_type, predicted_value, probability, "
            "status, created_at, updated_at"
        ).range(skip, skip + limit - 1).execute()
        
        opportunities = result.data if result.data else []
        
        # Transform to match frontend format
        transformed = []
        for opp in opportunities:
            # Get account name if possible
            account_name = ""
            try:
                account_result = client.table("accounts").select("name").eq("id", opp.get("account_id")).limit(1).execute()
                if account_result.data:
                    account_name = account_result.data[0].get("name", "")
            except:
                pass
            
            transformed.append({
                "id": opp.get("id"),
                "account_id": opp.get("account_id"),
                "account_name": account_name,
                "type": _normalize_type(opp.get("opportunity_type")),  # only upsell or expansion
                "value": float(opp.get("predicted_value", 0)),  # predicted_value -> value
                "probability": float(opp.get("probability", 0)),
                "stage": _normalize_stage(opp.get("status"), float(opp.get("probability", 0))),
                "created_date": opp.get("created_at", ""),
                "created_at": opp.get("created_at", ""),
                "updated_at": opp.get("updated_at"),
            })
        
        logger.info(f"Returning {len(transformed)} opportunities (skip={skip}, limit={limit})")
        return transformed
    except Exception as e:
        logger.error(f"Error fetching opportunities: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch opportunities: {str(e)}")


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    """Get a specific opportunity by ID from Supabase."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        result = client.table("upsell_opportunities").select("*").eq("id", opportunity_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        opp = result.data[0]
        
        # Get account name
        account_name = ""
        try:
            account_result = client.table("accounts").select("name").eq("id", opp.get("account_id")).limit(1).execute()
            if account_result.data:
                account_name = account_result.data[0].get("name", "")
        except:
            pass
        
        return {
            "id": opp.get("id"),
            "account_id": opp.get("account_id"),
            "account_name": account_name,
            "type": _normalize_type(opp.get("opportunity_type")),
            "value": float(opp.get("predicted_value", 0)),
            "probability": float(opp.get("probability", 0)),
            "stage": _normalize_stage(opp.get("status"), float(opp.get("probability", 0))),
            "created_date": opp.get("created_at", ""),
            "created_at": opp.get("created_at", ""),
            "updated_at": opp.get("updated_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching opportunity {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch opportunity: {str(e)}")


@router.post("/")
async def create_opportunity(opportunity: dict):
    """Create a new opportunity in Supabase."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        opp_type = opportunity.get("type", "upsell")
        if opp_type not in ALLOWED_OPPORTUNITY_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"type must be one of: {', '.join(ALLOWED_OPPORTUNITY_TYPES)}",
            )
        # Transform frontend format to Supabase format
        supabase_data = {
            "account_id": opportunity.get("account_id"),
            "opportunity_type": opp_type,
            "predicted_value": opportunity.get("value", 0),
            "probability": opportunity.get("probability", 0),
            "status": opportunity.get("stage", "identified"),
        }
        
        result = client.table("upsell_opportunities").insert(supabase_data).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create opportunity")
        
        opp = result.data[0]
        return {
            "id": opp.get("id"),
            "account_id": opp.get("account_id"),
            "type": _normalize_type(opp.get("opportunity_type")),
            "value": float(opp.get("predicted_value", 0)),
            "probability": float(opp.get("probability", 0)),
            "stage": _normalize_stage(opp.get("status"), float(opp.get("probability", 0))),
            "created_date": opp.get("created_at", ""),
            "created_at": opp.get("created_at", ""),
            "updated_at": opp.get("updated_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating opportunity: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create opportunity: {str(e)}")


@router.put("/{opportunity_id}")
async def update_opportunity(opportunity_id: str, opportunity_update: dict):
    """Update an opportunity in Supabase."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        # Transform frontend format to Supabase format
        update_data = {}
        if "value" in opportunity_update:
            update_data["predicted_value"] = opportunity_update["value"]
        if "probability" in opportunity_update:
            update_data["probability"] = opportunity_update["probability"]
        if "stage" in opportunity_update:
            update_data["status"] = opportunity_update["stage"]
        if "type" in opportunity_update:
            t = opportunity_update["type"]
            if t not in ALLOWED_OPPORTUNITY_TYPES:
                raise HTTPException(
                    status_code=400,
                    detail=f"type must be one of: {', '.join(ALLOWED_OPPORTUNITY_TYPES)}",
                )
            update_data["opportunity_type"] = t
        
        # Remove None values
        update_data = {k: v for k, v in update_data.items() if v is not None}
        
        result = client.table("upsell_opportunities").update(update_data).eq("id", opportunity_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Opportunity not found")
        
        opp = result.data[0]
        return {
            "id": opp.get("id"),
            "account_id": opp.get("account_id"),
            "type": _normalize_type(opp.get("opportunity_type")),
            "value": float(opp.get("predicted_value", 0)),
            "probability": float(opp.get("probability", 0)),
            "stage": _normalize_stage(opp.get("status"), float(opp.get("probability", 0))),
            "created_date": opp.get("created_at", ""),
            "created_at": opp.get("created_at", ""),
            "updated_at": opp.get("updated_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating opportunity {opportunity_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update opportunity: {str(e)}")
