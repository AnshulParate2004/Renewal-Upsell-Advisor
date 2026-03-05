"""
API v1 Router - Includes all endpoint routers.
"""
from fastapi import APIRouter
from app.api.v1.endpoints import (
  predictions,
  accounts,
  opportunities,
  analytics,
  contracts,
  webhooks,
  email,
  voice_calls,
  voicebot_frontend,
  voicebot_audio,
  ml_trigger,
  settings,
  workflows,
  campaigns,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["contracts"])
api_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
api_router.include_router(email.router, prefix="/email", tags=["email"])
api_router.include_router(voice_calls.router, prefix="/voice", tags=["voice"])
api_router.include_router(voicebot_frontend.router, prefix="/voicebot", tags=["voicebot"])
api_router.include_router(voicebot_audio.router, prefix="/voicebot", tags=["voicebot-audio"])
api_router.include_router(ml_trigger.router, prefix="/ml", tags=["ml"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(workflows.router, prefix="/workflows", tags=["workflows"])
api_router.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])