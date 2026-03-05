"""
API Dependencies.
"""
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from typing import Optional

# For now, we'll keep dependencies simple
# Add authentication dependencies here when needed

def get_current_user(token: Optional[str] = None):
    """Get current authenticated user (placeholder for now)."""
    # TODO: Implement actual authentication
    return {"user_id": "default"}

def get_supabase_client():
    from supabase import create_client, Client
    import os
    from app.core.config import settings

    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET") or
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY") or
        settings.SUPABASE_KEY
    )
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not found")
    return create_client(supabase_url, supabase_key)
