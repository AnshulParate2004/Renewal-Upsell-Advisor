"""
WebhookEvent database model.
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.base import Base


class WebhookEvent(Base):
    """WebhookEvent model for tracking incoming events."""
    __tablename__ = "webhook_events"
    
    id = Column(String, primary_key=True, index=True)
    source = Column(String)  # salesforce, stripe, zendesk
    event_type = Column(String)
    payload = Column(JSONB)
    processed_status = Column(String, default="pending")  # pending, success, failed
    error_message = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True))
