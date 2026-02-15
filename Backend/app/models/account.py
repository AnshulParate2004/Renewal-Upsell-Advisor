"""
Account database model.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.base import Base


class Account(Base):
    """Account model for storing customer account information."""
    __tablename__ = "accounts"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    arr = Column(Float, nullable=False)  # Annual Recurring Revenue
    health_score = Column(Float)
    risk_score = Column(Float)
    relationship_score = Column(Float)
    churn_probability = Column(Float)
    sentiment_score = Column(Float)
    utilization = Column(Float)
    licenses_used = Column(Integer)
    licenses_total = Column(Integer)
    renewal_date = Column(DateTime)
    renewal_stage = Column(String)  # t90, t60, t30, renewed, lost
    industry = Column(String)
    company_size = Column(String)
    csm = Column(String)  # Customer Success Manager
    last_contact = Column(DateTime)
    contract_start = Column(DateTime)
    contact_name = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
