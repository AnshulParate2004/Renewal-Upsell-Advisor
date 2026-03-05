"""
MetricsHistory database model.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class MetricsHistory(Base):
    """MetricsHistory model for trending historical stats."""
    __tablename__ = "metrics_history"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    date = Column(DateTime, nullable=False, index=True)
    health_score = Column(Integer)
    risk_score = Column(Integer)
    relationship_score = Column(Integer)
    churn_probability = Column(Float)
    utilization = Column(Float)
    sentiment_score = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="metrics_history")
