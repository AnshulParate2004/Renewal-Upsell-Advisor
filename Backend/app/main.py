"""
FastAPI Application Entry Point.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
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
    
    # Start email scheduler background task
    try:
        from app.services.email.scheduler import run_email_scheduler
        import asyncio
        # Start email scheduler as background task
        email_scheduler_task = asyncio.create_task(run_email_scheduler())
        print("✅ Email scheduler started (runs daily at 12:00 PM IST)")
    except Exception as e:
        print(f"Warning: Failed to start email scheduler: {e}")
    
    # Start voice call scheduler background task
    try:
        from app.services.voice_agent.scheduler import run_voice_call_scheduler
        import asyncio
        # Start voice call scheduler as background task
        voice_scheduler_task = asyncio.create_task(run_voice_call_scheduler())
        print("✅ Voice call scheduler started (runs daily at 2:00 PM IST)")
    except Exception as e:
        print(f"Warning: Failed to start voice call scheduler: {e}")

    # Start ML pipeline scheduler (runs daily at 12:00 AM IST)
    try:
        from app.services.ml.ml_scheduler import run_ml_pipeline_scheduler
        import asyncio
        ml_scheduler_task = asyncio.create_task(run_ml_pipeline_scheduler())
        print("✅ ML pipeline scheduler started (runs daily at 12:00 AM IST)")
    except Exception as e:
        print(f"Warning: Failed to start ML pipeline scheduler: {e}")
    
    yield
    
    # Shutdown (if needed)
    pass

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FastAPI backend for Renewal & Upsell Advisor",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
