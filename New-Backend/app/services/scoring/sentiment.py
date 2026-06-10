"""LiteLLM sentiment enrichment for scoring pipeline."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from app.core.logging import get_logger
from app.db.mongo import get_mongo_db
from app.services.llm.router import sentiment_analyze

logger = get_logger(__name__)


async def fetch_recent_comms(account_id: UUID, days: int = 7) -> str:
    db = get_mongo_db()
    since = datetime.utcnow() - timedelta(days=days)
    parts: list[str] = []
    async for doc in db.email_raw_bodies.find(
        {"account_id": str(account_id), "created_at": {"$gte": since}}
    ).limit(20):
        parts.append(str(doc.get("body", "")))
    async for doc in db.voice_transcripts.find(
        {"account_id": str(account_id), "created_at": {"$gte": since}}
    ).limit(10):
        parts.append(str(doc.get("text", "")))
    return "\n".join(p for p in parts if p.strip())


async def sentiment_enrich(
    account_id: UUID,
    *,
    tenant_id: UUID | None = None,
    db=None,
) -> dict[str, Any]:
    text = await fetch_recent_comms(account_id)
    if len(text.strip()) < 5:
        return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}
    try:
        return await sentiment_analyze(text, tenant_id=tenant_id, db=db)
    except Exception as exc:
        logger.warning("sentiment_enrich_failed", error=str(exc))
        return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}
