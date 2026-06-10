"""SQLAlchemy ORM models aligned with Document/tech-plan/schemas/postgres.ddl."""
import uuid
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


class Tenant(Base):
    __tablename__ = "tenants"
    id: Mapped[uuid.UUID] = _uuid_pk()
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("tenant_id", "email"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class Role(Base):
    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("tenant_id", "name"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)


class UserRole(Base):
    __tablename__ = "user_roles"
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)


class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = (
        Index("idx_accounts_renewal", "tenant_id", "renewal_date", "status", "risk_score"),
        Index("idx_accounts_lifecycle", "tenant_id", "current_lifecycle_stage", "current_quarter"),
    )
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    salesforce_id: Mapped[str | None] = mapped_column(String(64))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[str | None] = mapped_column(String(255))
    industry: Mapped[str | None] = mapped_column(String(100))
    company_size: Mapped[str | None] = mapped_column(String(50))
    arr: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    mrr: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    billing_interval: Mapped[str] = mapped_column(String(20), default="annual")
    contract_start_date: Mapped[date | None] = mapped_column(Date)
    contract_end_date: Mapped[date | None] = mapped_column(Date)
    renewal_date: Mapped[date | None] = mapped_column(Date)
    last_contact_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(30), default="active")
    renewal_stage: Mapped[str | None] = mapped_column(String(30))
    health_score: Mapped[int | None] = mapped_column(SmallInteger)
    relationship_score: Mapped[int | None] = mapped_column(SmallInteger)
    risk_score: Mapped[int | None] = mapped_column(SmallInteger)
    churn_probability: Mapped[float | None] = mapped_column(Numeric(5, 4))
    sentiment_score: Mapped[float | None] = mapped_column(Numeric(5, 4))
    sentiment_category: Mapped[str | None] = mapped_column(String(30))
    utilization_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))
    licenses_total: Mapped[int] = mapped_column(Integer, default=0)
    licenses_used: Mapped[int] = mapped_column(Integer, default=0)
    csm_email: Mapped[str | None] = mapped_column(String(255))
    csm_name: Mapped[str | None] = mapped_column(String(255))
    primary_contact_name: Mapped[str | None] = mapped_column(String(255))
    primary_contact_email: Mapped[str | None] = mapped_column(String(255))
    primary_contact_phone: Mapped[str | None] = mapped_column(String(50))
    automation_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    current_lifecycle_stage: Mapped[str | None] = mapped_column(String(20))
    current_quarter: Mapped[str | None] = mapped_column(String(4))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class Contact(Base):
    __tablename__ = "contacts"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(50))
    role: Mapped[str | None] = mapped_column(String(100))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)


class Contract(Base):
    __tablename__ = "contracts"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    contract_number: Mapped[str | None] = mapped_column(String(100))
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    arr: Mapped[float | None] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(String(30), default="active")


class UsageMetric(Base):
    __tablename__ = "usage_metrics"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    metric_date: Mapped[date] = mapped_column(Date, nullable=False)
    licenses_used: Mapped[int | None] = mapped_column(Integer)
    utilization_pct: Mapped[float | None] = mapped_column(Numeric(5, 2))
    product_id: Mapped[str | None] = mapped_column(String(50))


class SupportTicket(Base):
    __tablename__ = "support_tickets"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    external_id: Mapped[str | None] = mapped_column(String(100))
    subject: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    priority: Mapped[str | None] = mapped_column(String(20))
    resolved_at: Mapped[datetime | None] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class AccountComment(Base):
    __tablename__ = "account_comments"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class MLScoreHistory(Base):
    __tablename__ = "ml_score_history"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    run_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    scoring_mode: Mapped[str] = mapped_column(String(20), default="formula")
    health_score: Mapped[int | None] = mapped_column(SmallInteger)
    relationship_score: Mapped[int | None] = mapped_column(SmallInteger)
    risk_score: Mapped[int | None] = mapped_column(SmallInteger)
    churn_probability: Mapped[float | None] = mapped_column(Numeric(5, 4))
    renewal_score: Mapped[int | None] = mapped_column(SmallInteger)
    upsell_score: Mapped[int | None] = mapped_column(SmallInteger)
    utilization_percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))
    sentiment_score: Mapped[float | None] = mapped_column(Numeric(5, 4))


