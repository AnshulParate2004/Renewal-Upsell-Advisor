# Revenue Navigator — New Backend (Greenfield)

Production backend implementing [`Document/tech-plan/`](../Document/tech-plan/) — **not** derived from `Backend/`.

## Stack

- FastAPI + Uvicorn
- PostgreSQL (SQLAlchemy + Alembic)
- MongoDB (Motor)
- Redis (cache, Celery broker)
- Celery + Beat
- LangGraph + **langchain-litellm** (`ChatLiteLLM` provider-agnostic router)
- Twilio / Resend (integration stubs)

## LangChain + LiteLLM configuration

All LLM calls use [`langchain-litellm`](https://github.com/langchain-ai/langchain-litellm) `ChatLiteLLM` via `app/services/llm/router.py`. **Per-task models** (sentiment, voice, email, WhatsApp, NBA, workflows) are configured in PostgreSQL `app_settings.config.llm_routing` JSON — see [`schemas/llm_config.example.json`](schemas/llm_config.example.json).

```python
from app.services.llm.router import ainvoke, sentiment_analyze

# Tenant-aware (loads llm_routing from DB)
await ainvoke(messages, task="voice_respond", tenant_id=tenant_id, db=db)
await sentiment_analyze(text, tenant_id=tenant_id, db=db)
```

**Settings API:** `GET/PATCH /api/v1/settings/llm-config` — returns env var **names** in `provider_env`, never secrets.

Copy `.env.example` to `.env` for credential env vars referenced by JSON:

| Service | Env vars |
|---------|----------|
| **Azure OpenAI** | `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_DEPLOYMENT` |
| **Anthropic** | `ANTHROPIC_API_KEY` |
| **OpenAI direct** | `OPENAI_API_KEY` |
| **Azure Speech** | `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION` |

`LITELLM_*` env vars are fallbacks when tenant JSON is absent. LLM traces go to MongoDB `llm_traces`.

### Phase 1 complete vs Phase 2 deferred

| Complete | Deferred |
|----------|----------|
| Formula scoring + LLM sentiment | Live Twilio/Resend sends |
| JSON llm_routing per tenant | Encrypted `integration_credentials` |
| LangGraph agents wired to LLM | Webhook signature verification |
| Settings APIs (scoring + LLM) | Alembic `versions/` migrations |
| Celery beat job registration | Materialized views, Redis `ratelimit:llm` |

## Quick start

```bash
cd New-Backend
docker compose up -d postgres redis mongo
pip install -e ".[dev]"
python scripts/seed_dev_data.py
uvicorn app.main:app --reload --port 8001
```

Login: `POST /api/v1/auth/login` with `admin@demo.local` / `admin123`

## Alignment audit

```bash
python scripts/tech_plan_audit.py
```

Produces `alignment_report.json` with structural + behavioral checks (target ≥ 95%).

## API

All routes under `/api/v1` — accounts, lifecycle, pipeline, scoring, workflows, campaigns, email, voice, WhatsApp, settings, webhooks, voicebot.

## Workers

```bash
celery -A app.workers.celery_app worker -l info -Q scoring,workflows,campaigns,email,voice
celery -A app.workers.celery_app beat -l info
```

## Frontend

Point `revenue-navigator` to `VITE_API_URL=http://localhost:8001/api/v1`
