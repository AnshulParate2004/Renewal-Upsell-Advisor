"""Lifecycle / NBA API schemas."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class ProductConsumption(BaseModel):
    product_id: str
    name: str
    purchased: bool
    deployed: bool
    current_pct: int
    target_pct: int


class LifecycleAlertResponse(BaseModel):
    account_id: str
    account_name: Optional[str] = None
    stage: str
    stage_label: str
    priority: int
    health_status: str
    score: int
    why_now: str
    consumption: List[ProductConsumption]
    contract_month: int
    contract_total_months: int
    recommended_channel: str
    recommended_channel_label: str
    recommended_action: str
    channel_reason: str
    due_hint: str
    history_insights: List[str] = []


class NextBestActionResponse(BaseModel):
    id: str
    account_id: str
    account_name: Optional[str] = None
    stage: str
    stage_label: str
    action: str
    priority: int
    due_hint: str


class AgentRecommendationResponse(BaseModel):
    actions: List[str]
    assets: List[Dict[str, str]]
    data_insight: str


class PortfolioConsumptionResponse(BaseModel):
    avg_deployment_pct: int
    products_at_risk: int
    unused_entitlements: int
    accounts_needing_action: int


class LifecycleDashboardResponse(BaseModel):
    stage_alerts: List[LifecycleAlertResponse]
    account_alerts: List[LifecycleAlertResponse]
    nba_items: List[NextBestActionResponse]
    selected_alert: Optional[LifecycleAlertResponse] = None
    agent_recommendation: Optional[AgentRecommendationResponse] = None
    portfolio_consumption: PortfolioConsumptionResponse
    stage_counts: Dict[str, int]


class ActionRecommendationResponse(BaseModel):
    channel: str
    channel_label: str
    action: str
    why_now: str
    channel_reason: str
    stage: str
    stage_label: str
    due_hint: str
    history_insights: List[str] = []
