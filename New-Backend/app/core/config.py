"""Application settings from environment."""
from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Revenue Navigator API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://rnu:rnu_dev@localhost:5433/revenue_navigator"
    database_url_sync: str = "postgresql+psycopg2://rnu:rnu_dev@localhost:5433/revenue_navigator"
    mongodb_url: str = "mongodb://localhost:27018/revenue_navigator"
    redis_url: str = "redis://localhost:6380/0"
    celery_broker_url: str = "redis://localhost:6380/1"
    celery_result_backend: str = "redis://localhost:6380/2"

    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    scoring_mode: Literal["formula", "ml"] = "formula"

    # LiteLLM — provider-agnostic model routing (OpenAI, Azure OpenAI, Anthropic, etc.)
    # Azure example: LITELLM_MODEL=azure/gpt-4o
    litellm_model: str = "gpt-4o-mini"
    litellm_sentiment_model: str | None = None
    litellm_intent_model: str | None = None
    litellm_personalization_model: str | None = None
    litellm_summary_model: str | None = None

    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    azure_openai_api_key: str | None = None
    azure_openai_endpoint: str | None = None
    azure_openai_api_version: str = Field(
        default="2024-12-01-preview",
        validation_alias=AliasChoices("AZURE_OPENAI_API_VERSION", "OPENAI_API_VERSION"),
    )
    azure_openai_deployment: str = "gpt-4o"

    azure_speech_key: str | None = None
    azure_speech_region: str = "centralindia"

    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @model_validator(mode="after")
    def default_litellm_azure_model(self) -> "Settings":
        """If Azure deployment is set, default LiteLLM model to azure/{deployment}."""
        if (
            self.azure_openai_deployment
            and self.azure_openai_api_key
            and self.litellm_model == "gpt-4o-mini"
        ):
            self.litellm_model = f"azure/{self.azure_openai_deployment}"
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
