"""
Custom exception classes for the application.
"""


class AppException(Exception):
    """Base exception for application errors."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(AppException):
    """Exception for resource not found."""
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(message, status_code=404)


class ValidationError(AppException):
    """Exception for validation errors."""
    def __init__(self, message: str):
        super().__init__(message, status_code=400)


class ModelLoadError(AppException):
    """Exception for ML model loading errors."""
    def __init__(self, model_name: str, reason: str = None):
        message = f"Failed to load model: {model_name}"
        if reason:
            message += f" - {reason}"
        super().__init__(message, status_code=500)


class PredictionError(AppException):
    """Exception for prediction errors."""
    def __init__(self, model_name: str, reason: str = None):
        message = f"Prediction failed for model: {model_name}"
        if reason:
            message += f" - {reason}"
        super().__init__(message, status_code=500)
