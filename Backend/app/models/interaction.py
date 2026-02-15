"""
Interaction database model for tracking customer interactions.
"""
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Interaction(Base):
    """Interaction model for storing customer interactions (calls, emails, etc.)."""
    __tablename__ = "interactions"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id"), nullable=False, index=True)
    type = Column(String, nullable=False)  # call, email, meeting, support_ticket
    title = Column(String)
    description = Column(Text)
    sentiment = Column(String)  # positive, neutral, negative
    date = Column(DateTime, nullable=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", backref="interactions")
