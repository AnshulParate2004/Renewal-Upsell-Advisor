from datetime import date
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import Account, AccountComment, ActivityLog, SupportTicket

router = APIRouter(prefix="/accounts", tags=["accounts"])


class AccountCreate(BaseModel):
    name: str
    arr: float = 0
    billing_interval: str = "annual"
    industry: str | None = None
    renewal_date: date | None = None


class AccountUpdate(BaseModel):
    name: str | None = None
    arr: float | None = None
    health_score: int | None = None
    risk_score: int | None = None
    relationship_score: int | None = None
    churn_probability: float | None = None
    sentiment_score: float | None = None
    utilization_percentage: float | None = None
    licenses_used: int | None = None
    licenses_total: int | None = None
    status: str | None = None


class CommentCreate(BaseModel):
    body: str


def _serialize_account(a: Account) -> dict[str, Any]:
    return {
        "id": str(a.id),
        "name": a.name,
        "arr": float(a.arr or 0),
        "mrr": float(a.mrr or 0),
        "billing_interval": a.billing_interval,
        "health_score": a.health_score,
        "risk_score": a.risk_score,
        "relationship_score": a.relationship_score,
        "churn_probability": float(a.churn_probability or 0),
        "sentiment_score": float(a.sentiment_score or 0),
        "sentiment_category": a.sentiment_category,
        "utilization_percentage": float(a.utilization_percentage or 0),
        "licenses_used": a.licenses_used,
        "licenses_total": a.licenses_total,
        "renewal_date": a.renewal_date.isoformat() if a.renewal_date else None,
        "contract_start_date": a.contract_start_date.isoformat() if a.contract_start_date else None,
        "contract_end_date": a.contract_end_date.isoformat() if a.contract_end_date else None,
        "last_contact_date": a.last_contact_date.isoformat() if a.last_contact_date else None,
        "status": a.status,
        "industry": a.industry,
        "company_size": a.company_size,
        "csm_name": a.csm_name,
        "primary_contact_name": a.primary_contact_name,
        "primary_contact_email": a.primary_contact_email,
        "primary_contact_phone": a.primary_contact_phone,
        "current_lifecycle_stage": a.current_lifecycle_stage,
        "current_quarter": a.current_quarter,
    }


@router.get("/")
async def list_accounts(
    skip: int = 0,
    limit: int = Query(1000, le=5000),
    billing_interval: str | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(Account).where(Account.tenant_id == user.tenant_id)
    if billing_interval:
        q = q.where(Account.billing_interval == billing_interval)
    q = q.offset(skip).limit(limit)
    result = await db.execute(q)
    return [_serialize_account(a) for a in result.scalars().all()]


@router.post("/")
async def create_account(
    body: AccountCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = Account(tenant_id=user.tenant_id, **body.model_dump())
    db.add(account)
    await db.flush()
    return _serialize_account(account)


@router.get("/{account_id}")
async def get_account(
    account_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.tenant_id == user.tenant_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(404, "Account not found")
    return _serialize_account(account)


@router.put("/{account_id}")
async def update_account(
    account_id: UUID,
    body: AccountUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.tenant_id == user.tenant_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(404, "Account not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(account, k, v)
    return _serialize_account(account)


@router.delete("/{account_id}")
async def delete_account(
    account_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Account).where(Account.id == account_id, Account.tenant_id == user.tenant_id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(404, "Account not found")
    await db.delete(account)
    return {"deleted": True}


@router.get("/{account_id}/timeline")
async def account_timeline(
    account_id: UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ActivityLog)
        .where(ActivityLog.account_id == account_id)
        .order_by(ActivityLog.created_at.desc())
        .limit(50)
    )
    return [
        {
            "id": str(l.id),
            "action": l.action,
            "title": l.title,
            "details": l.details,
            "created_at": l.created_at.isoformat(),
        }
        for l in result.scalars().all()
    ]


@router.get("/{account_id}/comments")
async def list_comments(account_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(AccountComment).where(AccountComment.account_id == account_id).order_by(AccountComment.created_at.desc())
    )
    return [{"id": str(c.id), "body": c.body, "created_at": c.created_at.isoformat()} for c in result.scalars().all()]


@router.post("/{account_id}/comments")
async def add_comment(
    account_id: UUID,
    body: CommentCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = AccountComment(account_id=account_id, user_id=user.id, body=body.body)
    db.add(comment)
    await db.flush()
    return {"id": str(comment.id), "body": comment.body}


@router.get("/{account_id}/ticket-stats")
async def ticket_stats(account_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SupportTicket.status, func.count()).where(SupportTicket.account_id == account_id).group_by(SupportTicket.status)
    )
    return {row[0]: row[1] for row in result.all()}


@router.get("/ticket-stats")
async def all_ticket_stats(user: CurrentUser = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SupportTicket.status, func.count())
        .join(Account, Account.id == SupportTicket.account_id)
        .where(Account.tenant_id == user.tenant_id)
        .group_by(SupportTicket.status)
    )
    return {row[0]: row[1] for row in result.all()}
