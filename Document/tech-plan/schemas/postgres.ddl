-- Revenue Navigator — Reference PostgreSQL Schema (Appendix)
-- Migrations managed via Alembic in backend/alembic/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenancy & Auth
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, email)
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(50) NOT NULL,
    UNIQUE (tenant_id, name)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Core CRM
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    salesforce_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    arr NUMERIC(14,2) NOT NULL DEFAULT 0,
    mrr NUMERIC(14,2) NOT NULL DEFAULT 0,
    billing_interval VARCHAR(20) DEFAULT 'annual',
    contract_start_date DATE,
    contract_end_date DATE,
    renewal_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    renewal_stage VARCHAR(30),
    health_score SMALLINT,
    relationship_score SMALLINT,
    risk_score SMALLINT,
    churn_probability NUMERIC(5,4),
    sentiment_score NUMERIC(5,4),
    sentiment_category VARCHAR(30),
    utilization_percentage NUMERIC(5,2),
    licenses_total INT DEFAULT 0,
    licenses_used INT DEFAULT 0,
    csm_email VARCHAR(255),
    csm_name VARCHAR(255),
    primary_contact_name VARCHAR(255),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(50),
    automation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    current_lifecycle_stage VARCHAR(20),  -- protect|renew|adopt|expand|activate
    current_quarter VARCHAR(4),           -- q1|q2|q3|q4
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_renewal ON accounts (tenant_id, renewal_date, status, risk_score);
CREATE INDEX idx_accounts_lifecycle ON accounts (tenant_id, current_lifecycle_stage, current_quarter);

CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    contract_number VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    arr NUMERIC(14,2),
    status VARCHAR(30) NOT NULL DEFAULT 'active'
);

CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    licenses_used INT,
    utilization_pct NUMERIC(5,2),
    product_id VARCHAR(50)
);

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    external_id VARCHAR(100),
    subject VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    priority VARCHAR(20),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE account_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scoring
CREATE TABLE ml_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    scoring_mode VARCHAR(20) NOT NULL DEFAULT 'formula',  -- formula | ml
    health_score SMALLINT,
    relationship_score SMALLINT,
    risk_score SMALLINT,
    churn_probability NUMERIC(5,4),
    renewal_score SMALLINT,
    upsell_score SMALLINT,
    utilization_percentage NUMERIC(5,2),
    sentiment_score NUMERIC(5,4)
);

CREATE INDEX idx_ml_score_history_account ON ml_score_history (account_id, run_at DESC);

CREATE TABLE churn_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    churn_probability NUMERIC(5,4) NOT NULL,
    risk_level VARCHAR(20),
    predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE upsell_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    product_recommendation VARCHAR(255),
    estimated_value NUMERIC(14,2),
    probability NUMERIC(5,4),
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sentiment_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    source VARCHAR(30) NOT NULL,
    sentiment_score NUMERIC(5,4),
    sentiment_category VARCHAR(30),
    mongo_ref_id VARCHAR(64),
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lifecycle & Workflows
CREATE TABLE lifecycle_stage_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    stage VARCHAR(20) NOT NULL,
    priority SMALLINT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    vendor VARCHAR(30) NOT NULL,
    stage_name VARCHAR(50) NOT NULL,  -- ab_q1, cf_q2, cs_q4, etc.
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (tenant_id, vendor, stage_name)
);

CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    time_label VARCHAR(50),           -- Month 1, After 3d, Last 7d
    days_offset INT DEFAULT 0,
    action_type VARCHAR(20) NOT NULL, -- email|call|whatsapp|task
    topic TEXT,                       -- purpose injected into LLM/bot
    frequency VARCHAR(20) DEFAULT 'weekly',  -- daily|weekly|monthly|one_time
    send_window_start TIME,
    send_window_end TIME,
    follow_up_offset_days INT DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE account_workflow_states (
    account_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workflow_templates(id),
    current_step_id UUID REFERENCES workflow_steps(id),
    step_started_at TIMESTAMPTZ,
    next_due_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_workflow_states_due ON account_workflow_states (next_due_at)
    WHERE is_active = TRUE;

CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    step_id UUID NOT NULL REFERENCES workflow_steps(id),
    status VARCHAR(30) NOT NULL,      -- pending|sent|completed|failed|skipped
    channel_ref VARCHAR(100),         -- Resend message id or Twilio SID
    error TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outreach
CREATE TABLE auto_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    action_type VARCHAR(30) NOT NULL,
    filter_config JSONB,
    recurring_frequency VARCHAR(20),
    schedule_start_time TIME,
    schedule_end_time TIME,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at TIMESTAMPTZ,
    last_run_incomplete BOOLEAN DEFAULT FALSE,
    status VARCHAR(30)
);

CREATE INDEX idx_auto_campaigns_active ON auto_campaigns (tenant_id) WHERE is_active = TRUE;

CREATE TABLE campaign_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES auto_campaigns(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (campaign_id, account_id)
);

CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    subject VARCHAR(500),
    status VARCHAR(30),
    sent_at TIMESTAMPTZ,
    mongo_body_ref VARCHAR(64)
);

CREATE TABLE voice_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    twilio_call_sid VARCHAR(64) UNIQUE,
    direction VARCHAR(20),
    status VARCHAR(30),
    outcome VARCHAR(50),
    transcript_mongo_id VARCHAR(64),
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ
);

CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id),
    phone_number VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    message TEXT,
    twilio_sid VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    account_id UUID REFERENCES accounts(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    title VARCHAR(255),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_account ON activity_logs (account_id, created_at DESC);

-- Config & Integrations
-- app_settings.config JSONB example (single row per tenant):
-- {
--   "lifecycle_buckets": {
--     "protect_min_risk_score": 70,
--     "expand_min_health_score": 65,
--     "expand_min_utilization_percent": 72,
--     "expand_max_risk_score": 45,
--     ...
--   },
--   "scoring_formulas": { ... see schemas/scoring_config.example.json ... }
-- }
CREATE TABLE app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    config_key VARCHAR(100) NOT NULL DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, config_key)
);

CREATE TABLE integration_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    provider VARCHAR(50) NOT NULL,
    encrypted_payload BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100),
    mongo_payload_id VARCHAR(64) NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    stripe_payment_id VARCHAR(100),
    amount NUMERIC(14,2),
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
