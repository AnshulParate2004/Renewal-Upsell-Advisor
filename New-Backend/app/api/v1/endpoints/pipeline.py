from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.services.lifecycle.dashboard import get_pipeline_grid

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.get("/grid")
async def pipeline_grid(
    vendor: str | None = None,
    billing_interval: str | None = None,
    stage: str | None = Query(None, alias="stage"),
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_pipeline_grid(db, user.tenant_id, vendor, billing_interval, stage)
