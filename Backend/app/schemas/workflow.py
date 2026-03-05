from pydantic import BaseModel, UUID4, Field
from typing import List, Optional
from datetime import datetime

class WorkflowStepBase(BaseModel):
    step_order: int
    title: str
    time_label: Optional[str] = None
    days_offset: int
    action_type: str
    topic: Optional[str] = None
    is_active: bool = True

class WorkflowStepCreate(WorkflowStepBase):
    template_id: UUID4

class WorkflowStepUpdate(WorkflowStepBase):
    pass

class WorkflowStepResponse(WorkflowStepBase):
    id: UUID4
    template_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowTemplateBase(BaseModel):
    stage_name: str
    description: Optional[str] = None

class WorkflowTemplateCreate(WorkflowTemplateBase):
    pass

class WorkflowTemplateUpdate(WorkflowTemplateBase):
    pass

class WorkflowTemplateResponse(WorkflowTemplateBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime
    steps: List[WorkflowStepResponse] = []

    class Config:
        from_attributes = True

class AccountWorkflowStateBase(BaseModel):
    account_id: UUID4
    current_stage: str

class AccountWorkflowStateResponse(AccountWorkflowStateBase):
    started_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowExecutionBase(BaseModel):
    account_id: UUID4
    step_id: UUID4
    status: str = "scheduled"
    notes: Optional[str] = None

class WorkflowExecutionResponse(WorkflowExecutionBase):
    id: UUID4
    executed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
