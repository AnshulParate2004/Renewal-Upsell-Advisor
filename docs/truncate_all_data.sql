-- ============================================================================
-- TRUNCATE ALL DATA (Keep Schema Intact)
-- ============================================================================
-- This script removes all data from all tables but keeps the schema structure
-- Run this in your PostgreSQL SQL editor
-- ============================================================================

-- Disable foreign key checks temporarily (PostgreSQL doesn't have this, so we'll use CASCADE)
-- We'll truncate in reverse dependency order

-- ============================================================================
-- TRUNCATE TABLES (in reverse dependency order)
-- ============================================================================

-- Child tables first (tables that reference other tables)
TRUNCATE TABLE webhook_events CASCADE;
TRUNCATE TABLE ml_training_logs CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE salesforce_sync_log CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE renewal_events CASCADE;
TRUNCATE TABLE renewal_quotes CASCADE;
TRUNCATE TABLE voice_calls CASCADE;
TRUNCATE TABLE email_campaigns CASCADE;
TRUNCATE TABLE sentiment_analysis CASCADE;
TRUNCATE TABLE upsell_opportunities CASCADE;
TRUNCATE TABLE churn_predictions CASCADE;
TRUNCATE TABLE support_tickets CASCADE;
TRUNCATE TABLE usage_metrics CASCADE;

-- Contacts table (references accounts)
TRUNCATE TABLE contacts CASCADE;

-- Accounts table (parent table, referenced by many others)
TRUNCATE TABLE accounts CASCADE;

-- ============================================================================
-- ALTERNATIVE: If CASCADE doesn't work, use DELETE statements
-- ============================================================================
-- Uncomment below if TRUNCATE CASCADE fails due to foreign key constraints

/*
-- Delete in reverse dependency order
DELETE FROM webhook_events;
DELETE FROM ml_training_logs;
DELETE FROM activity_logs;
DELETE FROM salesforce_sync_log;
DELETE FROM transactions;
DELETE FROM renewal_events;
DELETE FROM renewal_quotes;
DELETE FROM voice_calls;
DELETE FROM email_campaigns;
DELETE FROM sentiment_analysis;
DELETE FROM upsell_opportunities;
DELETE FROM churn_predictions;
DELETE FROM support_tickets;
DELETE FROM usage_metrics;
DELETE FROM contacts;
DELETE FROM accounts;
*/

-- ============================================================================
-- VERIFY DATA DELETION
-- ============================================================================
-- Run these queries to verify all tables are empty

SELECT 'accounts' as table_name, COUNT(*) as row_count FROM accounts
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'usage_metrics', COUNT(*) FROM usage_metrics
UNION ALL
SELECT 'support_tickets', COUNT(*) FROM support_tickets
UNION ALL
SELECT 'churn_predictions', COUNT(*) FROM churn_predictions
UNION ALL
SELECT 'upsell_opportunities', COUNT(*) FROM upsell_opportunities
UNION ALL
SELECT 'sentiment_analysis', COUNT(*) FROM sentiment_analysis
UNION ALL
SELECT 'email_campaigns', COUNT(*) FROM email_campaigns
UNION ALL
SELECT 'voice_calls', COUNT(*) FROM voice_calls
UNION ALL
SELECT 'renewal_quotes', COUNT(*) FROM renewal_quotes
UNION ALL
SELECT 'renewal_events', COUNT(*) FROM renewal_events
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'salesforce_sync_log', COUNT(*) FROM salesforce_sync_log
UNION ALL
SELECT 'activity_logs', COUNT(*) FROM activity_logs
UNION ALL
SELECT 'ml_training_logs', COUNT(*) FROM ml_training_logs
UNION ALL
SELECT 'webhook_events', COUNT(*) FROM webhook_events
ORDER BY table_name;

-- All row_count values should be 0 if truncation was successful
