"""
VoiceCall database model.
"""
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class VoiceCall(Base):
    """VoiceCall model for tracking AI phone calls."""
    __tablename__ = "voice_calls"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    account_name = Column(String)
    contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"))
    duration = Column(String)
    status = Column(String)
    outcome = Column(String)  # picked_up, missed, retry, voicemail
    sentiment = Column(String)
    retry_count = Column(Integer, default=0)
    transcript = Column(ARRAY(String))
    
    # Timestamps
    scheduled_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="voice_calls")
    contact = relationship("Contact")
