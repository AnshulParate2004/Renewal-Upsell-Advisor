"""
External webhooks API endpoints.
"""
from fastapi import APIRouter, Request, HTTPException
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks."""
    # TODO: Implement Stripe webhook handling
    body = await request.body()
    logger.info(f"Received Stripe webhook: {len(body)} bytes")
    return {"status": "received"}


@router.post("/salesforce")
async def salesforce_webhook(request: Request):
    """Handle Salesforce webhooks."""
    # TODO: Implement Salesforce webhook handling
    body = await request.json()
    logger.info(f"Received Salesforce webhook: {body}")
    return {"status": "received"}
