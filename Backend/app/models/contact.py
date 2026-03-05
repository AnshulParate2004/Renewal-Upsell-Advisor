"""
Contact database model.
"""
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Contact(Base):
    """Contact model for storing CSM, AE, Customer contacts."""
    __tablename__ = "contacts"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    salesforce_id = Column(String, unique=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String)
    role = Column(String)  # CSM, AE, Customer, Decision Maker, etc.
    city = Column(String)
    state = Column(String)
    is_primary = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="contacts", foreign_keys=[account_id])
