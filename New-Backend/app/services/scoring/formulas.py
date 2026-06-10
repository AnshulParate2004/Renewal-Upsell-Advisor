"""Phase 1 deterministic scoring formulas — Document/tech-plan/schemas/scoring_formulas.md."""
from __future__ import annotations

import math
from datetime import date, datetime
from typing import Any

from app.services.scoring.config import LifecycleBucketsConfig, ScoringConfig


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def days_since_last_contact(last_contact_date: date | datetime | None, today: date | None = None) -> int:
    today = today or date.today()
    if not last_contact_date:
        return 30
    if isinstance(last_contact_date, datetime):
        last_contact_date = last_contact_date.date()
    return max(0, min(365, (today - last_contact_date).days))


def recency_points(dsbc: int, cfg: ScoringConfig) -> float:
    for tier in cfg.relationship.recency_tiers:
        if dsbc <= tier.max_days:
            return tier.points
    return cfg.relationship.recency_tiers[-1].points if cfg.relationship.recency_tiers else 10.0


def sentiment_points(sentiment_score: float, category: str, cfg: ScoringConfig) -> float:
    pts = ((sentiment_score + 1) / 2) * 100
    if category in cfg.relationship.negative_sentiment_categories:
        pts *= cfg.relationship.negative_sentiment_multiplier
    return pts


def resolve_upsell_gates(scoring_cfg: ScoringConfig, bucket_cfg: LifecycleBucketsConfig) -> dict[str, int]:
    if scoring_cfg.threshold_links.sync_with_lifecycle_buckets:
        return {
            "min_health": bucket_cfg.expand_min_health_score,
            "min_util": bucket_cfg.expand_min_utilization_percent,
            "max_risk": bucket_cfg.expand_max_risk_score,
        }
    u = scoring_cfg.upsell
    return {
        "min_health": u.gate_min_health_score,
        "min_util": u.gate_min_utilization_percent,
        "max_risk": u.gate_max_risk_score,
    }


def compute_utilization(features: dict[str, Any]) -> float:
    lic_total = int(features.get("licenses_total") or 0)
    lic_used = int(features.get("licenses_used") or 0)
    util_raw = features.get("utilization_percentage")

    if lic_total > 0:
        util_ratio = clamp(lic_used / lic_total, 0.0, 1.0)
    elif util_raw is not None:
        u = float(util_raw)
        util_ratio = u if 0 <= u <= 1 else clamp(u / 100.0, 0.0, 1.0)
    else:
        util_ratio = 0.5

    return util_ratio * 100.0


def compute_relationship_score(features: dict[str, Any], sentiment: dict[str, Any], cfg: ScoringConfig) -> int:
    dsbc = days_since_last_contact(features.get("last_contact_date"))
    recency_pts = recency_points(dsbc, cfg)
    sent_pts = sentiment_points(
        float(sentiment.get("sentiment_score", 0.0)),
        str(sentiment.get("sentiment_category", "neutral")),
        cfg,
    )
    score = cfg.relationship.recency_weight * recency_pts + cfg.relationship.sentiment_weight * sent_pts
    return int(round(clamp(score, 0, 100)))


def compute_health_score(
    features: dict[str, Any],
    util_pct: float,
    sentiment: dict[str, Any],
    relationship_score: int,
    cfg: ScoringConfig,
) -> int:
    dsbc = days_since_last_contact(features.get("last_contact_date"))
    recency_pts = recency_points(dsbc, cfg)
    sent_pts = sentiment_points(
        float(sentiment.get("sentiment_score", 0.0)),
        str(sentiment.get("sentiment_category", "neutral")),
        cfg,
    )
    score = (
        cfg.health.util_weight * util_pct
        + cfg.health.sentiment_weight * sent_pts
        + cfg.health.recency_weight * recency_pts
    )
    blend = cfg.health.relationship_blend
    if blend > 0:
        score = (1 - blend) * score + blend * relationship_score
    return int(round(clamp(score, 0, 100)))


def compute_churn_probability(features: dict[str, Any], health_score: int, cfg: ScoringConfig) -> float:
    p = 1.0 - (health_score / 100.0)
    days_until = int(features.get("days_until_renewal") or 90)
    status = (features.get("status") or "").lower()

    if days_until < cfg.churn.urgency_renewal_days_lt and health_score < cfg.churn.urgency_health_below:
        p += cfg.churn.urgency_penalty
    if status == "at_risk":
        p = max(p, cfg.churn.at_risk_status_floor)
    return clamp(p, 0.0, 1.0)


def compute_risk_score(
    features: dict[str, Any],
    churn_probability: float,
    cfg: ScoringConfig,
    bucket_cfg: LifecycleBucketsConfig,
) -> int:
    risk = int(round(churn_probability * 100))
    status = (features.get("status") or "").lower()
    floor = cfg.risk.at_risk_score_floor
    if cfg.threshold_links.sync_with_lifecycle_buckets:
        floor = max(floor, bucket_cfg.protect_min_risk_score)
    if status == "at_risk":
        risk = max(risk, floor)
    return int(clamp(risk, 0, 100))


def compute_upsell_score(
    features: dict[str, Any],
    health_score: int,
    util_pct: float,
    risk_score: int,
    cfg: ScoringConfig,
    bucket_cfg: LifecycleBucketsConfig,
) -> int:
    gates = resolve_upsell_gates(cfg, bucket_cfg)
    if not (
        health_score >= gates["min_health"]
        and util_pct >= gates["min_util"]
        and risk_score < gates["max_risk"]
    ):
        return 0
    arr = float(features.get("arr") or 0)
    w = cfg.upsell.blend_weights
    arr_factor = math.log10(arr + 1) * 10
    score = w.health * health_score + w.utilization * util_pct + w.arr_log * arr_factor
    return int(round(clamp(score, 0, 100)))


def run_formula_pipeline(
    features: dict[str, Any],
    sentiment: dict[str, Any],
    scoring_cfg: ScoringConfig,
    bucket_cfg: LifecycleBucketsConfig,
) -> dict[str, Any]:
    util_pct = compute_utilization(features)
    relationship_score = compute_relationship_score(features, sentiment, scoring_cfg)
    health_score = compute_health_score(features, util_pct, sentiment, relationship_score, scoring_cfg)
    churn_probability = compute_churn_probability(features, health_score, scoring_cfg)
    risk_score = compute_risk_score(features, churn_probability, scoring_cfg, bucket_cfg)
    upsell_score = compute_upsell_score(features, health_score, util_pct, risk_score, scoring_cfg, bucket_cfg)
    return {
        "util_pct": util_pct,
        "relationship_score": relationship_score,
        "health_score": health_score,
        "churn_probability": churn_probability,
        "risk_score": risk_score,
        "upsell_score": upsell_score,
        "sentiment_score": sentiment.get("sentiment_score", 0.0),
        "sentiment_category": sentiment.get("sentiment_category", "neutral"),
    }
