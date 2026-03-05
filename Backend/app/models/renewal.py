"""
RenewalQuote & RenewalEvent database models.
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class RenewalQuote(Base):
    """RenewalQuote model for tracking sent proposals."""
    __tablename__ = "renewal_quotes"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    status = Column(String, default="draft")  # draft, sent, viewed, accepted, rejected
    total_amount = Column(Float)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    account = relationship("Account", back_populates="renewal_quotes")


class RenewalEvent(Base):
    """RenewalEvent model for tracking timeline milestones."""
    __tablename__ = "renewal_events"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    event_type = Column(String)  # kickoff_scheduled, review_completed, quote_sent
    status = Column(String)  # pending, completed
    
    # Timestamps
    due_date = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="renewal_events")
