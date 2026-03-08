-- Seed one auto campaign: 20% discount email for high-churn accounts (Churn % 50–99),
-- from 2026-03-08 to 2026-03-10, send from 08:22 IST (no end time). Run in Supabase SQL Editor.
-- Uses table public.auto_campaigns (create it first from auto_campaigns_schema.sql if needed).

INSERT INTO public.auto_campaigns (
    name,
    description,
    target_audience_filter,
    filter_config,
    recurring_frequency,
    action_type,
    is_active,
    start_date,
    end_date,
    schedule_start_time,
    follow_up_offset_days
) VALUES (
    '20% discount for high-churn accounts',
    'Give 20 percentage discount to them in the mail',
    'multi',
    '{"churn": {"min": 50, "max": 99}}'::jsonb,
    'daily',
    'email_sequence',
    true,
    '2026-03-08',
    '2026-03-10',
    '08:22',
    3
);

-- To avoid duplicates, run once. To re-seed: DELETE FROM public.auto_campaigns WHERE name = '20% discount for high-churn accounts'; then run this again.
