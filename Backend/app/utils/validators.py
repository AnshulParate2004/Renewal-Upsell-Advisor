"""
Data validation utilities.
"""
from typing import Any
from pydantic import ValidationError


def validate_email(email: str) -> bool:
    """Validate email format."""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number format."""
    import re
    # Basic phone validation (allows various formats)
    pattern = r'^[\d\s\-\+\(\)]+$'
    return bool(re.match(pattern, phone)) and len(phone.replace(" ", "").replace("-", "").replace("(", "").replace(")", "").replace("+", "")) >= 10


def validate_score(score: float, min_val: float = 0.0, max_val: float = 1.0) -> bool:
    """Validate score is within range."""
    return min_val <= score <= max_val
