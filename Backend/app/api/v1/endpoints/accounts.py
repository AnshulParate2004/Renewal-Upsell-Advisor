"""
Account API endpoints using Supabase REST API directly.
This connects directly to Supabase to fetch account data.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pathlib import Path
from dotenv import load_dotenv
from app.core.config import settings
from app.core.logging import get_logger
from supabase import create_client, Client
import os

# Load .env file explicitly - go up from app/api/v1/endpoints/accounts.py to Backend/.env
# Path: Backend/app/api/v1/endpoints/accounts.py -> Backend/.env
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    # Try current working directory (when running from Backend/)
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)  # Use override=True to ensure .env values are used

logger = get_logger(__name__)
router = APIRouter()

# Initialize Supabase client - use function to initialize lazily
def get_supabase_client() -> Optional[Client]:
    """Get or create Supabase client."""
    # Try multiple ways to get credentials
    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY") or
        settings.SUPABASE_KEY
    )
    
    if not supabase_url or not supabase_key:
        logger.error(f"Supabase credentials not configured!")
        logger.error(f"SUPABASE_URL: {'Set' if supabase_url else 'NOT SET'}")
        logger.error(f"SUPABASE_KEY: {'Set' if supabase_key else 'NOT SET'}")
        logger.error(f"Available env vars with SUPABASE: {[k for k in os.environ.keys() if 'SUPABASE' in k]}")
        return None
    
    try:
        client = create_client(supabase_url, supabase_key)
        logger.info(f"Supabase client initialized successfully (URL: {supabase_url[:50]}...)")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

# Initialize client at module level
supabase: Optional[Client] = get_supabase_client()


@router.get("/")
async def get_accounts(skip: int = 0, limit: int = 1000):
    """Get list of accounts from Supabase."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        # Query Supabase - get all fields matching the schema
        result = client.table("accounts").select(
            "id, name, domain, industry, company_size, arr, mrr, "
            "contract_start_date, contract_end_date, renewal_date, last_contact_date, "
            "status, renewal_stage, health_score, risk_score, relationship_score, "
            "churn_probability, sentiment_score, sentiment_category, "
            "licenses_total, licenses_used, utilization_percentage, "
            "csm_name, csm_email, partner_name, "
            "primary_contact_name, primary_contact_email, primary_contact_phone, "
            "primary_contact_city, primary_contact_state, "
            "created_at, updated_at"
        ).range(skip, skip + limit - 1).execute()
        
        accounts = result.data if result.data else []
        logger.info(f"Returning {len(accounts)} accounts (skip={skip}, limit={limit})")
        
        return accounts
    except Exception as e:
        logger.error(f"Error fetching accounts: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch accounts: {str(e)}")


@router.get("/{account_id}/comments")
async def get_account_comments(account_id: str):
    """List comments for an account (from account_comments table)."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    try:
        result = client.table("account_comments").select("id, account_id, body, created_at, updated_at, created_by").eq("account_id", account_id).order("created_at", desc=True).execute()
        items = result.data if result.data else []
        return items
    except Exception as e:
        logger.error(f"Error fetching comments for account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch comments: {str(e)}")


@router.post("/{account_id}/comments")
async def create_account_comment(account_id: str, payload: dict):
    """Add a comment for an account. Persisted to account_comments table."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    body = (payload.get("body") or "").strip()
    if not body:
        raise HTTPException(status_code=400, detail="Comment body is required")
    try:
        row = {"account_id": account_id, "body": body, "created_by": payload.get("created_by")}
        result = client.table("account_comments").insert(row).execute()
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create comment")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating comment for account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create comment: {str(e)}")


@router.get("/{account_id}")
async def get_account(account_id: str):
    """Get a specific account by ID from Supabase."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        result = client.table("accounts").select("*").eq("id", account_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch account: {str(e)}")


@router.post("/")
async def create_account(account: dict):
    """Create a new account in Supabase."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        result = client.table("accounts").insert(account).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=400, detail="Failed to create account")
        
        return result.data[0]
    except Exception as e:
        logger.error(f"Error creating account: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create account: {str(e)}")


@router.put("/{account_id}")
async def update_account(account_id: str, account_update: dict):
    """Update an account in Supabase."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        # Remove None values
        update_data = {k: v for k, v in account_update.items() if v is not None}
        
        result = client.table("accounts").update(update_data).eq("id", account_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Account not found")
        
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update account: {str(e)}")


@router.delete("/{account_id}")
async def delete_account(account_id: str):
    """Delete an account from Supabase."""
    client = supabase or get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        result = client.table("accounts").delete().eq("id", account_id).execute()
        
        return {"message": "Account deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting account {account_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete account: {str(e)}")
