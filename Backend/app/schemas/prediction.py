"""
Prediction API schemas.
"""
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime


class PredictionRequest(BaseModel):
    account_id: str
    features: Dict[str, Any]


class PredictionResponse(BaseModel):
    account_id: str
    model_type: str
    prediction_value: float
    confidence: Optional[float] = None
    timestamp: datetime


class BatchPredictionRequest(BaseModel):
    account_ids: List[str]
    model_types: Optional[List[str]] = None


class BatchPredictionResponse(BaseModel):
    predictions: Dict[str, Dict[str, PredictionResponse]]


class ModelHealthResponse(BaseModel):
    model_type: str
    loaded: bool
    version: Optional[str] = None
    error: Optional[str] = None
