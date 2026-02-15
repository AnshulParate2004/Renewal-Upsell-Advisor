"""
Opportunity Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class OpportunityBase(BaseModel):
    """Base opportunity schema."""
    account_id: str
    type: str  # renewal, upsell, cross_sell
    value: float
    probability: int = Field(..., ge=0, le=100)
    stage: str  # identified, quote_sent, negotiation, closed_won, closed_lost


class OpportunityCreate(OpportunityBase):
    """Schema for creating an opportunity."""
    created_date: datetime = Field(default_factory=datetime.now)


class OpportunityUpdate(BaseModel):
    """Schema for updating an opportunity."""
    value: Optional[float] = None
    probability: Optional[int] = Field(None, ge=0, le=100)
    stage: Optional[str] = None


class OpportunityResponse(OpportunityBase):
    """Schema for opportunity response."""
    id: str
    created_date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
