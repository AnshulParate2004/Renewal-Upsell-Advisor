"""
SentimentAnalysis database model.
"""
from sqlalchemy import Column, String, Float, Text, Date, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class SentimentAnalysis(Base):
    """SentimentAnalysis model for historical sentiment trends."""
    __tablename__ = "sentiment_analysis"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    analysis_date = Column(Date, nullable=False, index=True)
    sentiment_score = Column(Float)
    sentiment_category = Column(String)
    source = Column(String)  # email, call, support_ticket, survey
    summary = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="sentiment_analysis")
