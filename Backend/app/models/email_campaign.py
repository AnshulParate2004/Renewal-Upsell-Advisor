"""
EmailCampaign database model.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class EmailCampaign(Base):
    """EmailCampaign model for tracking bulk/automated emails."""
    __tablename__ = "email_campaigns"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"))
    campaign_type = Column(String)
    subject = Column(String)
    status = Column(String)
    sent_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="email_campaigns")
    contact = relationship("Contact")
