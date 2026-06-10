from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr

from app.core.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/email", tags=["email"])


class SendEmailRequest(BaseModel):
    to: EmailStr
    subject: str
    body: str


@router.get("/status")
async def email_status():
    return {"provider": "resend", "configured": False}


@router.post("/send")
async def send_email(body: SendEmailRequest, user: CurrentUser = Depends(get_current_user)):
    return {"status": "queued", "to": body.to}


@router.post("/send-test")
async def send_test(body: SendEmailRequest):
    return {"status": "sent", "test": True}


@router.post("/send-to-account/{account_id}")
async def send_to_account(account_id: UUID, user: CurrentUser = Depends(get_current_user)):
    return {"status": "queued", "account_id": str(account_id)}


@router.post("/trigger-campaign")
async def trigger_campaign():
    return {"status": "queued"}


@router.post("/preview")
async def preview_email(payload: dict):
    return {"preview": payload.get("body", "")}


@router.post("/reanalyze/{account_id}")
async def reanalyze(account_id: UUID):
    return {"account_id": str(account_id), "status": "queued"}


@router.get("/sentiment/{account_id}")
async def email_sentiment(account_id: UUID):
    return {"account_id": str(account_id), "sentiment_score": 0.0}


@router.post("/inbound")
async def inbound_webhook(request: Request):
    payload = await request.json()
    return {"received": True, "id": payload.get("id")}
