"""
MetricsHistory and UsageMetric Pydantic schemas.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class MetricsHistoryResponse(BaseModel):
    id: str
    account_id: str
    date: datetime
    health_score: Optional[int] = None
    risk_score: Optional[int] = None
    relationship_score: Optional[int] = None
    churn_probability: Optional[float] = None
    utilization: Optional[float] = None
    sentiment_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

class UsageMetricResponse(BaseModel):
    id: str
    account_id: str
    metric_date: date
    active_users: int
    total_sessions: int
    utilization_percentage: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
