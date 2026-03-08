from pydantic import BaseModel, UUID4, confloat
from typing import List, Optional, Any, Dict
from datetime import datetime

class AutoCampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_audience_filter: str
    filter_min_value: Optional[float] = None
    filter_max_value: Optional[float] = None
    """Optional multi-filter config (same as Accounts: risk, healthScore, arr, renewal, utilization, relationshipScore, churn, locationKeyword, partnerNameKeyword). Applied together when present."""
    filter_config: Optional[Dict[str, Any]] = None
    recurring_frequency: str
    action_type: str
    is_active: bool = True
    last_run_at: Optional[datetime] = None
    """Campaign runs only when today is on or after this date (YYYY-MM-DD). Optional."""
    start_date: Optional[str] = None
    """Campaign runs only when today is on or before this date (YYYY-MM-DD). Optional."""
    end_date: Optional[str] = None
    """Send messages only at or after this time each day. Optional. Format HH:MM (24h, IST)."""
    schedule_start_time: Optional[str] = None
    """Send messages only at or before this time each day. Optional. Format HH:MM (24h, IST)."""
    schedule_end_time: Optional[str] = None
    """Days after this touchpoint to queue the next call or email. Optional. Default 3."""
    follow_up_offset_days: Optional[int] = None

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
