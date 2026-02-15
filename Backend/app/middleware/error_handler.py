"""
Global error handling middleware.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from app.core.exceptions import AppException, NotFoundError, ValidationError, ModelLoadError, PredictionError
from app.core.logging import get_logger

logger = get_logger(__name__)


async def app_exception_handler(request: Request, exc: AppException):
    """Handle application exceptions."""
    logger.error(f"Application error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.message, "type": exc.__class__.__name__}
    )


async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle validation errors."""
    logger.warning(f"Validation error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"error": exc.message, "type": "ValidationError"}
    )


async def not_found_exception_handler(request: Request, exc: NotFoundError):
    """Handle not found errors."""
    logger.warning(f"Not found: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"error": exc.message, "type": "NotFoundError"}
    )


async def model_error_handler(request: Request, exc: ModelLoadError):
    """Handle model loading errors."""
    logger.error(f"Model error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": exc.message, "type": "ModelLoadError"}
    )


async def prediction_error_handler(request: Request, exc: PredictionError):
    """Handle prediction errors."""
    logger.error(f"Prediction error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": exc.message, "type": "PredictionError"}
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.exception(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "type": "Exception"}
    )
