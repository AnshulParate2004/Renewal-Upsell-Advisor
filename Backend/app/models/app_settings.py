"""
AppSettings database model.
"""
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.base import Base


class AppSettings(Base):
    """AppSettings model for tenant configuration."""
    __tablename__ = "app_settings"
    
    id = Column(String, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(JSONB)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
