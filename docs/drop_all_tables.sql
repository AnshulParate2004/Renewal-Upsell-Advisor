-- ============================================================================
-- DROP ALL TABLES SCRIPT
-- ============================================================================
-- WARNING: This will delete ALL data and tables!
-- Run this in Supabase SQL Editor to completely reset the database
-- ============================================================================

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS ml_training_logs CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS salesforce_sync_log CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS renewal_events CASCADE;
DROP TABLE IF EXISTS renewal_quotes CASCADE;
DROP TABLE IF EXISTS voice_calls CASCADE;
DROP TABLE IF EXISTS email_campaigns CASCADE;
DROP TABLE IF EXISTS sentiment_analysis CASCADE;
DROP TABLE IF EXISTS upsell_opportunities CASCADE;
DROP TABLE IF EXISTS churn_predictions CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS usage_metrics CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;

-- Drop views
DROP VIEW IF EXISTS account_health_dashboard CASCADE;
DROP VIEW IF EXISTS upcoming_renewals CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS sync_primary_contact_to_accounts() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify all tables are dropped:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- ============================================================================