class ChurnPrediction(Base):
    __tablename__ = "churn_predictions"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    churn_probability: Mapped[float] = mapped_column(Numeric(5, 4), nullable=False)
    risk_level: Mapped[str | None] = mapped_column(String(20))
    predicted_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class UpsellOpportunity(Base):
    __tablename__ = "upsell_opportunities"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    product_recommendation: Mapped[str | None] = mapped_column(String(255))
    estimated_value: Mapped[float | None] = mapped_column(Numeric(14, 2))
    probability: Mapped[float | None] = mapped_column(Numeric(5, 4))
    status: Mapped[str] = mapped_column(String(30), default="open")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class SentimentSnapshot(Base):
    __tablename__ = "sentiment_snapshots"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    source: Mapped[str] = mapped_column(String(30), nullable=False)
    sentiment_score: Mapped[float | None] = mapped_column(Numeric(5, 4))
    sentiment_category: Mapped[str | None] = mapped_column(String(30))
    mongo_ref_id: Mapped[str | None] = mapped_column(String(64))
    captured_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class LifecycleStageSnapshot(Base):
    __tablename__ = "lifecycle_stage_snapshots"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    stage: Mapped[str] = mapped_column(String(20), nullable=False)
    priority: Mapped[int | None] = mapped_column(SmallInteger)
    captured_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"
    __table_args__ = (UniqueConstraint("tenant_id", "vendor", "stage_name"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    vendor: Mapped[str] = mapped_column(String(30), nullable=False)
    stage_name: Mapped[str] = mapped_column(String(50), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    steps: Mapped[list["WorkflowStep"]] = relationship(back_populates="template")


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    id: Mapped[uuid.UUID] = _uuid_pk()
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflow_templates.id", ondelete="CASCADE"))
    step_order: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    time_label: Mapped[str | None] = mapped_column(String(50))
    days_offset: Mapped[int] = mapped_column(Integer, default=0)
    action_type: Mapped[str] = mapped_column(String(20), nullable=False)
    topic: Mapped[str | None] = mapped_column(Text)
    frequency: Mapped[str] = mapped_column(String(20), default="weekly")
    send_window_start: Mapped[time | None] = mapped_column(Time)
    send_window_end: Mapped[time | None] = mapped_column(Time)
    follow_up_offset_days: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    template: Mapped["WorkflowTemplate"] = relationship(back_populates="steps")


class AccountWorkflowState(Base):
    __tablename__ = "account_workflow_states"
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"), primary_key=True)
    template_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workflow_templates.id"))
    current_step_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("workflow_steps.id"))
    step_started_at: Mapped[datetime | None] = mapped_column()
    next_due_at: Mapped[datetime | None] = mapped_column()
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    step_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workflow_steps.id"))
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    channel_ref: Mapped[str | None] = mapped_column(String(100))
    error: Mapped[str | None] = mapped_column(Text)
    executed_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class AutoCampaign(Base):
    __tablename__ = "auto_campaigns"
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    action_type: Mapped[str] = mapped_column(String(30), nullable=False)
    filter_config: Mapped[dict | None] = mapped_column(JSONB)
    recurring_frequency: Mapped[str | None] = mapped_column(String(20))
    schedule_start_time: Mapped[time | None] = mapped_column(Time)
    schedule_end_time: Mapped[time | None] = mapped_column(Time)
    start_date: Mapped[date | None] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_run_at: Mapped[datetime | None] = mapped_column()
    last_run_incomplete: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str | None] = mapped_column(String(30))


class CampaignEnrollment(Base):
    __tablename__ = "campaign_enrollments"
    __table_args__ = (UniqueConstraint("campaign_id", "account_id"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("auto_campaigns.id", ondelete="CASCADE"))
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    enrolled_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class EmailCampaign(Base):
    __tablename__ = "email_campaigns"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    subject: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str | None] = mapped_column(String(30))
    sent_at: Mapped[datetime | None] = mapped_column()
    mongo_body_ref: Mapped[str | None] = mapped_column(String(64))


class VoiceCall(Base):
    __tablename__ = "voice_calls"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id", ondelete="CASCADE"))
    twilio_call_sid: Mapped[str | None] = mapped_column(String(64), unique=True)
    direction: Mapped[str | None] = mapped_column(String(20))
    status: Mapped[str | None] = mapped_column(String(30))
    outcome: Mapped[str | None] = mapped_column(String(50))
    transcript_mongo_id: Mapped[str | None] = mapped_column(String(64))
    started_at: Mapped[datetime | None] = mapped_column()
    ended_at: Mapped[datetime | None] = mapped_column()


class WhatsAppMessage(Base):
    __tablename__ = "whatsapp_messages"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("accounts.id"))
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    message: Mapped[str | None] = mapped_column(Text)
    twilio_sid: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tenants.id"))
    account_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("accounts.id"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255))
    details: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class AppSettings(Base):
    __tablename__ = "app_settings"
    __table_args__ = (UniqueConstraint("tenant_id", "config_key"),)
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    config_key: Mapped[str] = mapped_column(String(100), default="default")
    config: Mapped[dict] = mapped_column(JSONB, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)


class IntegrationCredential(Base):
    __tablename__ = "integration_credentials"
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    encrypted_payload: Mapped[bytes] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    id: Mapped[uuid.UUID] = _uuid_pk()
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("tenants.id"))
    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    event_type: Mapped[str | None] = mapped_column(String(100))
    mongo_payload_id: Mapped[str] = mapped_column(String(64), nullable=False)
    processed: Mapped[bool] = mapped_column(Boolean, default=False)
    received_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[uuid.UUID] = _uuid_pk()
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.id"))
    stripe_payment_id: Mapped[str | None] = mapped_column(String(100))
    amount: Mapped[float | None] = mapped_column(Numeric(14, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[str | None] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
