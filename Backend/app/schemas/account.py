"""
Account Pydantic schemas.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class AccountBase(BaseModel):
    """Base account schema."""
    name: str
    salesforce_id: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    
    arr: float = 0.0
    mrr: float = 0.0
    
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    renewal_date: Optional[datetime] = None
    status: str = 'active'
    
    health_score: Optional[int] = None
    relationship_score: Optional[int] = None
    risk_score: Optional[int] = None
    
    licenses_total: int = 0
    licenses_used: int = 0
    renewal_stage: Optional[str] = None
    last_contact_date: Optional[datetime] = None
    
    churn_probability: Optional[float] = None
    sentiment_score: Optional[float] = None
    sentiment_category: Optional[str] = None
    utilization_percentage: Optional[float] = None
    
    csm_email: Optional[str] = None
    csm_name: Optional[str] = None
    
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = None
    primary_contact_city: Optional[str] = None
    primary_contact_state: Optional[str] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    """Schema for updating an account."""
    name: Optional[str] = None
    arr: Optional[float] = None
    mrr: Optional[float] = None
    health_score: Optional[int] = None
    risk_score: Optional[int] = None
    relationship_score: Optional[int] = None
    churn_probability: Optional[float] = None
    sentiment_score: Optional[float] = None
    utilization_percentage: Optional[float] = None
    renewal_date: Optional[datetime] = None
    renewal_stage: Optional[str] = None
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = None
    primary_contact_city: Optional[str] = None
    primary_contact_state: Optional[str] = None


class AccountResponse(AccountBase):
    """Schema for account response."""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
