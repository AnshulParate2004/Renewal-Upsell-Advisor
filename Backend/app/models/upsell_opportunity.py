"""
Upsell opportunity database model.
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class UpsellOpportunity(Base):
    """UpsellOpportunity model for storing detected upsell opportunities."""
    __tablename__ = "upsell_opportunities"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    opportunity_type = Column(String, nullable=False, default="upsell") # upsell, expansion, cross-sell
    predicted_value = Column(Float, nullable=False, default=0.0)
    probability = Column(Float, nullable=False, default=0.0)
    
    status = Column(String, nullable=False, default="identified") # identified, qualified, won, lost, closed
    reasoning = Column(String)
    recommended_products = Column(JSON, default=[])
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="upsell_opportunities")
