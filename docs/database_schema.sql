-- ============================================================================
-- RENEWAL-UPSELL-ADVISOR DATABASE SCHEMA (PostgreSQL)
-- ============================================================================
-- Recommendation: Keep everything in PostgreSQL instead of MongoDB
-- Reasons:
--   1. ACID compliance for critical business data
--   2. Complex queries and joins across tables
--   3. Better data integrity and consistency
--   4. PostgreSQL has excellent JSON support (JSONB) for flexible log storage
--   5. Simpler architecture with one database system
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Accounts/Companies Table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    salesforce_id VARCHAR(255) UNIQUE,
    name VARCHAR(500) NOT NULL,
    domain VARCHAR(255),
    industry VARCHAR(255),
    company_size VARCHAR(50),
    arr DECIMAL(15, 2) NOT NULL DEFAULT 0,
    mrr DECIMAL(15, 2) NOT NULL DEFAULT 0,
    contract_start_date DATE,
    contract_end_date DATE,
    renewal_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, churned, at_risk, renewed
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts Table (CSM, AE, Customer contacts)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    salesforce_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(500) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(100), -- CSM, AE, Customer, Decision Maker, etc.
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Internal team members)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(500) UNIQUE NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- admin, csm, ae, analyst
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- AUTHENTICATION & SECURITY
-- ============================================================================

-- JWT Refresh Tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(500) NOT NULL UNIQUE,
    device_info VARCHAR(500), -- Browser, OS, Device name
    ip_address INET,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    revoked_at TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoke_reason VARCHAR(255) -- logout, security_breach, expired, replaced
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Email Verification Tokens
CREATE TABLE email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(500) NOT NULL UNIQUE,
    email VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash);

-- Authentication Events (Security Audit Trail)
CREATE TABLE auth_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email VARCHAR(500), -- Store email even if user is deleted
    event_type VARCHAR(50) NOT NULL, -- login_success, login_failed, logout, token_refresh, password_reset, email_verified, account_locked
    ip_address INET,
    user_agent TEXT,
    device_info VARCHAR(500),
    location VARCHAR(255), -- City, Country (if using IP geolocation)
    success BOOLEAN DEFAULT TRUE,
    failure_reason VARCHAR(500), -- invalid_credentials, account_locked, account_inactive, etc.
    metadata JSONB, -- Additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX idx_auth_events_email ON auth_events(email);
CREATE INDEX idx_auth_events_event_type ON auth_events(event_type);
CREATE INDEX idx_auth_events_created_at ON auth_events(created_at DESC);
CREATE INDEX idx_auth_events_ip_address ON auth_events(ip_address);

-- API Keys (for programmatic access)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(500) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL, -- First few chars for identification (e.g., "sk_live_abc...")
    scopes JSONB, -- ["read:accounts", "write:contacts", ...]
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Two-Factor Authentication (2FA)
CREATE TABLE two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    secret_key VARCHAR(500) NOT NULL, -- Encrypted TOTP secret
    is_enabled BOOLEAN DEFAULT FALSE,
    backup_codes JSONB, -- Array of hashed backup codes
    enabled_at TIMESTAMP,
    last_verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_two_factor_auth_user_id ON two_factor_auth(user_id);

-- Session Management (Optional - for tracking active sessions)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash VARCHAR(500) NOT NULL UNIQUE,
    refresh_token_id UUID REFERENCES refresh_tokens(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    device_info VARCHAR(500),
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    terminated_at TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token_hash ON user_sessions(session_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ============================================================================
-- USAGE & ENGAGEMENT DATA
-- ============================================================================

-- Product Usage Metrics
CREATE TABLE usage_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    active_users INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    total_duration_minutes INTEGER DEFAULT 0,
    feature_usage JSONB, -- {"feature_a": 45, "feature_b": 23, ...}
    api_calls INTEGER DEFAULT 0,
    utilization_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, metric_date)
);

-- Support Tickets
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    zendesk_id VARCHAR(255) UNIQUE,
    subject VARCHAR(1000),
    description TEXT,
    priority VARCHAR(50), -- low, medium, high, urgent
    status VARCHAR(50), -- open, pending, solved, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ML MODEL OUTPUTS
