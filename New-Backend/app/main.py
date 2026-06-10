"""Revenue Navigator API — greenfield backend per Document/tech-plan."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.mongo import ensure_mongo_indexes
from app.db.session import async_engine
from app.db.base import Base
from app.models import entities  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        await ensure_mongo_indexes()
    except Exception:
        pass
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix=settings.api_v1_prefix)

    @app.get("/health")
    async def root_health():
        return {"status": "ok"}

    @app.get("/ready")
    async def root_ready():
        from app.api.v1.endpoints.health import ready
        return await ready()

    return app


app = create_app()
