-- Add frequency to workflow_steps (one_time | daily | weekly | monthly).
-- Run in Supabase SQL Editor if the table already exists.

ALTER TABLE public.workflow_steps
ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'weekly';

COMMENT ON COLUMN public.workflow_steps.frequency IS 'one_time | daily | weekly | monthly';
COMMENT ON COLUMN public.workflow_steps.topic IS 'Purpose/description injected into email or call bot';
