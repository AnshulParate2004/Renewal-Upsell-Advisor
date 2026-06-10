from fastapi import APIRouter
from sqlalchemy import text

from app.db.mongo import get_mongo_client
from app.db.redis_client import get_redis
from app.db.session import async_engine

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.get("/ready")
async def ready():
    checks = {}
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = str(exc)
    try:
        await get_redis().ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = str(exc)
    try:
        await get_mongo_client().admin.command("ping")
        checks["mongo"] = "ok"
    except Exception as exc:
        checks["mongo"] = str(exc)
    ok = all(v == "ok" for v in checks.values())
    return {"ready": ok, "checks": checks}
