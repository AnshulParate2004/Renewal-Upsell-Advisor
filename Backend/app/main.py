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

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="FastAPI backend for Renewal & Upsell Advisor",
    docs_url="/docs",
    redoc_url="/redoc"
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


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Pre-load models (optional - can be lazy loaded)
    # Uncomment to pre-load all models on startup
    # try:
    #     model_loader.load_model("churn")
    #     model_loader.load_model("health_score")
    #     model_loader.load_model("relationship")
    #     model_loader.load_model("renewal")
    #     model_loader.load_model("sentiment")
    #     model_loader.load_model("upsell")
    # except Exception as e:
    #     print(f"Warning: Some models failed to load on startup: {e}")


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
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
