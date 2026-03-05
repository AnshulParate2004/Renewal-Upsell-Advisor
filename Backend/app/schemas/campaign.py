from pydantic import BaseModel, UUID4, confloat
from typing import List, Optional
from datetime import datetime

class AutoCampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_audience_filter: str
    filter_min_value: Optional[float] = None
    filter_max_value: Optional[float] = None
    recurring_frequency: str
    action_type: str
    is_active: bool = True

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
