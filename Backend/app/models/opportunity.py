"""
Opportunity database model for tracking upsell/renewal opportunities.
"""
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Opportunity(Base):
    """Opportunity model for tracking sales opportunities."""
    __tablename__ = "opportunities"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # upsell, expansion
    value = Column(Float, nullable=False)
    probability = Column(Integer)  # 0-100
    stage = Column(String)  # identified, quote_sent, negotiation, closed_won, closed_lost
    created_date = Column(DateTime, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", backref="opportunities")
