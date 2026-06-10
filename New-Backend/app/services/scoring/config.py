"""Scoring and lifecycle bucket configuration from app_settings."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entities import AppSettings

DEFAULT_SCORING_PATH = Path(__file__).resolve().parents[3] / "schemas" / "scoring_config.example.json"
TECH_PLAN_SCORING_PATH = (
    Path(__file__).resolve().parents[4]
    / "Document"
    / "tech-plan"
    / "schemas"
    / "scoring_config.example.json"
)


class RecencyTier(BaseModel):
    max_days: int
    points: float


class RelationshipConfig(BaseModel):
    recency_weight: float = 0.6
    sentiment_weight: float = 0.4
    recency_tiers: list[RecencyTier] = Field(default_factory=list)
    negative_sentiment_categories: list[str] = Field(default_factory=lambda: ["negative", "very_negative"])
    negative_sentiment_multiplier: float = 0.7


class HealthConfig(BaseModel):
    util_weight: float = 0.40
    sentiment_weight: float = 0.30
    recency_weight: float = 0.30
    relationship_blend: float = 0.0


class ChurnConfig(BaseModel):
    base_formula: str = "1 - health/100"
    urgency_renewal_days_lt: int = 30
    urgency_health_below: int = 50
    urgency_penalty: float = 0.20
    at_risk_status_floor: float = 0.80


class RiskBands(BaseModel):
    low_max: int = 39
    medium_max: int = 69


class RiskConfig(BaseModel):
    derive_from_churn: bool = True
    at_risk_score_floor: int = 70
    bands: RiskBands = Field(default_factory=RiskBands)


class UpsellBlendWeights(BaseModel):
    health: float = 0.5
    utilization: float = 0.3
    arr_log: float = 0.2


class UpsellConfig(BaseModel):
    gate_min_health_score: int = 65
    gate_min_utilization_percent: int = 72
    gate_max_risk_score: int = 45
    blend_weights: UpsellBlendWeights = Field(default_factory=UpsellBlendWeights)


class ThresholdLinks(BaseModel):
    sync_with_lifecycle_buckets: bool = True
    map_expand_to_upsell_gates: bool = True


class ScoringConfig(BaseModel):
    relationship: RelationshipConfig = Field(default_factory=RelationshipConfig)
    health: HealthConfig = Field(default_factory=HealthConfig)
    churn: ChurnConfig = Field(default_factory=ChurnConfig)
    risk: RiskConfig = Field(default_factory=RiskConfig)
    upsell: UpsellConfig = Field(default_factory=UpsellConfig)
    threshold_links: ThresholdLinks = Field(default_factory=ThresholdLinks)


class LifecycleBucketsConfig(BaseModel):
    protect_min_risk_score: int = Field(70, ge=0, le=100)
    protect_include_at_risk_status: bool = True
    activate_max_days_since_start: int = Field(90, ge=1, le=365)
    activate_max_utilization_percent: int = Field(45, ge=0, le=100)
    renew_window_min_days: int = Field(0, ge=0, le=730)
    renew_window_max_days: int = Field(120, ge=1, le=730)
    expand_min_health_score: int = Field(65, ge=0, le=100)
    expand_min_utilization_percent: int = Field(72, ge=0, le=100)
    expand_max_risk_score: int = Field(45, ge=0, le=100)
    adopt_max_utilization_percent: int = Field(58, ge=0, le=100)


def _load_default_scoring_json() -> dict[str, Any]:
    for path in (TECH_PLAN_SCORING_PATH, DEFAULT_SCORING_PATH):
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    return ScoringConfig().model_dump()


DEFAULT_SCORING_CONFIG = ScoringConfig.model_validate(_load_default_scoring_json())
DEFAULT_LIFECYCLE_BUCKETS = LifecycleBucketsConfig()


async def load_app_config(db: AsyncSession, tenant_id) -> dict[str, Any]:
    result = await db.execute(
        select(AppSettings).where(AppSettings.tenant_id == tenant_id, AppSettings.config_key == "default")
    )
    row = result.scalar_one_or_none()
    return row.config if row else {}


async def load_scoring_config(db: AsyncSession, tenant_id) -> ScoringConfig:
    cfg = await load_app_config(db, tenant_id)
    raw = cfg.get("scoring_formulas")
    if not raw:
        return DEFAULT_SCORING_CONFIG
    return ScoringConfig.model_validate(raw)


async def load_lifecycle_buckets_config(db: AsyncSession, tenant_id) -> LifecycleBucketsConfig:
    cfg = await load_app_config(db, tenant_id)
    raw = cfg.get("lifecycle_buckets")
    if not raw:
        return DEFAULT_LIFECYCLE_BUCKETS
    return LifecycleBucketsConfig.model_validate(raw)
