"""Redis client for cache, locks, and rate limits."""
import redis.asyncio as aioredis

from app.core.config import get_settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(get_settings().redis_url, decode_responses=True)
    return _redis


async def cache_delete_pattern(pattern: str) -> int:
    r = get_redis()
    keys = [k async for k in r.scan_iter(match=pattern)]
    if keys:
        return await r.delete(*keys)
    return 0
