"""
UpsellOpportunity database model.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class UpsellOpportunity(Base):
    """UpsellOpportunity model for tracking sales expansions."""
    __tablename__ = "upsell_opportunities"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    account_name = Column(String)
    opportunity_type = Column(String)  # upsell, expansion
    predicted_value = Column(Float)
    probability = Column(Integer)  # 0-100
    status = Column(String, default="identified")  # identified, quote_sent, negotiation, closed_won, closed_lost
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="upsell_opportunities")
