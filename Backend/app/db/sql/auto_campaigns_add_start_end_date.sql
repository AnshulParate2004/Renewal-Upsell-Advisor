-- Add start_date, end_date, send time window, and run tracking to auto_campaigns (run in Supabase SQL Editor if table already exists).
-- start_date/end_date: campaign runs only when today is between these dates (when set).
-- schedule_start_time/schedule_end_time: send messages only between these times each day (HH:MM, IST).
-- last_run_at: when the campaign was last executed (scheduler updates this).
-- last_run_incomplete: true if the last run had failures (e.g. some emails not sent).

ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMPTZ;
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS schedule_start_time VARCHAR(5);
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS schedule_end_time VARCHAR(5);
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS follow_up_offset_days INTEGER;
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS last_run_incomplete BOOLEAN DEFAULT false;
-- status: display section for UI — 'upcoming' | 'ongoing' | 'incomplete' | 'completed'
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(50);
