"""Configurable thresholds for lifecycle bucket classification."""
from __future__ import annotations

from pydantic import BaseModel, Field


class LifecycleBucketsConfig(BaseModel):
    """Rules evaluated top-to-bottom in classify_stage (first match wins)."""

    protect_min_risk_score: int = Field(70, ge=0, le=100)
    protect_include_at_risk_status: bool = Field(True)

    activate_max_days_since_start: int = Field(90, ge=1, le=365)
    activate_max_utilization_percent: int = Field(45, ge=0, le=100)

    renew_window_min_days: int = Field(0, ge=0, le=730)
    renew_window_max_days: int = Field(120, ge=1, le=730)

    expand_min_health_score: int = Field(65, ge=0, le=100)
    expand_min_utilization_percent: int = Field(72, ge=0, le=100)
    expand_max_risk_score: int = Field(45, ge=0, le=100)

    adopt_max_utilization_percent: int = Field(58, ge=0, le=100)


DEFAULT_LIFECYCLE_BUCKETS_CONFIG = LifecycleBucketsConfig()


def load_lifecycle_buckets_config() -> LifecycleBucketsConfig:
    """Load lifecycle bucket rules from app_settings (falls back to defaults)."""
    try:
        from app.api.v1.endpoints.settings import _load_settings_from_db

        settings = _load_settings_from_db()
        raw = getattr(settings, "lifecycle_buckets", None)
        if raw is None:
            return DEFAULT_LIFECYCLE_BUCKETS_CONFIG
        if isinstance(raw, LifecycleBucketsConfig):
            return raw
        return LifecycleBucketsConfig.model_validate(raw)
    except Exception:
        return DEFAULT_LIFECYCLE_BUCKETS_CONFIG
