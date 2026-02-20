"""
Application configuration using Pydantic Settings.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Settings
    APP_NAME: str = "Renewal & Upsell Advisor API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    
    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: list[str] = ["http://localhost:8080", "http://localhost:3000"]
    
    # Database
    DATABASE_URL: Optional[str] = None  # PostgreSQL connection string (takes priority)
    SUPABASE_URL: Optional[str] = None  # Supabase project URL
    SUPABASE_KEY: Optional[str] = None  # Supabase anon key
    SUPABASE_DB_PASSWORD: Optional[str] = None  # Supabase database password (for PostgreSQL connection)
    
    # ML Models Path
    ML_MODELS_PATH: Path = Path(__file__).parent.parent.parent / "ml_models"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Integrations
    STRIPE_SECRET_KEY: Optional[str] = None
    SALESFORCE_CLIENT_ID: Optional[str] = None
    SALESFORCE_CLIENT_SECRET: Optional[str] = None
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None  # Twilio phone number for outbound calls
    WEBHOOK_BASE_URL: Optional[str] = None  # Base URL for Twilio webhooks (must be publicly accessible)
    
    # Email Configuration
    SMTP_HOST: Optional[str] = None  # e.g., smtp.gmail.com
    SMTP_PORT: Optional[int] = None  # e.g., 587
    SMTP_USERNAME: Optional[str] = None  # Email username
    SMTP_PASSWORD: Optional[str] = None  # Email password or app password
    FROM_EMAIL: Optional[str] = None  # From email address
    FROM_NAME: Optional[str] = None  # From name
    SENDGRID_API_KEY: Optional[str] = None  # SendGrid API key (alternative to SMTP)
    EMAIL_SCHEDULE_INTERVAL_DAYS: int = 7  # Days between email sends
    
    # Azure Configurations
    AZURE_SPEECH_KEY: Optional[str] = None
    AZURE_SPEECH_REGION: Optional[str] = None
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    OPENAI_API_VERSION: str = "2024-12-01-preview"
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )
    
    @property
    def ml_models_path(self) -> Path:
        """Get ML models directory path."""
        return self.ML_MODELS_PATH if isinstance(self.ML_MODELS_PATH, Path) else Path(self.ML_MODELS_PATH)


# Global settings instance
settings = Settings()
