"""
Prediction database model for storing ML model predictions.
"""
from sqlalchemy import Column, String, Float, DateTime, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Prediction(Base):
    """Prediction model for storing ML model prediction history."""
    __tablename__ = "predictions"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, nullable=False, index=True)
    model_type = Column(String, nullable=False, index=True)  # churn, health_score, etc.
    prediction_value = Column(Float, nullable=False)
    confidence = Column(Float)
    input_features = Column(JSON)  # Store input features for audit
    model_version = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
