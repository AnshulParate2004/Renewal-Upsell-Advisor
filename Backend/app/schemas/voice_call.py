"""
VoiceCall Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class VoiceCallBase(BaseModel):
    account_name: Optional[str] = None
    duration: Optional[str] = None
    status: Optional[str] = None
    outcome: Optional[str] = None
    sentiment: Optional[str] = None
    retry_count: int = 0
    transcript: Optional[List[str]] = None


class VoiceCallCreate(VoiceCallBase):
    account_id: str
    contact_id: Optional[str] = None


class VoiceCallResponse(VoiceCallBase):
    id: str
    account_id: str
    contact_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
