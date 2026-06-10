from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import AppSettings
from app.services.llm.config import LLMRoutingConfig, invalidate_llm_routing_cache, load_llm_routing
from app.services.scoring.config import (
    DEFAULT_LIFECYCLE_BUCKETS,
    DEFAULT_SCORING_CONFIG,
    LifecycleBucketsConfig,
    ScoringConfig,
    load_app_config,
)

router = APIRouter(prefix="/settings", tags=["settings"])


class ConfigUpdate(BaseModel):
    lifecycle_buckets: dict | None = None
    scoring_formulas: dict | None = None
    schedule: dict | None = None


@router.get("/config")
async def get_config(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cfg = await load_app_config(db, user.tenant_id)
    if not cfg:
        return {
            "lifecycle_buckets": DEFAULT_LIFECYCLE_BUCKETS.model_dump(),
            "scoring_formulas": DEFAULT_SCORING_CONFIG.model_dump(),
        }
    return cfg


@router.post("/config")
async def update_config(
    body: ConfigUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppSettings).where(AppSettings.tenant_id == user.tenant_id, AppSettings.config_key == "default")
    )
    row = result.scalar_one_or_none()
    merged = row.config if row else {}
    if body.lifecycle_buckets:
        merged["lifecycle_buckets"] = body.lifecycle_buckets
    if body.scoring_formulas:
        merged["scoring_formulas"] = body.scoring_formulas
    if body.schedule:
        merged["schedule"] = body.schedule
    if row:
        row.config = merged
    else:
        db.add(AppSettings(tenant_id=user.tenant_id, config_key="default", config=merged))
    return merged


@router.get("/scoring-formulas")
async def get_scoring_formulas(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    cfg = await load_app_config(db, user.tenant_id)
    raw = cfg.get("scoring_formulas") if cfg else None
    return ScoringConfig.model_validate(raw) if raw else DEFAULT_SCORING_CONFIG


@router.patch("/scoring-formulas")
async def patch_scoring_formulas(
    body: ScoringConfig,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await update_config(ConfigUpdate(scoring_formulas=body.model_dump()), user, db)
    return body


@router.get("/llm-config")
async def get_llm_config(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return merged LLM routing config (env var names only, never secret values)."""
    return await load_llm_routing(db, user.tenant_id)


@router.patch("/llm-config")
async def patch_llm_config(
    body: LLMRoutingConfig,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(AppSettings).where(AppSettings.tenant_id == user.tenant_id, AppSettings.config_key == "default")
    )
    row = result.scalar_one_or_none()
    merged = row.config if row else {}
    merged["llm_routing"] = body.model_dump()
    if row:
        row.config = merged
    else:
        db.add(AppSettings(tenant_id=user.tenant_id, config_key="default", config=merged))
    await invalidate_llm_routing_cache(user.tenant_id)
    return body


@router.get("/setup")
async def get_setup(user: CurrentUser = Depends(get_current_user)):
    return {"providers": [], "paused": False}


@router.post("/setup")
async def save_setup(payload: dict, user: CurrentUser = Depends(get_current_user)):
    return {"saved": True}


@router.patch("/setup/pause")
async def pause_setup(paused: bool = True, user: CurrentUser = Depends(get_current_user)):
    return {"paused": paused}
