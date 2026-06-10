from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.models.entities import Account
from app.services.scoring.pipeline import score_account
from app.workers.tasks import scoring_daily

router = APIRouter(prefix="/ml", tags=["ml"])


class TriggerRequest(BaseModel):
    account_id: UUID | None = None


@router.post("/trigger")
async def trigger_scoring(
    body: TriggerRequest | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body and body.account_id:
        scores = await score_account(db, body.account_id, user.tenant_id)
        return {"status": "completed", "account_id": str(body.account_id), "scores": scores}
    task = scoring_daily.delay()
    return {"status": "queued", "task_id": task.id}
