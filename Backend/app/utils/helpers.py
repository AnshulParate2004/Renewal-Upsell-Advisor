"""
General helper functions.
"""
from typing import Any, Dict
from datetime import datetime


def format_currency(amount: float) -> str:
    """Format amount as currency."""
    return f"${amount:,.2f}"


def format_percentage(value: float, decimals: int = 2) -> str:
    """Format value as percentage."""
    return f"{value * 100:.{decimals}f}%"


def safe_get(data: Dict[str, Any], key: str, default: Any = None) -> Any:
    """Safely get value from dictionary."""
    return data.get(key, default)


def generate_id(prefix: str = "") -> str:
    """Generate a unique ID."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
    return f"{prefix}{timestamp}" if prefix else timestamp
