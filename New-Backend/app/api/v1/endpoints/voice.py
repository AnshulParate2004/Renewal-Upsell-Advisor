from uuid import UUID

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.core.deps import CurrentUser, get_current_user

router = APIRouter(prefix="/voice", tags=["voice"])


class TriggerCallRequest(BaseModel):
    account_ids: list[UUID] = []


@router.get("/calls")
async def list_calls(user: CurrentUser = Depends(get_current_user)):
    return []


@router.get("/calls/{call_id}")
async def get_call(call_id: UUID):
    return {"id": str(call_id), "status": "completed"}


@router.post("/trigger-calls")
async def trigger_calls(body: TriggerCallRequest, user: CurrentUser = Depends(get_current_user)):
    return {"queued": len(body.account_ids)}


@router.post("/trigger-call-to-account/{account_id}")
async def trigger_call_to_account(account_id: UUID, user: CurrentUser = Depends(get_current_user)):
    return {"account_id": str(account_id), "status": "queued"}


@router.post("/handle-call")
async def handle_call(request: Request):
    form = await request.form()
    return {"twiml": "<Response></Response>", "call_sid": form.get("CallSid")}


@router.post("/handle-input")
async def handle_input(request: Request):
    form = await request.form()
    return {"twiml": "<Response></Response>", "speech": form.get("SpeechResult")}


@router.post("/call-status")
async def call_status(request: Request):
    form = await request.form()
    return {"status": form.get("CallStatus")}
