"""
Prediction Pydantic schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class PredictionRequest(BaseModel):
    """Schema for prediction request."""
    account_id: str
    features: Dict[str, Any] = Field(..., description="Input features for prediction")


class PredictionResponse(BaseModel):
    """Schema for prediction response."""
    account_id: str
    model_type: str
    prediction_value: float
    confidence: Optional[float] = None
    model_version: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True


class BatchPredictionRequest(BaseModel):
    """Schema for batch prediction request."""
    account_ids: list[str]
    model_types: Optional[list[str]] = Field(
        default=None,
        description="List of model types to run. If None, runs all models."
    )


class BatchPredictionResponse(BaseModel):
    """Schema for batch prediction response."""
    predictions: Dict[str, Dict[str, PredictionResponse]] = Field(
        ...,
        description="Dictionary mapping account_id to model_type to prediction"
    )


class ModelHealthResponse(BaseModel):
    """Schema for model health check."""
    model_type: str
    loaded: bool
    version: Optional[str] = None
    error: Optional[str] = None
