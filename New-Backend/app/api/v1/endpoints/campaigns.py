from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import AutoCampaign
from app.workers.tasks import campaign_evaluator

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignCreate(BaseModel):
    name: str
    action_type: str
    filter_config: dict | None = None
    is_active: bool = True


@router.get("/")
async def list_campaigns(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AutoCampaign).where(AutoCampaign.tenant_id == user.tenant_id))
    return [
        {"id": str(c.id), "name": c.name, "action_type": c.action_type, "is_active": c.is_active}
        for c in result.scalars().all()
    ]


@router.post("/")
async def create_campaign(
    body: CampaignCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    c = AutoCampaign(tenant_id=user.tenant_id, **body.model_dump())
    db.add(c)
    await db.flush()
    return {"id": str(c.id), **body.model_dump()}


@router.post("/run-now")
async def run_now(campaign_id: UUID | None = None):
    task = campaign_evaluator.delay()
    return {"task_id": task.id, "campaign_id": str(campaign_id) if campaign_id else None}
