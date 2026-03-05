"""
MLScoreHistory database model.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class MLScoreHistory(Base):
    """MLScoreHistory model for historical ML output runs."""
    __tablename__ = "ml_score_history"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    run_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    relationship_score = Column(Integer)
    health_score = Column(Integer)
    risk_score = Column(Integer)
    churn_probability = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="ml_score_history")
