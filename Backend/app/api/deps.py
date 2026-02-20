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
