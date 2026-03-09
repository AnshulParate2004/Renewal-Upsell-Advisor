"""
Logging configuration for the application.
"""
import logging
from app.core.config import settings


def setup_logging() -> None:
    """Configure application logging.

    - Disable application logs to console and files.
    - Let uvicorn manage its own console logging (routes, errors).
    """
    # Root logger: no handlers, minimal level so our app loggers stay quiet
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.ERROR)
    root_logger.handlers.clear()
    root_logger.addHandler(logging.NullHandler())

    # Let uvicorn / uvicorn.access use their default console handlers
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for a module."""
    return logging.getLogger(name)