-- ============================================================================

-- Churn Predictions
CREATE TABLE churn_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    prediction_date DATE NOT NULL,
    churn_probability DECIMAL(5, 4) CHECK (churn_probability >= 0 AND churn_probability <= 1),
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_category VARCHAR(50), -- low, medium, high
    contributing_factors JSONB, -- {"low_usage": 0.3, "support_tickets": 0.2, ...}
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, prediction_date)
);

-- Upsell Opportunities
CREATE TABLE upsell_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    opportunity_type VARCHAR(100), -- expansion, cross_sell, upgrade
    predicted_value DECIMAL(15, 2),
    probability DECIMAL(5, 4) CHECK (probability >= 0 AND probability <= 1),
    recommended_products JSONB, -- ["premium_plan", "add_on_a", ...]
    reasoning TEXT,
    status VARCHAR(50) DEFAULT 'identified', -- identified, contacted, negotiating, won, lost
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sentiment Analysis
CREATE TABLE sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    analysis_date DATE NOT NULL,
    sentiment_score DECIMAL(5, 4) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
    sentiment_category VARCHAR(50), -- very_negative, negative, neutral, positive, very_positive
    source VARCHAR(100), -- support_tickets, emails, calls, surveys
    text_analyzed TEXT,
    keywords JSONB, -- ["frustrated", "happy", "confused", ...]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, analysis_date, source)
);

-- ============================================================================
-- COMMUNICATION & OUTREACH
-- ============================================================================

-- Email Campaigns
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    campaign_type VARCHAR(100), -- renewal_reminder, upsell, churn_prevention
    subject VARCHAR(1000),
    body TEXT,
    sent_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    replied_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, sent, opened, clicked, replied, bounced
    metadata JSONB, -- payment links, quote details, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voice Calls
CREATE TABLE voice_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    call_type VARCHAR(100), -- renewal_reminder, upsell, check_in
    phone_number VARCHAR(50),
    duration_seconds INTEGER,
    status VARCHAR(50), -- scheduled, completed, no_answer, busy, failed
    outcome VARCHAR(100), -- interested, not_interested, callback_requested, voicemail
    transcript TEXT,
    summary TEXT,
    recording_url VARCHAR(1000),
    scheduled_at TIMESTAMP,
    attempted_at TIMESTAMP,
    completed_at TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- RENEWAL WORKFLOW
-- ============================================================================

-- Renewal Quotes
CREATE TABLE renewal_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    quote_number VARCHAR(100) UNIQUE,
    total_amount DECIMAL(15, 2) NOT NULL,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    final_amount DECIMAL(15, 2) NOT NULL,
    payment_link VARCHAR(1000),
    valid_until DATE,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, expired
    line_items JSONB, -- [{"product": "Premium Plan", "quantity": 1, "price": 1000}, ...]
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Renewal Timeline Events
CREATE TABLE renewal_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    event_type VARCHAR(100), -- t_minus_90, t_minus_60, t_minus_30, quote_sent, payment_received
    event_date DATE NOT NULL,
    triggered_at TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed, skipped
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INTEGRATION DATA
-- ============================================================================

-- Stripe/Chargebee Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    stripe_id VARCHAR(255) UNIQUE,
    transaction_type VARCHAR(50), -- payment, refund, chargeback
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50), -- succeeded, pending, failed
    payment_method VARCHAR(100),
    invoice_url VARCHAR(1000),
    transaction_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Salesforce Sync Log
CREATE TABLE salesforce_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100), -- accounts, contacts, opportunities
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(50), -- success, partial, failed
    error_details JSONB,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOGS & EVENTS (Using PostgreSQL JSONB instead of MongoDB)
-- ============================================================================

-- System Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL, -- login, view_account, send_email, make_call, etc.
    entity_type VARCHAR(100), -- account, contact, opportunity, etc.
    entity_id UUID,
    details JSONB, -- flexible JSON for any additional context
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster log queries
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_account_id ON activity_logs(account_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);

-- Webhook Events (from external systems)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- stripe, salesforce, zendesk, etc.
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_events_processed ON webhook_events(processed, created_at);

