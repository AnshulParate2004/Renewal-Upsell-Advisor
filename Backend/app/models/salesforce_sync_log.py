"""
SalesforceSyncLog database model.
"""
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.base import Base


class SalesforceSyncLog(Base):
    """SalesforceSyncLog model for audit trail of CRM sync."""
    __tablename__ = "salesforce_sync_log"
    
    id = Column(String, primary_key=True, index=True)
    sync_type = Column(String)  # full, incremental, webhook
    status = Column(String)  # success, failed, in_progress
    records_processed = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_details = Column(JSONB)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
