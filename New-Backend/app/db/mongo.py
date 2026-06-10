"""MongoDB client and collection helpers."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(get_settings().mongodb_url)
    return _client


def get_mongo_db() -> AsyncIOMotorDatabase:
    return get_mongo_client().get_default_database()


COLLECTIONS = {
    "email_raw_bodies": 365 * 24 * 3600,
    "voice_transcripts": None,
    "llm_traces": 90 * 24 * 3600,
    "langgraph_checkpoints": 30 * 24 * 3600,
    "webhook_payloads": 180 * 24 * 3600,
    "voicebot_sessions": 7 * 24 * 3600,
}


async def ensure_mongo_indexes() -> None:
    db = get_mongo_db()
    for name, ttl_seconds in COLLECTIONS.items():
        col = db[name]
        if ttl_seconds:
            await col.create_index("created_at", expireAfterSeconds=ttl_seconds)
