"""Tenant-scoped LLM routing configuration from app_settings JSON."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.redis_client import get_redis
from app.services.scoring.config import load_app_config

DEFAULT_LLM_PATH = Path(__file__).resolve().parents[3] / "schemas" / "llm_config.example.json"
TECH_PLAN_LLM_PATH = (
    Path(__file__).resolve().parents[4]
    / "Document"
    / "tech-plan"
    / "schemas"
    / "llm_config.example.json"
)

LLM_TASK_KEYS = frozenset(
    {
        "sentiment",
        "email_intent",
        "email_personalization",
        "voice_classify",
        "voice_respond",
        "voice_summary",
        "whatsapp_message",
        "workflow_content",
        "nba_recommendation",
    }
)

# Legacy task aliases used in older call sites
TASK_ALIASES: dict[str, str] = {
    "intent": "email_intent",
    "personalization": "email_personalization",
    "summary": "voice_summary",
    "default": "sentiment",
}


class ProviderEnv(BaseModel):
    """Env var names (not secret values) for LiteLLM provider credentials."""

    api_key: str | None = None
    api_base: str | None = None
    api_version: str | None = None


class LLMTaskConfig(BaseModel):
    model: str | None = None
    temperature: float | None = None
    provider_env: ProviderEnv | None = None


class LLMRoutingConfig(BaseModel):
    default: LLMTaskConfig = Field(default_factory=LLMTaskConfig)
    tasks: dict[str, LLMTaskConfig] = Field(default_factory=dict)


class ResolvedLLMTask(BaseModel):
    task: str
    model: str
    temperature: float
    provider_env: ProviderEnv | None = None


def _load_default_llm_json() -> dict[str, Any]:
    for path in (TECH_PLAN_LLM_PATH, DEFAULT_LLM_PATH):
        if path.exists():
            raw = json.loads(path.read_text(encoding="utf-8"))
            raw.pop("_comment", None)
            return raw
    return LLMRoutingConfig().model_dump()


DEFAULT_LLM_ROUTING = LLMRoutingConfig.model_validate(_load_default_llm_json())


def normalize_task(task: str) -> str:
    return TASK_ALIASES.get(task, task)


def _env_fallback_model(task: str) -> str | None:
    settings = get_settings()
    normalized = normalize_task(task)
    overrides = {
        "sentiment": settings.litellm_sentiment_model,
        "email_intent": settings.litellm_intent_model,
        "email_personalization": settings.litellm_personalization_model,
        "voice_summary": settings.litellm_summary_model,
        "voice_classify": settings.litellm_intent_model,
        "voice_respond": settings.litellm_model,
        "whatsapp_message": settings.litellm_personalization_model,
        "workflow_content": settings.litellm_personalization_model,
        "nba_recommendation": settings.litellm_model,
    }
    return overrides.get(normalized) or settings.litellm_model


def _merge_task_config(base: LLMTaskConfig, override: LLMTaskConfig | None) -> LLMTaskConfig:
    if override is None:
        return base
    merged = base.model_dump()
    for key, value in override.model_dump(exclude_none=True).items():
        if key == "provider_env" and value:
            existing = merged.get("provider_env") or {}
            existing.update(value)
            merged["provider_env"] = existing
        else:
            merged[key] = value
    return LLMTaskConfig.model_validate(merged)


def resolve_task_config(routing: LLMRoutingConfig, task: str) -> ResolvedLLMTask:
    """Merge task-specific config with default and env fallbacks."""
    normalized = normalize_task(task)
    task_cfg = routing.tasks.get(normalized)
    merged = _merge_task_config(routing.default, task_cfg)

    model = merged.model or _env_fallback_model(normalized) or get_settings().litellm_model
    temperature = merged.temperature if merged.temperature is not None else 0.0

    return ResolvedLLMTask(
        task=normalized,
        model=model,
        temperature=temperature,
        provider_env=merged.provider_env,
    )


async def load_llm_routing(db: AsyncSession, tenant_id) -> LLMRoutingConfig:
    """Load tenant LLM routing from app_settings with Redis cache."""
    cache_key = f"llm_routing:{tenant_id}"
    try:
        redis = get_redis()
        cached = await redis.get(cache_key)
        if cached:
            return LLMRoutingConfig.model_validate(json.loads(cached))
    except Exception:
        pass

    cfg = await load_app_config(db, tenant_id)
    raw = cfg.get("llm_routing")
    routing = LLMRoutingConfig.model_validate(raw) if raw else DEFAULT_LLM_ROUTING

    try:
        redis = get_redis()
        await redis.setex(cache_key, 60, routing.model_dump_json())
    except Exception:
        pass

    return routing


async def invalidate_llm_routing_cache(tenant_id) -> None:
    try:
        redis = get_redis()
        await redis.delete(f"llm_routing:{tenant_id}")
    except Exception:
        pass
