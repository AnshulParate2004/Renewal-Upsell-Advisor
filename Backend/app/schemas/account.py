"""
Account Pydantic schemas.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class AccountBase(BaseModel):
    """Base account schema."""
    name: str
    arr: float
    industry: Optional[str] = None
    company_size: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None


class AccountCreate(AccountBase):
    """Schema for creating an account."""
    pass


class AccountUpdate(BaseModel):
    """Schema for updating an account."""
    name: Optional[str] = None
    arr: Optional[float] = None
    health_score: Optional[float] = None
    risk_score: Optional[float] = None
    relationship_score: Optional[float] = None
    churn_probability: Optional[float] = None
    sentiment_score: Optional[float] = None
    utilization: Optional[float] = None
    renewal_date: Optional[datetime] = None
    renewal_stage: Optional[str] = None


class AccountResponse(AccountBase):
    """Schema for account response."""
    id: str
    health_score: Optional[float] = None
    risk_score: Optional[float] = None
    relationship_score: Optional[float] = None
    churn_probability: Optional[float] = None
    sentiment_score: Optional[float] = None
    utilization: Optional[float] = None
    licenses_used: Optional[int] = None
    licenses_total: Optional[int] = None
    renewal_date: Optional[datetime] = None
    renewal_stage: Optional[str] = None
    csm: Optional[str] = None
    last_contact: Optional[datetime] = None
    contract_start: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
