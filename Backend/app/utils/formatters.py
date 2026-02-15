"""
Data formatting utilities.
"""
from typing import Any, Dict, List
from datetime import datetime


def format_prediction_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Format prediction result for API response."""
    formatted = {}
    for key, value in result.items():
        if isinstance(value, float):
            formatted[key] = round(value, 4)
        else:
            formatted[key] = value
    return formatted


def format_datetime(dt: datetime) -> str:
    """Format datetime to ISO string."""
    return dt.isoformat() if dt else None
