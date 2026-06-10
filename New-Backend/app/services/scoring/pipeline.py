"""Scoring pipeline orchestration — persist scores and reclassify buckets."""
from __future__ import annotations

from datetime import date
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis_client import cache_delete_pattern
from app.models.entities import (
    Account,
    ChurnPrediction,
    LifecycleStageSnapshot,
    MLScoreHistory,
    SentimentSnapshot,
    UpsellOpportunity,
)
from app.services.classification.engine import classify_lifecycle_bucket, compute_quarter, days_until_renewal
from app.services.scoring.config import load_lifecycle_buckets_config, load_scoring_config
from app.services.scoring.formulas import run_formula_pipeline
from app.services.scoring.sentiment import sentiment_enrich


def account_to_features(account: Account) -> dict[str, Any]:
    return {
        "licenses_total": account.licenses_total,
        "licenses_used": account.licenses_used,
        "utilization_percentage": float(account.utilization_percentage or 0),
        "last_contact_date": account.last_contact_date,
        "renewal_date": account.renewal_date,
        "contract_end_date": account.contract_end_date,
        "contract_start_date": account.contract_start_date,
        "days_until_renewal": days_until_renewal(
            {"renewal_date": account.renewal_date, "contract_end_date": account.contract_end_date}
        ),
        "status": account.status,
        "arr": float(account.arr or 0),
    }


async def score_account(db: AsyncSession, account_id: UUID, tenant_id: UUID) -> dict[str, Any]:
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.tenant_id == tenant_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise ValueError(f"Account {account_id} not found")

    scoring_cfg = await load_scoring_config(db, tenant_id)
    bucket_cfg = await load_lifecycle_buckets_config(db, tenant_id)

    sentiment = await sentiment_enrich(account_id, tenant_id=tenant_id, db=db)
    features = account_to_features(account)
    scores = run_formula_pipeline(features, sentiment, scoring_cfg, bucket_cfg)

    account.health_score = scores["health_score"]
    account.relationship_score = scores["relationship_score"]
    account.risk_score = scores["risk_score"]
    account.churn_probability = scores["churn_probability"]
    account.sentiment_score = scores["sentiment_score"]
    account.sentiment_category = scores["sentiment_category"]
    account.utilization_percentage = scores["util_pct"]

    db.add(
        MLScoreHistory(
            account_id=account.id,
            scoring_mode="formula",
            health_score=scores["health_score"],
            relationship_score=scores["relationship_score"],
            risk_score=scores["risk_score"],
            churn_probability=scores["churn_probability"],
            upsell_score=scores["upsell_score"],
            utilization_percentage=scores["util_pct"],
            sentiment_score=scores["sentiment_score"],
        )
    )
    db.add(
        SentimentSnapshot(
            account_id=account.id,
            source="scoring_pipeline",
            sentiment_score=scores["sentiment_score"],
            sentiment_category=scores["sentiment_category"],
        )
    )
    if scores["churn_probability"] >= 0.5:
        db.add(
            ChurnPrediction(
                account_id=account.id,
                churn_probability=scores["churn_probability"],
                risk_level="high" if scores["risk_score"] >= 70 else "medium",
            )
        )
    if scores["upsell_score"] > 0:
        db.add(
            UpsellOpportunity(
                account_id=account.id,
                product_recommendation="expansion",
                estimated_value=float(account.arr or 0) * 0.15,
                probability=scores["upsell_score"] / 100.0,
            )
        )

    stage = classify_lifecycle_bucket(
        {
            "risk_score": scores["risk_score"],
            "health_score": scores["health_score"],
            "utilization_percentage": scores["util_pct"],
            "status": account.status,
            "renewal_date": account.renewal_date,
            "contract_end_date": account.contract_end_date,
            "contract_start_date": account.contract_start_date,
        },
        bucket_cfg,
    )
    account.current_lifecycle_stage = stage
    account.current_quarter = compute_quarter(
        {"renewal_date": account.renewal_date, "contract_end_date": account.contract_end_date}
    )
    db.add(
        LifecycleStageSnapshot(
            account_id=account.id,
            stage=stage,
            priority={"protect": 1, "renew": 2, "activate": 3, "expand": 4, "adopt": 5}.get(stage, 5),
        )
    )

    await cache_delete_pattern(f"lifecycle:dashboard:{tenant_id}:*")
    await cache_delete_pattern(f"pipeline:grid:{tenant_id}:*")

    return scores
