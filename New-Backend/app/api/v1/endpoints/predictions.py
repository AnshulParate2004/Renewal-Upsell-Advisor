from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.core.config import get_settings
from app.db.session import get_db
from app.models.entities import Account
from app.services.scoring.config import load_lifecycle_buckets_config, load_scoring_config
from app.services.scoring.formulas import run_formula_pipeline
from app.services.scoring.pipeline import account_to_features
from app.services.scoring.sentiment import sentiment_enrich

router = APIRouter(prefix="/predictions", tags=["predictions"])


class PredictRequest(BaseModel):
    account_id: UUID


@router.get("/health")
async def predictions_health():
    return {
        "status": "ok",
        "scoring_mode": get_settings().scoring_mode,
        "components": ["utilization", "relationship", "health", "churn", "risk", "upsell", "sentiment"],
    }


@router.post("/predict")
async def predict_one(
    body: PredictRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == body.account_id, Account.tenant_id == user.tenant_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(404, "Account not found")
    scoring_cfg = await load_scoring_config(db, user.tenant_id)
    bucket_cfg = await load_lifecycle_buckets_config(db, user.tenant_id)
    sentiment = await sentiment_enrich(account.id, tenant_id=user.tenant_id, db=db)
    scores = run_formula_pipeline(account_to_features(account), sentiment, scoring_cfg, bucket_cfg)
    return scores


@router.post("/predict/all")
async def predict_all(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.tenant_id == user.tenant_id))
    accounts = result.scalars().all()
    scoring_cfg = await load_scoring_config(db, user.tenant_id)
    bucket_cfg = await load_lifecycle_buckets_config(db, user.tenant_id)
    out = []
    for account in accounts:
        sentiment = await sentiment_enrich(account.id, tenant_id=user.tenant_id, db=db)
        scores = run_formula_pipeline(account_to_features(account), sentiment, scoring_cfg, bucket_cfg)
        out.append({"account_id": str(account.id), **scores})
    return {"results": out, "count": len(out)}


@router.post("/predict/batch")
async def predict_batch(
    account_ids: list[UUID],
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await predict_all(user, db)
