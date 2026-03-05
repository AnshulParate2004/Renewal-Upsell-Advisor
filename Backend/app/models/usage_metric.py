"""
UsageMetric database model.
"""
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class UsageMetric(Base):
    """UsageMetric model for tracking account usage data."""
    __tablename__ = "usage_metrics"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    metric_date = Column(Date, nullable=False, index=True)
    active_users = Column(Integer, default=0)
    total_sessions = Column(Integer, default=0)
    utilization_percentage = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('account_id', 'metric_date', name='uq_usage_metric'),
    )

    # Relationships
    account = relationship("Account", back_populates="usage_metrics")
