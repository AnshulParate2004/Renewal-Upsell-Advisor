from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import UpsellOpportunity

router = APIRouter(prefix="/opportunities", tags=["opportunities"])


class OpportunityCreate(BaseModel):
    account_id: UUID
    product_recommendation: str | None = None
    estimated_value: float | None = None
    probability: float | None = None
    status: str = "open"


@router.get("/")
async def list_opportunities(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UpsellOpportunity).limit(100))
    return [
        {
            "id": str(o.id),
            "account_id": str(o.account_id),
            "product_recommendation": o.product_recommendation,
            "estimated_value": float(o.estimated_value or 0),
            "probability": float(o.probability or 0),
            "status": o.status,
        }
        for o in result.scalars().all()
    ]


@router.post("/")
async def create_opportunity(body: OpportunityCreate, db: AsyncSession = Depends(get_db)):
    o = UpsellOpportunity(**body.model_dump())
    db.add(o)
    await db.flush()
    return {"id": str(o.id)}


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UpsellOpportunity).where(UpsellOpportunity.id == opportunity_id))
    o = result.scalar_one_or_none()
    if not o:
        raise HTTPException(404)
    return {"id": str(o.id), "status": o.status}


@router.put("/{opportunity_id}")
async def update_opportunity(opportunity_id: UUID, body: OpportunityCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UpsellOpportunity).where(UpsellOpportunity.id == opportunity_id))
    o = result.scalar_one_or_none()
    if not o:
        raise HTTPException(404)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(o, k, v)
    return {"id": str(o.id)}


@router.delete("/{opportunity_id}")
async def delete_opportunity(opportunity_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UpsellOpportunity).where(UpsellOpportunity.id == opportunity_id))
    o = result.scalar_one_or_none()
    if o:
        await db.delete(o)
    return {"deleted": True}
