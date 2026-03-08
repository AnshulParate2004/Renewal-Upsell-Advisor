from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.api.deps import Base

class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage_name = Column(String(50), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    steps = relationship("WorkflowStep", back_populates="template", cascade="all, delete-orphan", order_by="WorkflowStep.step_order")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = Column(UUID(as_uuid=True), ForeignKey("workflow_templates.id", ondelete="CASCADE"))
    step_order = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    time_label = Column(String(50))
    days_offset = Column(Integer, nullable=False)
    action_type = Column(String(50), nullable=False)
    topic = Column(Text)  # Purpose injected into email/call bot
    frequency = Column(String(20), default="weekly")  # one_time | daily | weekly | monthly
    send_window_start = Column(String(5))  # "HH:MM" when to start sending
    send_window_end = Column(String(5))  # "HH:MM" when to stop sending
    follow_up_offset_days = Column(Integer, default=3)  # Days after touchpoint to queue next
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    template = relationship("WorkflowTemplate", back_populates="steps")
    executions = relationship("WorkflowExecution", back_populates="step", cascade="all, delete-orphan")

class AccountWorkflowState(Base):
    __tablename__ = "account_workflow_state"

    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True)
    current_stage = Column(String(50), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    account = relationship("Account", backref="workflow_state")

class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(UUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"))
    step_id = Column(UUID(as_uuid=True), ForeignKey("workflow_steps.id", ondelete="CASCADE"))
    status = Column(String(50), default="scheduled")
    executed_at = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    account = relationship("Account")
    step = relationship("WorkflowStep", back_populates="executions")
