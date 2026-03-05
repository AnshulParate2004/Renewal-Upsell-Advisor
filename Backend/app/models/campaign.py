from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.api.deps import Base

class AutoCampaign(Base):
    __tablename__ = "auto_campaigns"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    target_audience_filter = Column(String(100), nullable=False)
    filter_min_value = Column(DECIMAL(10, 2))
    filter_max_value = Column(DECIMAL(10, 2))
    recurring_frequency = Column(String(50), nullable=False)
    action_type = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    enrollments = relationship("CampaignEnrollment", back_populates="campaign", cascade="all, delete-orphan")

class CampaignEnrollment(Base):
    __tablename__ = "campaign_enrollments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = Column(UUID(as_uuid=True), ForeignKey("auto_campaigns.id", ondelete="CASCADE"))
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    last_action_at = Column(DateTime)
    status = Column(String(50), default="active")

    # Relationships
    campaign = relationship("AutoCampaign", back_populates="enrollments")
    account = relationship("Account")
