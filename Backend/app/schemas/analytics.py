"""Pydantic schemas for portfolio analytics endpoints."""
from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class PortfolioKpis(BaseModel):
    total_accounts: int = 0
    churn_risk_count: int = 0
    avg_health_score: float = 0.0
    avg_relationship_score: float = 0.0
    avg_sentiment_score: float = 0.0
    total_revenue: float = 0.0
    upsell_pipeline: float = 0.0
    avg_utilization_percent: float = 0.0
    accounts_on_track: int = 0
    upsell_account_count: int = 0
    renewed_count: int = 0


class LifecycleStageMetric(BaseModel):
    stage: str
    label: str
    count: int = 0
    revenue: float = 0.0


class RenewalQuarterMetric(BaseModel):
    quarter: str
    label: str
    count: int = 0
    revenue: float = 0.0
    days_range: str


class RiskDistributionItem(BaseModel):
    name: str
    value: int = 0


class UpsellStageMetric(BaseModel):
    stage: str
    count: int = 0
    value: float = 0.0


class PortfolioConsumption(BaseModel):
    avg_deployment_pct: int = 0
    products_at_risk: int = 0
    unused_entitlements: int = 0
    accounts_needing_action: int = 0


class ScoreBucket(BaseModel):
    bucket: str
    count: int = 0


class ScoreDistribution(BaseModel):
    metric: str
    buckets: List[ScoreBucket] = Field(default_factory=list)


class TopAtRiskAccount(BaseModel):
    account_id: str
    account_name: str
    stage: str
    stage_label: str
    risk_score: float = 0.0
    renewal_days: Optional[int] = None
    revenue: float = 0.0


class AnalyticsGoals(BaseModel):
    upsell_pipeline_target: float = 0.0
    renewal_target_percent: float = 0.0
    high_risk_threshold_percent: float = 70.0
    upsell_pipeline_actual: float = 0.0
    renewal_rate_percent: float = 0.0
    high_risk_count: int = 0


class PortfolioAnalyticsResponse(BaseModel):
    kpis: PortfolioKpis
    lifecycle_stages: List[LifecycleStageMetric] = Field(default_factory=list)
    renewal_quarters: List[RenewalQuarterMetric] = Field(default_factory=list)
    risk_distribution: List[RiskDistributionItem] = Field(default_factory=list)
    upsell_by_stage: List[UpsellStageMetric] = Field(default_factory=list)
    portfolio_consumption: PortfolioConsumption = Field(default_factory=PortfolioConsumption)
    score_distributions: List[ScoreDistribution] = Field(default_factory=list)
    top_at_risk_accounts: List[TopAtRiskAccount] = Field(default_factory=list)
    goals: AnalyticsGoals = Field(default_factory=AnalyticsGoals)


class TrendDataPoint(BaseModel):
    month: str
    total_revenue: float = 0.0
    churn_risk_count: int = 0
    renewed_count: int = 0
    at_risk_count: int = 0
    avg_health_score: float = 0.0


class AnalyticsTrendsResponse(BaseModel):
    months: int = 12
    series: List[TrendDataPoint] = Field(default_factory=list)
