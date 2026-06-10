from fastapi import APIRouter, Request

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/twilio")
async def twilio_webhook(request: Request):
    form = await request.form()
    return {"received": True, "provider": "twilio", "sid": form.get("MessageSid") or form.get("CallSid")}


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    return {"received": True, "provider": "stripe", "bytes": len(payload)}


@router.post("/salesforce")
async def salesforce_webhook(request: Request):
    payload = await request.json()
    return {"received": True, "provider": "salesforce", "keys": list(payload.keys())[:5]}


@router.post("/email")
async def email_webhook(request: Request):
    payload = await request.json()
    return {"received": True, "provider": "email"}
