"""
FastAPI Application Entry Point.
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime
import re
from app.core.config import settings
from app.core.logging import setup_logging
from app.core.exceptions import (
    AppException, NotFoundError, ValidationError,
    ModelLoadError, PredictionError
)
from app.middleware.error_handler import (
    app_exception_handler,
    validation_exception_handler,
    not_found_exception_handler,
    model_error_handler,
    prediction_error_handler,
    general_exception_handler
)
from app.middleware.request_logging import RequestLoggingMiddleware
from app.api.v1.api import api_router
from app.services.ml.model_loader import model_loader
from app.db.base import Base
from app.db.session import engine

# Setup logging
setup_logging()

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    Base.metadata.create_all(bind=engine)
    
    # Exceptions: only campaign schedules + manual triggers run. No other schedulers (email, voice, ML).
    # - Renewal pipeline scheduler: runs campaigns when due per their plan (daily/weekly/monthly).
    # - Manual triggers: POST /email/trigger-campaign, /ml/trigger, /voice/trigger-calls, etc. still work.
    import asyncio
    import aiohttp

    async def keep_alive_ping():
        """Ping the health endpoint every 3 minutes to keep the Render instance awake."""
        url = "https://renewal-upsell-advisor.onrender.com/health"
        while True:
            try:
                await asyncio.sleep(180)  # 3 minutes
                async with aiohttp.ClientSession() as session:
                    async with session.get(url, timeout=10) as response:
                        print(f"✅ Keep-alive ping sent to {url}, status: {response.status}")
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"⚠️ Keep-alive ping failed: {e}")

    # Start the keep-alive task
    ping_task = asyncio.create_task(keep_alive_ping())

    try:
        from app.services.campaign_runner import run_campaign_scheduler
        asyncio.create_task(run_campaign_scheduler())
        print("✅ Renewal pipeline scheduler started (runs at scheduled time); manual triggers via API.")
    except Exception as e:
        print(f"Warning: Failed to start renewal pipeline scheduler: {e}")
    
    yield
    
    # Shutdown
    ping_task.cancel()

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FastAPI backend for Renewal & Upsell Advisor",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware with wildcard subdomain support (e.g., *.vercel.app)
CORS_EXACT = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://renewal-upsell-advisor.onrender.com",
    "https://renewal-upsell-advisor.vercel.app",
    "https://renewal-upsell-advisor.services.ailifebot.com",
    "https://renewal-upsell-advisor.greenforest-ccc56264.centralindia.azurecontainerapps.io",
]
CORS_PATTERNS = [
    re.compile(r"https://.*\.vercel\.app$"),
]

if settings.FRONTEND_URL:
    CORS_EXACT.append(settings.FRONTEND_URL)

def is_allowed_origin(origin: str) -> bool:
    if origin in CORS_EXACT:
        return True
    return any(p.match(origin) for p in CORS_PATTERNS)

class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        allowed = is_allowed_origin(origin)

        if request.method == "OPTIONS":
            resp = Response(status_code=204)
            if allowed:
                resp.headers["Access-Control-Allow-Origin"] = origin
                resp.headers["Access-Control-Allow-Credentials"] = "true"
                resp.headers["Access-Control-Allow-Methods"] = "*"
                resp.headers["Access-Control-Allow-Headers"] = "*"
            return resp

        response = await call_next(request)
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "*"
            response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app.add_middleware(DynamicCORSMiddleware)

# Request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(NotFoundError, not_found_exception_handler)
app.add_exception_handler(ModelLoadError, model_error_handler)
app.add_exception_handler(PredictionError, prediction_error_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Renewal & Upsell Advisor API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    models_info = model_loader.get_all_models_info()
    models_loaded = {k: v.get("loaded", False) for k, v in models_info.items()}
    
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "timestamp": datetime.now().isoformat(),
        "models_loaded": models_loaded
    }


if __name__ == "__main__":
    # Run with: uv run python app/main.py  (or uv run uvicorn app.main:app --host 0.0.0.0 --port 8000)
    # so ML deps (e.g. lightgbm) from pyproject.toml are available.
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
