"""
UpsellOpportunity Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UpsellOpportunityBase(BaseModel):
    account_name: Optional[str] = None
    opportunity_type: str
    predicted_value: float
    probability: int
    status: str = "identified"


class UpsellOpportunityCreate(UpsellOpportunityBase):
    account_id: str


class UpsellOpportunityResponse(UpsellOpportunityBase):
    id: str
    account_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
