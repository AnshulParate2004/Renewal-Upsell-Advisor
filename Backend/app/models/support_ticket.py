"""
SupportTicket database model.
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class SupportTicket(Base):
    """SupportTicket model for tracking Zendesk tickets."""
    __tablename__ = "support_tickets"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    zendesk_id = Column(String, unique=True, index=True)
    subject = Column(String)
    description = Column(Text)
    priority = Column(String)
    status = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True))
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="support_tickets")
