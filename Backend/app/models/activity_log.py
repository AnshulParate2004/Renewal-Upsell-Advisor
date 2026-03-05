"""
ActivityLog database model.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class ActivityLog(Base):
    """ActivityLog model for equivalent to AccountActivity timeline."""
    __tablename__ = "activity_logs"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    action = Column(String, nullable=False)  # call, email, meeting, support_ticket, contract_change, usage_spike, usage_drop, payment
    title = Column(String)
    details = Column(JSONB)
    sentiment = Column(String)  # positive, neutral, negative
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="activity_logs")
