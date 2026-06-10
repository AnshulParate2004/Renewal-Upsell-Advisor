"""Celery background tasks."""
from __future__ import annotations

import asyncio
from uuid import UUID

from sqlalchemy import select

from app.db.mongo import ensure_mongo_indexes
from app.db.session import AsyncSessionLocal
from app.models.entities import Account, Tenant
from app.services.scoring.pipeline import score_account
from app.workers.celery_app import celery_app


def _run_async(coro):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(coro)
    import concurrent.futures
    with concurrent.futures.ThreadPoolExecutor() as pool:
        return pool.submit(asyncio.run, coro).result()


async def _score_all(tenant_id: UUID | None = None) -> int:
    count = 0
    async with AsyncSessionLocal() as db:
        q = select(Account)
        if tenant_id:
            q = q.where(Account.tenant_id == tenant_id)
        result = await db.execute(q)
        accounts = result.scalars().all()
        for account in accounts:
            await score_account(db, account.id, account.tenant_id)
            count += 1
        await db.commit()
    return count


@celery_app.task(name="app.workers.tasks.scoring_daily")
def scoring_daily() -> dict:
    count = _run_async(_score_all())
    return {"scored": count}


@celery_app.task(name="app.workers.tasks.scoring_incremental")
def scoring_incremental() -> dict:
    return scoring_daily()


@celery_app.task(name="app.workers.tasks.lifecycle_reclassify")
def lifecycle_reclassify() -> dict:
    return scoring_daily()


@celery_app.task(name="app.workers.tasks.workflow_step_evaluator")
def workflow_step_evaluator() -> dict:
    return {"evaluated": 0}


@celery_app.task(name="app.workers.tasks.workflow_enrollment_sync")
def workflow_enrollment_sync() -> dict:
    return {"enrolled": 0}


@celery_app.task(name="app.workers.tasks.campaign_evaluator")
def campaign_evaluator() -> dict:
    return {"campaigns": 0}


@celery_app.task(name="app.workers.tasks.email_inbound_poll")
def email_inbound_poll() -> dict:
    return {"polled": True}


@celery_app.task(name="app.workers.tasks.voice_retry_sweep")
def voice_retry_sweep() -> dict:
    return {"retried": 0}


@celery_app.task(name="app.workers.tasks.analytics_rollup")
def analytics_rollup() -> dict:
    return {"rolled_up": True}


@celery_app.task(name="app.workers.tasks.integration_sf_sync")
def integration_sf_sync() -> dict:
    return {"synced": False}


@celery_app.task(name="app.workers.tasks.mongo_ttl_cleanup")
def mongo_ttl_cleanup() -> dict:
    _run_async(ensure_mongo_indexes())
    return {"indexes": "verified"}


@celery_app.task(name="app.workers.tasks.redis_cache_warm")
def redis_cache_warm() -> dict:
    return {"warmed": True}
