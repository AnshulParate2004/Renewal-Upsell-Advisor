"""Lifecycle dashboard and pipeline grid aggregation."""
from __future__ import annotations

import json
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis_client import get_redis
from app.models.entities import Account

STAGES = ["protect", "renew", "activate", "expand", "adopt"]
QUARTERS = ["q1", "q2", "q3", "q4"]


async def get_pipeline_grid(
    db: AsyncSession,
    tenant_id: UUID,
    vendor: str | None = None,
    billing_interval: str | None = None,
    stage_filter: str | None = None,
) -> dict:
    cache_key = f"pipeline:grid:{tenant_id}:{vendor or 'all'}:{billing_interval or 'all'}"
    redis = get_redis()
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    q = select(Account).where(Account.tenant_id == tenant_id)
    if billing_interval:
        q = q.where(Account.billing_interval == billing_interval)
    if stage_filter:
        q = q.where(Account.current_lifecycle_stage == stage_filter)
    result = await db.execute(q)
    accounts = result.scalars().all()

    by_quarter: dict = {q: {s: {"count": 0, "arr": 0.0} for s in STAGES} for q in QUARTERS}
    stage_counts = {s: 0 for s in STAGES}
    quarter_totals = {q: {"count": 0, "arr": 0.0} for q in QUARTERS}

    for acc in accounts:
        qtr = acc.current_quarter or "q4"
        stage = acc.current_lifecycle_stage or "adopt"
        arr = float(acc.arr or 0)
        if qtr in by_quarter and stage in by_quarter[qtr]:
            by_quarter[qtr][stage]["count"] += 1
            by_quarter[qtr][stage]["arr"] += arr
        if stage in stage_counts:
            stage_counts[stage] += 1
        if qtr in quarter_totals:
            quarter_totals[qtr]["count"] += 1
            quarter_totals[qtr]["arr"] += arr

    payload = {
        "byQuarter": by_quarter,
        "quarterTotals": quarter_totals,
        "stageCounts": stage_counts,
        "vendor": vendor,
    }
    await redis.setex(cache_key, 300, json.dumps(payload))
    return payload


async def get_lifecycle_dashboard(db: AsyncSession, tenant_id: UUID, vendor: str | None = None) -> dict:
    cache_key = f"lifecycle:dashboard:{tenant_id}:{vendor or 'all'}"
    redis = get_redis()
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    result = await db.execute(
        select(
            Account.current_lifecycle_stage,
            func.count(Account.id),
            func.avg(Account.health_score),
        )
        .where(Account.tenant_id == tenant_id)
        .group_by(Account.current_lifecycle_stage)
    )
    rows = result.all()
    stage_counts = {r[0] or "adopt": r[1] for r in rows}
    payload = {
        "stageCounts": stage_counts,
        "accountAlerts": [],
        "nbaQueue": [],
        "portfolioConsumption": [],
    }
    await redis.setex(cache_key, 300, json.dumps(payload, default=str))
    return payload
