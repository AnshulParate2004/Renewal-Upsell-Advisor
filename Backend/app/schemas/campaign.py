from pydantic import BaseModel, UUID4, confloat
from typing import List, Optional, Any, Dict
from datetime import datetime

class AutoCampaignBase(BaseModel):
    name: str
    description: str = ""
    target_audience_filter: str
    filter_min_value: Optional[float] = None
    filter_max_value: Optional[float] = None
    """Optional multi-filter config (same as Accounts: risk, healthScore, arr, renewal, utilization, relationshipScore, churn, locationKeyword, partnerNameKeyword). Applied together when present."""
    filter_config: Optional[Dict[str, Any]] = None
    recurring_frequency: str
    action_type: str  # Required: must be 'email_sequence' or 'voice_bot'
    is_active: bool = True
    last_run_at: Optional[datetime] = None
    """Campaign runs only when today is on or after this date (YYYY-MM-DD). Required."""
    start_date: str = ""
    """Campaign runs only when today is on or before this date (YYYY-MM-DD). Required."""
    end_date: str = ""
    """Send messages only at or after this time each day. Optional. Format HH:MM (24h, IST)."""
    schedule_start_time: Optional[str] = None
    """Send messages only at or before this time each day. Optional. Format HH:MM (24h, IST)."""
    schedule_end_time: Optional[str] = None
    """Days after this touchpoint to queue the next call or email. Optional. Default 3."""
    follow_up_offset_days: Optional[int] = None
    """True if the last run had errors or did not send to some accounts (show in Incomplete)."""
    last_run_incomplete: Optional[bool] = None

class AutoCampaignCreate(AutoCampaignBase):
    pass

class AutoCampaignUpdate(AutoCampaignBase):
    pass

class AutoCampaignResponse(AutoCampaignBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CampaignEnrollmentBase(BaseModel):
    campaign_id: UUID4
    account_id: UUID4
    status: str = "active"

class CampaignEnrollmentResponse(CampaignEnrollmentBase):
    id: UUID4
    enrolled_at: datetime
    last_action_at: Optional[datetime] = None

    class Config:
        from_attributes = True
