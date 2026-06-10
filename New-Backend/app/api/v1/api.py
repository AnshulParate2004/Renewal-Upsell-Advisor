from fastapi import APIRouter

from app.api.v1.endpoints import (
    accounts,
    analytics,
    auth,
    campaigns,
    email,
    health,
    lifecycle,
    ml,
    opportunities,
    pipeline,
    predictions,
    settings,
    voice,
    voicebot,
    webhooks,
    whatsapp,
    workflows,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(accounts.router)
api_router.include_router(lifecycle.router)
api_router.include_router(pipeline.router)
api_router.include_router(analytics.router)
api_router.include_router(opportunities.router)
api_router.include_router(campaigns.router)
api_router.include_router(email.router)
api_router.include_router(voice.router)
api_router.include_router(whatsapp.router)
api_router.include_router(ml.router)
api_router.include_router(predictions.router)
api_router.include_router(settings.router)
api_router.include_router(workflows.router)
api_router.include_router(voicebot.router)
api_router.include_router(webhooks.router)
