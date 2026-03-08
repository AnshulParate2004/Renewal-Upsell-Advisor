"""
Settings API endpoints for app-wide scheduling and metric defaults.

These endpoints expose a small configuration object that controls:
- Call & email scheduling preferences (time windows, follow-up cadence)
- Default metric guardrails (churn risk threshold, renewal/upsell targets)

The configuration is stored in Supabase in a single-row table `app_settings`
with at least the following columns:
- key (text, primary key) – we use value "default"
- config (jsonb) – arbitrary JSON payload
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.services.email.scheduler import get_supabase_client


logger = get_logger(__name__)
router = APIRouter()


class ScheduleConfig(BaseModel):
  """
  Call & email scheduling preferences.

  Times are stored in 24h "HH:MM" format (no timezone attached).
  Auto schedule times define when the daily email and call jobs run (e.g. IST).
  """

  callWindowStart: str = Field("09:00", description="Preferred call window start time (HH:MM, 24h)")
  callWindowEnd: str = Field("17:00", description="Preferred call window end time (HH:MM, 24h)")
  emailWindowStart: str = Field("08:00", description="Preferred email window start time (HH:MM, 24h)")
  emailWindowEnd: str = Field("18:00", description="Preferred email window end time (HH:MM, 24h)")
  followUpDays: int = Field(3, ge=1, le=60, description="Default days between follow-ups (throttle interval)")
  autoEmailScheduleTime: str = Field("12:00", description="Daily time to run auto email campaign (HH:MM, 24h)")
  autoCallScheduleTime: str = Field("14:00", description="Daily time to run auto call processing (HH:MM, 24h)")
  reminderDaysBeforeRenewal: int = Field(1, ge=0, le=365, description="Trigger call/email when this many days before renewal (e.g. 1 = 1 day before)")


class MetricsConfig(BaseModel):
  """
  Default metric guardrails and percentage-wise thresholds.
  """

  churnRiskThreshold: int = Field(30, ge=0, le=100, description="Churn risk % above which accounts are high-risk")
  renewalTarget: int = Field(90, ge=0, le=100, description="Target renewal rate % for the portfolio")
  upsellPipelineTarget: int = Field(100_000, ge=0, description="Upsell pipeline ARR target used in dashboards")
  # Percentage-wise thresholds
  renewalReminderAtCompletionPercent: int = Field(90, ge=0, le=100, description="Send renewal reminder when plan completion >= this %")
  highRiskScoreThresholdPercent: int = Field(70, ge=0, le=100, description="Risk score >= this % treated as high-risk")
  churnProbabilityThresholdPercent: int = Field(70, ge=0, le=100, description="Churn probability >= this % (e.g. 70 = 0.70) triggers churn prevention")
  minUsagePercentForCall: int = Field(20, ge=0, le=100, description="Minimum plan completion % to trigger first call")
  healthScoreAtRiskBelowPercent: int = Field(50, ge=0, le=100, description="Health score below this % treated as at-risk")


class PipelineFlowConfig(BaseModel):
  """
  Per–pipeline-stage action: what to send for each stage (email, call, both, or none).
  Keys: q1, q2, q3, q4, renewed. Values: "email" | "voice" | "both" | "none".
  Used by the daily pipeline flow runner to send messages according to Settings.
  """
  q1: str = Field("email", description="Q1 (271+ days): email | voice | both | none")
  q2: str = Field("email", description="Q2 (181–270 days)")
  q3: str = Field("email", description="Q3 (91–180 days)")
  q4: str = Field("both", description="Q4 (0–90 days)")
  renewed: str = Field("none", description="Renewed stage")


class AppSettings(BaseModel):
  """
  Root settings object persisted in Supabase.
  """

  schedule: ScheduleConfig = ScheduleConfig()
  metrics: MetricsConfig = MetricsConfig()
  pipeline_flow: Optional[PipelineFlowConfig] = Field(default_factory=PipelineFlowConfig, description="Per-stage action for pipeline flow (email/call/both/none)")


DEFAULT_SETTINGS = AppSettings()
SETTINGS_TABLE_NAME = "app_settings"
SETTINGS_ROW_KEY = "default"


def _load_settings_from_db() -> AppSettings:
  """
  Load settings from Supabase. Falls back to defaults if table/row is missing
  or Supabase is not configured.
  """
  client = get_supabase_client()
  if not client:
    logger.warning("Supabase not configured; returning default settings only.")
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
    logger.error(f"Failed to load app settings from Supabase: {e}")
    return DEFAULT_SETTINGS

  rows = result.data or []
  if not rows:
    # No row yet – create one with defaults so future reads are fast.
    try:
      client.table(SETTINGS_TABLE_NAME).insert(
        {
          "key": SETTINGS_ROW_KEY,
          "config": DEFAULT_SETTINGS.model_dump(),
        }
      ).execute()
    except Exception as e:
      logger.error(f"Failed to initialize default app settings row: {e}")
    return DEFAULT_SETTINGS

  raw_config: Dict[str, Any] = rows[0].get("config") or {}
  try:
    # Pydantic will fill in any missing fields with defaults.
    return AppSettings(**raw_config)
  except Exception as e:
    logger.error(f"Invalid config shape in app_settings row; using defaults. Error: {e}")
    return DEFAULT_SETTINGS


def _save_settings_to_db(settings_obj: AppSettings) -> None:
  """
  Persist settings to Supabase, creating or updating the single row.
  """
  client = get_supabase_client()
  if not client:
    raise HTTPException(status_code=503, detail="Supabase not configured; cannot persist settings.")

  payload = {
    "key": SETTINGS_ROW_KEY,
    "config": settings_obj.model_dump(),
  }

  try:
    # Try update first; if no row updated, insert a new one.
    update_result = (
      client.table(SETTINGS_TABLE_NAME)
      .update({"config": payload["config"]})
      .eq("key", SETTINGS_ROW_KEY)
      .execute()
    )
    updated_rows = update_result.data or []
    if not updated_rows:
      client.table(SETTINGS_TABLE_NAME).insert(payload).execute()
  except Exception as e:
    logger.error(f"Failed to save app settings to Supabase: {e}")
    raise HTTPException(status_code=500, detail="Failed to save settings.")


@router.get("/config", response_model=AppSettings)
async def get_app_settings() -> AppSettings:
  """
  Get current application settings (schedule + metrics).

  If Supabase is not available or the settings row does not exist,
  this returns built-in defaults.
  """
  return _load_settings_from_db()


@router.post("/config", response_model=AppSettings)
async def update_app_settings(settings_payload: AppSettings) -> AppSettings:
  """
  Replace the current application settings with the provided payload.

  The full object must be sent from the client (schedule + metrics).
  """
  _save_settings_to_db(settings_payload)
  return settings_payload

