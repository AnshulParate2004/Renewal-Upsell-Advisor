from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.core.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


class WhatsAppSend(BaseModel):
    phone_number: str
    message: str


@router.get("/conversations")
async def conversations(user: CurrentUser = Depends(get_current_user)):
    return []


@router.post("/generate-preview")
async def generate_preview(payload: dict):
    return {"preview": payload.get("message", "")}


@router.post("/send-to-account/{account_id}")
async def send_to_account(account_id: UUID, body: WhatsAppSend, user: CurrentUser = Depends(get_current_user)):
    return {"account_id": str(account_id), "status": "queued"}


@router.post("/trigger-all")
async def trigger_all(user: CurrentUser = Depends(get_current_user)):
    return {"status": "queued"}


@router.post("/webhook")
async def whatsapp_webhook(request: Request):
    form = await request.form()
    return {"received": True, "from": form.get("From")}
