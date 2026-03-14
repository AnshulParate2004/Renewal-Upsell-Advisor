"""
Settings API endpoints for app-wide scheduling and metric defaults,
plus setup-page credentials (SendGrid / Twilio).

Two separate storage areas:
  1. `app_settings`  (key/config jsonb) – schedule, metrics, notifications, pipeline_flow
  2. `setup_config`  (flat columns, append-only) – credentials (SendGrid, Twilio) + automation_paused
     Every POST to /settings/setup inserts a NEW row; history is always preserved.
     The latest row (ORDER BY created_at DESC LIMIT 1) is the active config.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.services.email.scheduler import get_supabase_client


logger = get_logger(__name__)
router = APIRouter()

SETTINGS_TABLE_NAME = "app_settings"
SETTINGS_ROW_KEY = "default"
SETUP_TABLE_NAME = "setup_config"


# ---------------------------------------------------------------------------
# Pydantic models – schedule / metrics (unchanged)
# ---------------------------------------------------------------------------

class ScheduleConfig(BaseModel):
    callWindowStart: str = Field("09:00")
    callWindowEnd: str = Field("17:00")
    emailWindowStart: str = Field("08:00")
    emailWindowEnd: str = Field("18:00")
    followUpDays: int = Field(3, ge=1, le=60)
    autoEmailScheduleTime: str = Field("12:00")
    autoCallScheduleTime: str = Field("14:00")
    reminderDaysBeforeRenewal: int = Field(1, ge=0, le=365)


class MetricsConfig(BaseModel):
    churnRiskThreshold: int = Field(30, ge=0, le=100)
    renewalTarget: int = Field(90, ge=0, le=100)
    upsellPipelineTarget: int = Field(100_000, ge=0)
    renewalReminderAtCompletionPercent: int = Field(90, ge=0, le=100)
    highRiskScoreThresholdPercent: int = Field(70, ge=0, le=100)
    churnProbabilityThresholdPercent: int = Field(70, ge=0, le=100)
    minUsagePercentForCall: int = Field(20, ge=0, le=100)
    healthScoreAtRiskBelowPercent: int = Field(50, ge=0, le=100)
    churnDiscountPercentage: int = Field(20, ge=0, le=100)


class NotificationsConfig(BaseModel):
    highRisk: bool = Field(True)
    renewals: bool = Field(True)
    daily: bool = Field(False)
    failedCalls: bool = Field(True)
    churnDiscount: bool = Field(False)


class PipelineFlowConfig(BaseModel):
    q1: str = Field("email")
    q2: str = Field("email")
    q3: str = Field("email")
    q4: str = Field("both")
    renewed: str = Field("none")


class AppSettings(BaseModel):
    """Root settings object – schedule / metrics / notifications only (no credentials here)."""
    schedule: ScheduleConfig = ScheduleConfig()
    metrics: MetricsConfig = MetricsConfig()
    notifications: NotificationsConfig = Field(default_factory=NotificationsConfig)
    pipeline_flow: Optional[PipelineFlowConfig] = Field(default_factory=PipelineFlowConfig)
    automation_paused: bool = Field(False)


DEFAULT_SETTINGS = AppSettings()


# ---------------------------------------------------------------------------
# Pydantic model – setup / credentials (new, flat)
# ---------------------------------------------------------------------------

class SetupConfig(BaseModel):
    """
    Credentials stored in the flat-column `setup_config` table.
    Each save inserts a new row; history is preserved.
    """
    sendgrid_api_key: Optional[str] = Field(None, description="SendGrid API Key (starts with SG.)")
    from_email: Optional[str] = Field(None, description="From email address")
    from_name: str = Field("Renewal & Upsell Advisor", description="From name")
    twilio_account_sid: Optional[str] = Field(None, description="Twilio Account SID")
    twilio_auth_token: Optional[str] = Field(None, description="Twilio Auth Token")
    twilio_phone_number: Optional[str] = Field(None, description="Twilio voice number (E.164)")
    twilio_whatsapp_number: Optional[str] = Field(None, description="Twilio WhatsApp number (E.164)")
    automation_paused: bool = Field(False)
    created_at: Optional[str] = Field(None, description="Row timestamp (read-only)")


DEFAULT_SETUP = SetupConfig()


# ---------------------------------------------------------------------------
# Helpers – app_settings (schedule / metrics)
# ---------------------------------------------------------------------------

def _load_settings_from_db() -> AppSettings:
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase not configured; returning default settings.")
        return DEFAULT_SETTINGS
    try:
        result = (
            client.table(SETTINGS_TABLE_NAME)
            .select("config")
            .eq("key", SETTINGS_ROW_KEY)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error(f"Failed to load app settings: {e}")
        return DEFAULT_SETTINGS

    rows = result.data or []
    if not rows:
        try:
            client.table(SETTINGS_TABLE_NAME).insert(
                {"key": SETTINGS_ROW_KEY, "config": DEFAULT_SETTINGS.model_dump()}
            ).execute()
        except Exception as e:
            logger.error(f"Failed to initialise default settings row: {e}")
        return DEFAULT_SETTINGS

    raw_config: Dict[str, Any] = rows[0].get("config") or {}
    # Strip credential fields that now live in setup_config
    raw_config.pop("email", None)
    raw_config.pop("twilio", None)
    raw_config.pop("credential_history", None)
    try:
        return AppSettings(**raw_config)
    except Exception as e:
        logger.error(f"Invalid config shape; using defaults. Error: {e}")
        return DEFAULT_SETTINGS


def _save_settings_to_db(settings_obj: AppSettings) -> None:
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    config_dict = settings_obj.model_dump()
    try:
        update_result = (
            client.table(SETTINGS_TABLE_NAME)
            .update({"config": config_dict})
            .eq("key", SETTINGS_ROW_KEY)
            .execute()
        )
        if not (update_result.data or []):
            client.table(SETTINGS_TABLE_NAME).insert(
                {"key": SETTINGS_ROW_KEY, "config": config_dict}
            ).execute()
    except Exception as e:
        logger.error(f"Failed to save app settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to save settings.")


# ---------------------------------------------------------------------------
# Helpers – setup_config (credentials)
# ---------------------------------------------------------------------------

def _load_setup_config_from_db() -> SetupConfig:
    """Return the latest row from setup_config, or defaults if none exists."""
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase not configured; returning default setup config.")
        return DEFAULT_SETUP
    try:
        result = (
            client.table(SETUP_TABLE_NAME)
            .select(
                "id,sendgrid_api_key,from_email,from_name,"
                "twilio_account_sid,twilio_auth_token,"
                "twilio_phone_number,twilio_whatsapp_number,"
                "automation_paused,created_at"
            )
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = result.data or []
        if not rows:
            return DEFAULT_SETUP
        row = rows[0]
        return SetupConfig.model_validate({
            "sendgrid_api_key": row.get("sendgrid_api_key"),
            "from_email": row.get("from_email"),
            "from_name": row.get("from_name") or "Renewal & Upsell Advisor",
            "twilio_account_sid": row.get("twilio_account_sid"),
            "twilio_auth_token": row.get("twilio_auth_token"),
            "twilio_phone_number": row.get("twilio_phone_number"),
            "twilio_whatsapp_number": row.get("twilio_whatsapp_number"),
            "automation_paused": bool(row.get("automation_paused", False)),
            "created_at": str(row.get("created_at") or ""),
        })
    except Exception as e:
        logger.error(f"Failed to load setup config: {e}")
        return DEFAULT_SETUP


def _insert_setup_config_to_db(cfg: SetupConfig) -> None:
    """Insert a new row into setup_config (never updates existing rows)."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured.")

    payload: Dict[str, Any] = {
        "from_name": cfg.from_name or "Renewal & Upsell Advisor",
        "automation_paused": cfg.automation_paused,
    }
    # Only include non-empty credential fields
    if cfg.sendgrid_api_key:
        payload["sendgrid_api_key"] = cfg.sendgrid_api_key
    if cfg.from_email:
        payload["from_email"] = cfg.from_email
    if cfg.twilio_account_sid:
        payload["twilio_account_sid"] = cfg.twilio_account_sid
    if cfg.twilio_auth_token:
        payload["twilio_auth_token"] = cfg.twilio_auth_token
    if cfg.twilio_phone_number:
        payload["twilio_phone_number"] = cfg.twilio_phone_number
    if cfg.twilio_whatsapp_number:
        payload["twilio_whatsapp_number"] = cfg.twilio_whatsapp_number

    try:
        client.table(SETUP_TABLE_NAME).insert(payload).execute()
        logger.info("Inserted new setup_config row.")
    except Exception as e:
        logger.error(f"Failed to insert setup config: {e}")
        raise HTTPException(status_code=500, detail="Failed to save setup config.")


