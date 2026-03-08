"""
Global error handling middleware.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse, Response
from app.core.exceptions import AppException, NotFoundError, ValidationError, ModelLoadError, PredictionError
from app.core.logging import get_logger

logger = get_logger(__name__)

# Safe TwiML for voice webhooks so Twilio never gets 500 (avoids "application error" message)
VOICE_ERROR_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice" language="en-US">We had a temporary issue. Please try again later. Goodbye.</Say></Response>'


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
    """Handle general exceptions. For voice webhooks return 200 + TwiML so Twilio does not play 'application error'."""
    logger.exception(f"Unhandled exception: {str(exc)}")
    path = getattr(request, "url", None) and getattr(request.url, "path", "") or ""
    if path and "/voice/" in path:
        logger.warning(f"Voice webhook error (returning 200 + TwiML): {path}")
        return Response(content=VOICE_ERROR_TWIML, media_type="application/xml", status_code=status.HTTP_200_OK)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal server error", "type": "Exception"}
    )
