-- Add start_date, end_date, and send time window to auto_campaigns (run in Supabase SQL Editor if table already exists).
-- start_date/end_date: campaign runs only when today is between these dates (when set).
-- schedule_start_time/schedule_end_time: send messages only between these times each day (HH:MM 24h UTC).

ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS schedule_start_time VARCHAR(5);
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS schedule_end_time VARCHAR(5);
ALTER TABLE public.auto_campaigns ADD COLUMN IF NOT EXISTS follow_up_offset_days INTEGER;