-- ML Model Training Logs
CREATE TABLE ml_training_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL, -- churn_prediction, upsell_propensity, sentiment_analysis
    model_version VARCHAR(50) NOT NULL,
    training_started_at TIMESTAMP NOT NULL,
    training_completed_at TIMESTAMP,
    metrics JSONB, -- {"accuracy": 0.92, "precision": 0.89, "recall": 0.87, ...}
    hyperparameters JSONB,
    dataset_size INTEGER,
    status VARCHAR(50), -- training, completed, failed
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Accounts
CREATE INDEX idx_accounts_renewal_date ON accounts(renewal_date);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_health_score ON accounts(health_score);
CREATE INDEX idx_accounts_salesforce_id ON accounts(salesforce_id);

-- Contacts
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Usage Metrics
CREATE INDEX idx_usage_metrics_account_id ON usage_metrics(account_id);
CREATE INDEX idx_usage_metrics_date ON usage_metrics(metric_date DESC);

-- Churn Predictions
CREATE INDEX idx_churn_predictions_account_id ON churn_predictions(account_id);
CREATE INDEX idx_churn_predictions_date ON churn_predictions(prediction_date DESC);
CREATE INDEX idx_churn_predictions_risk ON churn_predictions(risk_category);

-- Upsell Opportunities
CREATE INDEX idx_upsell_account_id ON upsell_opportunities(account_id);
CREATE INDEX idx_upsell_status ON upsell_opportunities(status);

-- Email Campaigns
CREATE INDEX idx_email_campaigns_account_id ON email_campaigns(account_id);
CREATE INDEX idx_email_campaigns_sent_at ON email_campaigns(sent_at DESC);

-- Voice Calls
CREATE INDEX idx_voice_calls_account_id ON voice_calls(account_id);
CREATE INDEX idx_voice_calls_status ON voice_calls(status);
CREATE INDEX idx_voice_calls_next_retry ON voice_calls(next_retry_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upsell_opportunities_updated_at BEFORE UPDATE ON upsell_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Account Health Dashboard View
CREATE VIEW account_health_dashboard AS
SELECT 
    a.id,
    a.name,
    a.arr,
    a.renewal_date,
    a.health_score,
    a.status,
    cp.churn_probability,
    cp.risk_category,
    sa.sentiment_score,
    um.utilization_percentage,
    COUNT(DISTINCT st.id) as open_tickets
FROM accounts a
LEFT JOIN churn_predictions cp ON a.id = cp.account_id 
    AND cp.prediction_date = (SELECT MAX(prediction_date) FROM churn_predictions WHERE account_id = a.id)
LEFT JOIN sentiment_analysis sa ON a.id = sa.account_id
    AND sa.analysis_date = (SELECT MAX(analysis_date) FROM sentiment_analysis WHERE account_id = a.id)
LEFT JOIN usage_metrics um ON a.id = um.account_id
    AND um.metric_date = (SELECT MAX(metric_date) FROM usage_metrics WHERE account_id = a.id)
LEFT JOIN support_tickets st ON a.id = st.account_id AND st.status IN ('open', 'pending')
GROUP BY a.id, a.name, a.arr, a.renewal_date, a.health_score, a.status, 
         cp.churn_probability, cp.risk_category, sa.sentiment_score, um.utilization_percentage;

-- Upcoming Renewals View
CREATE VIEW upcoming_renewals AS
SELECT 
    a.id,
    a.name,
    a.arr,
    a.renewal_date,
    (a.renewal_date - CURRENT_DATE) as days_until_renewal,
    cp.risk_category,
    rq.status as quote_status,
    rq.final_amount as quote_amount
FROM accounts a
LEFT JOIN churn_predictions cp ON a.id = cp.account_id 
    AND cp.prediction_date = (SELECT MAX(prediction_date) FROM churn_predictions WHERE account_id = a.id)
LEFT JOIN renewal_quotes rq ON a.id = rq.account_id
    AND rq.generated_at = (SELECT MAX(generated_at) FROM renewal_quotes WHERE account_id = a.id)
WHERE a.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
ORDER BY a.renewal_date;

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample account
-- INSERT INTO accounts (name, domain, arr, renewal_date, health_score, status)
-- VALUES ('Acme Corp', 'acme.com', 50000.00, '2026-06-15', 85, 'active');
