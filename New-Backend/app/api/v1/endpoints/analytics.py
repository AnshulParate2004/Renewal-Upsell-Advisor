from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import Account, UpsellOpportunity

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/dashboard")
async def analytics_dashboard(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(
            func.count(Account.id),
            func.avg(Account.health_score),
            func.avg(Account.risk_score),
            func.sum(Account.arr),
        ).where(Account.tenant_id == user.tenant_id)
    )
    row = result.one()
    return {
        "total_accounts": row[0] or 0,
        "avg_health_score": float(row[1] or 0),
        "avg_risk_score": float(row[2] or 0),
        "total_arr": float(row[3] or 0),
        "upsell_pipeline": 0,
    }


@router.get("/portfolio")
async def portfolio(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return await analytics_dashboard(user, db)


@router.get("/trends")
async def trends(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    return {"trends": [], "period": "30d"}
