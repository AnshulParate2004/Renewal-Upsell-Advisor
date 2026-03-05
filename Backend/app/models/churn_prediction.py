"""
ChurnPrediction database model.
"""
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class ChurnPrediction(Base):
    """ChurnPrediction model for tracking ML output."""
    __tablename__ = "churn_predictions"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    prediction_date = Column(Date, nullable=False, index=True)
    churn_probability = Column(Float)
    risk_score = Column(Integer)
    risk_category = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('account_id', 'prediction_date', name='uq_churn_prediction'),
    )

    # Relationships
    account = relationship("Account", back_populates="churn_predictions")
