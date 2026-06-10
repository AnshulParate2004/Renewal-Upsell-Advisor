"""LangChain + LiteLLM router — tenant-aware JSON config per tech plan."""
from __future__ import annotations

import json
import os
import time
from datetime import datetime
from functools import lru_cache
from typing import Any
from uuid import UUID

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_litellm import ChatLiteLLM
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.mongo import get_mongo_db
from app.services.llm.config import (
    DEFAULT_LLM_ROUTING,
    LLMRoutingConfig,
    ProviderEnv,
    ResolvedLLMTask,
    load_llm_routing,
    normalize_task,
    resolve_task_config,
)

logger = get_logger(__name__)


def configure_litellm_env() -> None:
    """Set LiteLLM / Azure / OpenAI env vars from application settings."""
    settings = get_settings()

    if settings.azure_openai_api_key:
        os.environ.setdefault("AZURE_API_KEY", settings.azure_openai_api_key)
    if settings.azure_openai_endpoint:
        os.environ.setdefault("AZURE_API_BASE", settings.azure_openai_endpoint)
    if settings.azure_openai_api_version:
        os.environ.setdefault("AZURE_API_VERSION", settings.azure_openai_api_version)
    if settings.openai_api_key:
        os.environ.setdefault("OPENAI_API_KEY", settings.openai_api_key)
    if getattr(settings, "anthropic_api_key", None):
        os.environ.setdefault("ANTHROPIC_API_KEY", settings.anthropic_api_key)
    if settings.azure_speech_key:
        os.environ.setdefault("AZURE_SPEECH_KEY", settings.azure_speech_key)
    if settings.azure_speech_region:
        os.environ.setdefault("AZURE_SPEECH_REGION", settings.azure_speech_region)


def apply_provider_env(provider_env: ProviderEnv | None, model: str) -> None:
    """Apply provider credentials from env var names defined in JSON config."""
    configure_litellm_env()
    if not provider_env:
        return

    if provider_env.api_key:
        secret = os.environ.get(provider_env.api_key)
        if secret:
            if model.startswith("azure/"):
                os.environ["AZURE_API_KEY"] = secret
            elif model.startswith("anthropic/"):
                os.environ["ANTHROPIC_API_KEY"] = secret
            else:
                os.environ["OPENAI_API_KEY"] = secret

    if provider_env.api_base:
        base = os.environ.get(provider_env.api_base)
        if base:
            os.environ["AZURE_API_BASE"] = base

    if provider_env.api_version:
        version = os.environ.get(provider_env.api_version)
        if version:
            os.environ["AZURE_API_VERSION"] = version


def _provider_env_key(provider_env: ProviderEnv | None) -> str:
    if not provider_env:
        return ""
    return json.dumps(provider_env.model_dump(exclude_none=True), sort_keys=True)


async def get_resolved_task(
    task: str,
    *,
    tenant_id: UUID | None = None,
    db: AsyncSession | None = None,
    routing: LLMRoutingConfig | None = None,
) -> ResolvedLLMTask:
    """Resolve model/temperature/provider for a task from JSON config or defaults."""
    normalized = normalize_task(task)
    if routing is None:
        if db is not None and tenant_id is not None:
            routing = await load_llm_routing(db, tenant_id)
        else:
            routing = DEFAULT_LLM_ROUTING
    return resolve_task_config(routing, normalized)


def resolve_model(
    task: str = "default",
    *,
    routing: LLMRoutingConfig | None = None,
) -> str:
    """Sync helper — returns model string without DB lookup."""
    cfg = routing or DEFAULT_LLM_ROUTING
    return resolve_task_config(cfg, task).model


@lru_cache(maxsize=32)
def _cached_chat_model(model: str, temperature: float, provider_env_key: str) -> ChatLiteLLM:
    provider_env = ProviderEnv.model_validate(json.loads(provider_env_key)) if provider_env_key else None
    apply_provider_env(provider_env, model)
    return ChatLiteLLM(model=model, temperature=temperature)


