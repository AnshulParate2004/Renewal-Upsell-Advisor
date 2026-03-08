-- Create auto_campaigns table (used by Campaigns > Automatic in the app).
-- Run this in Supabase SQL Editor if you get "Could not find the table 'public.auto_campaigns'".
-- The app expects this table; email_campaigns is a different table for sent-email logs.

CREATE TABLE IF NOT EXISTS public.auto_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_audience_filter VARCHAR(100) NOT NULL,
    filter_min_value DECIMAL(10, 2),
    filter_max_value DECIMAL(10, 2),
    filter_config JSONB,
    recurring_frequency VARCHAR(50) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    start_date DATE,
    end_date DATE,
    schedule_start_time VARCHAR(5),
    schedule_end_time VARCHAR(5),
    follow_up_offset_days INTEGER,
    last_run_incomplete BOOLEAN DEFAULT false,
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- If table already exists, add columns (run once):
-- ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
-- ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
-- ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS schedule_start_time VARCHAR(5);
-- ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS schedule_end_time VARCHAR(5);
-- ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS follow_up_offset_days INTEGER;
-- ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS last_run_incomplete BOOLEAN DEFAULT false;

-- Optional: campaign_enrollments for tracking which accounts are in which campaign (if you use enrollments later)
-- CREATE TABLE IF NOT EXISTS public.campaign_enrollments (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     campaign_id UUID NOT NULL REFERENCES public.auto_campaigns(id) ON DELETE CASCADE,
--     account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
--     enrolled_at TIMESTAMPTZ DEFAULT now(),
--     last_action_at TIMESTAMPTZ,
--     status VARCHAR(50) DEFAULT 'active'
-- );