# ---------------------------------------------------------------------------
# Routes – app_settings (schedule / metrics)
# ---------------------------------------------------------------------------

@router.get("/config", response_model=AppSettings)
async def get_app_settings() -> AppSettings:
    """Get current schedule / metric settings."""
    return _load_settings_from_db()


@router.post("/config", response_model=AppSettings)
async def update_app_settings(settings_payload: AppSettings) -> AppSettings:
    """Replace schedule / metric settings."""
    _save_settings_to_db(settings_payload)
    return settings_payload


# ---------------------------------------------------------------------------
# Routes – setup_config (credentials)
# ---------------------------------------------------------------------------

@router.get("/setup", response_model=SetupConfig)
async def get_setup_config() -> SetupConfig:
    """
    Get the latest setup credentials from setup_config.
    Returns defaults when no row exists yet.
    """
    return _load_setup_config_from_db()


@router.post("/setup", response_model=SetupConfig)
async def save_setup_config(payload: SetupConfig) -> SetupConfig:
    """
    Save setup credentials by inserting a NEW row into setup_config.
    Previous rows are NOT deleted – they remain as history.
    """
    _insert_setup_config_to_db(payload)
    # Return the newly saved latest
    return _load_setup_config_from_db()


@router.patch("/setup/pause")
async def pause_automation():
    """
    Insert a new setup_config row copying the latest credentials
    but with automation_paused = True.  Called on logout.
    """
    latest = _load_setup_config_from_db()
    latest.automation_paused = True
    latest.created_at = None  # will be set by DB default
    _insert_setup_config_to_db(latest)
    return {"detail": "Automation paused. New row inserted."}
