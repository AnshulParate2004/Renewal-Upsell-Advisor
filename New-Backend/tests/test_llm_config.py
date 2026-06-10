"""Unit tests for JSON-driven LLM routing configuration."""
from __future__ import annotations

import os

import pytest

from app.services.llm.config import (
    DEFAULT_LLM_ROUTING,
    LLMRoutingConfig,
    LLMTaskConfig,
    ProviderEnv,
    resolve_task_config,
)
from app.services.llm.router import apply_provider_env


def test_resolve_task_config_uses_task_override():
    routing = LLMRoutingConfig(
        default=LLMTaskConfig(model="azure/gpt-4o", temperature=0.0),
        tasks={"sentiment": LLMTaskConfig(model="azure/gpt-4o-mini", temperature=0.1)},
    )
    resolved = resolve_task_config(routing, "sentiment")
    assert resolved.model == "azure/gpt-4o-mini"
    assert resolved.temperature == 0.1


def test_resolve_task_config_falls_back_to_default():
    routing = LLMRoutingConfig(
        default=LLMTaskConfig(model="azure/gpt-4o", temperature=0.5),
        tasks={},
    )
    resolved = resolve_task_config(routing, "voice_respond")
    assert resolved.model == "azure/gpt-4o"
    assert resolved.temperature == 0.5


def test_resolve_task_config_normalizes_legacy_alias():
    resolved = resolve_task_config(DEFAULT_LLM_ROUTING, "intent")
    assert resolved.task == "email_intent"


def test_apply_provider_env_sets_azure_from_env_names(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AZURE_OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("AZURE_OPENAI_ENDPOINT", "https://example.openai.azure.com")
    monkeypatch.setenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")
    apply_provider_env(
        ProviderEnv(
            api_key="AZURE_OPENAI_API_KEY",
            api_base="AZURE_OPENAI_ENDPOINT",
            api_version="AZURE_OPENAI_API_VERSION",
        ),
        "azure/gpt-4o",
    )
    assert os.environ.get("AZURE_API_KEY") == "test-key"
    assert os.environ.get("AZURE_API_BASE") == "https://example.openai.azure.com"


def test_default_llm_routing_has_core_tasks():
    assert "sentiment" in DEFAULT_LLM_ROUTING.tasks
    assert "voice_classify" in DEFAULT_LLM_ROUTING.tasks
    assert "email_intent" in DEFAULT_LLM_ROUTING.tasks
