from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import Account
from app.services.lifecycle.dashboard import get_lifecycle_dashboard

router = APIRouter(prefix="/lifecycle", tags=["lifecycle"])


@router.get("/dashboard")
async def lifecycle_dashboard(
    vendor: str | None = None,
    billing_interval: str | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_lifecycle_dashboard(db, user.tenant_id, vendor)


@router.get("/accounts/{account_id}/recommendation")
async def account_recommendation(
    account_id: UUID,
    vendor: str | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.tenant_id == user.tenant_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        return {"error": "not_found"}
    stage = account.current_lifecycle_stage or "adopt"
    return {
        "account_id": str(account_id),
        "stage": stage,
        "recommended_channel": "email",
        "recommended_action": f"Engage for {stage} stage",
        "vendor": vendor,
    }


@router.get("/accounts/{account_id}/agent")
async def account_agent(
    account_id: UUID,
    vendor: str | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rec = await account_recommendation(account_id, vendor, user, db)
    return {
        **rec,
        "agent_recommendation": {
            "summary": rec.get("recommended_action"),
            "confidence": 0.85,
        },
    }