def get_chat_llm(
    *,
    task: str = "default",
    temperature: float | None = None,
    resolved: ResolvedLLMTask | None = None,
) -> ChatLiteLLM:
    """Build a langchain-litellm ChatLiteLLM instance for the given task."""
    if resolved is None:
        resolved = resolve_task_config(DEFAULT_LLM_ROUTING, task)
    temp = temperature if temperature is not None else resolved.temperature
    env_key = _provider_env_key(resolved.provider_env)
    return _cached_chat_model(resolved.model, temp, env_key)


async def _log_trace(
    *,
    task: str,
    model: str,
    prompt: str,
    response: str,
    tenant_id: UUID | None = None,
    latency_ms: float | None = None,
    tokens: dict | None = None,
) -> None:
    try:
        db = get_mongo_db()
        await db.llm_traces.insert_one(
            {
                "task": task,
                "model": model,
                "provider": "langchain-litellm",
                "tenant_id": str(tenant_id) if tenant_id else None,
                "prompt_preview": prompt[:2000],
                "response_preview": response[:2000],
                "latency_ms": latency_ms,
                "tokens": tokens,
                "created_at": datetime.utcnow(),
            }
        )
    except Exception as exc:
        logger.warning("llm_trace_log_failed", error=str(exc))


def _extract_token_usage(response: Any) -> dict | None:
    meta = getattr(response, "response_metadata", None) or {}
    usage = meta.get("token_usage") or meta.get("usage")
    if not usage:
        return None
    return {
        "prompt_tokens": usage.get("prompt_tokens"),
        "completion_tokens": usage.get("completion_tokens"),
    }


async def ainvoke(
    messages: list[dict[str, str]],
    *,
    task: str = "default",
    temperature: float | None = None,
    tenant_id: UUID | None = None,
    db: AsyncSession | None = None,
    routing: LLMRoutingConfig | None = None,
    json_mode: bool = False,
) -> str:
    """Async LangChain invoke via ChatLiteLLM with Mongo trace logging."""
    resolved = await get_resolved_task(task, tenant_id=tenant_id, db=db, routing=routing)
    llm = get_chat_llm(task=task, temperature=temperature, resolved=resolved)

    if json_mode:
        llm = llm.bind(response_format={"type": "json_object"})

    lc_messages = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))

    started = time.perf_counter()
    response = await llm.ainvoke(lc_messages)
    latency_ms = (time.perf_counter() - started) * 1000

    content = response.content if isinstance(response.content, str) else str(response.content)
    await _log_trace(
        task=resolved.task,
        model=resolved.model,
        prompt=messages[-1].get("content", "") if messages else "",
        response=content,
        tenant_id=tenant_id,
        latency_ms=latency_ms,
        tokens=_extract_token_usage(response),
    )
    return content


async def acompletion(
    messages: list[dict[str, str]],
    *,
    task: str = "default",
    temperature: float | None = None,
    tenant_id: UUID | None = None,
    db: AsyncSession | None = None,
    response_format: dict | None = None,
) -> str:
    return await ainvoke(
        messages,
        task=task,
        temperature=temperature,
        tenant_id=tenant_id,
        db=db,
        json_mode=bool(response_format and response_format.get("type") == "json_object"),
    )


async def sentiment_analyze(
    text: str,
    tenant_id: UUID | None = None,
    db: AsyncSession | None = None,
) -> dict[str, Any]:
    """Sentiment via langchain-litellm ChatLiteLLM."""
    prompt = (
        "Analyze customer communication sentiment. Return JSON only with keys: "
        "sentiment_score (number -1 to 1), label (positive|neutral|negative|very_negative), "
        "keywords (array of strings).\n\n"
        f"Text:\n{text[:8000]}"
    )
    raw = await ainvoke(
        [{"role": "user", "content": prompt}],
        task="sentiment",
        temperature=0,
        tenant_id=tenant_id,
        db=db,
        json_mode=True,
    )
    if "```" in raw:
        raw = raw.split("```")[1].replace("json", "").strip()
    result = json.loads(raw)
    return {
        "sentiment_score": float(result.get("sentiment_score", 0.0)),
        "sentiment_category": result.get("label", "neutral"),
        "keywords": result.get("keywords", []),
    }
