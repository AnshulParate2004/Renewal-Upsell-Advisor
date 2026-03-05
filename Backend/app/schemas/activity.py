"""
ActivityLog Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ActivityLogBase(BaseModel):
    action: str
    title: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    sentiment: Optional[str] = None


class ActivityLogCreate(ActivityLogBase):
    account_id: str


class ActivityLogResponse(ActivityLogBase):
    id: str
    account_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True
