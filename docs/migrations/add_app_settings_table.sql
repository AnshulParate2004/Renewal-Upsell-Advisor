-- Create app_settings table for Settings API and Renewal Pipeline Scheduler.
-- Run this in Supabase SQL Editor if you see: "Could not find the table 'public.app_settings'"

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    config JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: insert default row so first GET returns defaults from DB
INSERT INTO app_settings (key, config)
VALUES (
    'default',
    '{"schedule":{"callWindowStart":"09:00","callWindowEnd":"17:00","emailWindowStart":"08:00","emailWindowEnd":"18:00","followUpDays":3,"autoEmailScheduleTime":"12:00","autoCallScheduleTime":"14:00","reminderDaysBeforeRenewal":1},"metrics":{"churnRiskThreshold":30,"renewalTarget":90,"upsellPipelineTarget":100000,"renewalReminderAtCompletionPercent":90,"highRiskScoreThresholdPercent":70,"churnProbabilityThresholdPercent":70,"minUsagePercentForCall":20,"healthScoreAtRiskBelowPercent":50,"callMilestonePercents":[30,60,90,95],"emailMilestonePercents":[30,60,90,95]}}'
)
ON CONFLICT (key) DO NOTHING;
