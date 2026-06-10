from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import WorkflowStep, WorkflowTemplate

router = APIRouter(prefix="/workflows", tags=["workflows"])


class TemplateCreate(BaseModel):
    vendor: str
    stage_name: str
    name: str
    description: str | None = None


class StepCreate(BaseModel):
    template_id: UUID
    step_order: int
    title: str
    action_type: str
    topic: str | None = None
    frequency: str = "weekly"
    follow_up_offset_days: int = 3


@router.get("/templates")
async def list_templates(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(WorkflowTemplate)
        .where(WorkflowTemplate.tenant_id == user.tenant_id)
        .options(selectinload(WorkflowTemplate.steps))
    )
    templates = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "vendor": t.vendor,
            "stage_name": t.stage_name,
            "name": t.name,
            "steps": [
                {
                    "id": str(s.id),
                    "step_order": s.step_order,
                    "title": s.title,
                    "action_type": s.action_type,
                    "topic": s.topic,
                }
                for s in t.steps
            ],
        }
        for t in templates
    ]


@router.post("/templates")
async def create_template(
    body: TemplateCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    t = WorkflowTemplate(tenant_id=user.tenant_id, **body.model_dump())
    db.add(t)
    await db.flush()
    return {"id": str(t.id), **body.model_dump()}


@router.put("/templates/{template_id}")
async def update_template(
    template_id: UUID,
    body: TemplateCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WorkflowTemplate).where(WorkflowTemplate.id == template_id, WorkflowTemplate.tenant_id == user.tenant_id)
    )
    t = result.scalar_one_or_none()
    if not t:
        raise HTTPException(404)
    for k, v in body.model_dump().items():
        setattr(t, k, v)
    return {"id": str(t.id)}


@router.post("/steps")
async def create_step(body: StepCreate, db: AsyncSession = Depends(get_db)):
    step = WorkflowStep(**body.model_dump())
    db.add(step)
    await db.flush()
    return {"id": str(step.id)}


@router.put("/steps/{step_id}")
async def update_step(step_id: UUID, body: StepCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowStep).where(WorkflowStep.id == step_id))
    step = result.scalar_one_or_none()
    if not step:
        raise HTTPException(404)
    for k, v in body.model_dump().items():
        setattr(step, k, v)
    return {"id": str(step.id)}


@router.delete("/steps/{step_id}")
async def delete_step(step_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(WorkflowStep).where(WorkflowStep.id == step_id))
    step = result.scalar_one_or_none()
    if step:
        await db.delete(step)
    return {"deleted": True}
