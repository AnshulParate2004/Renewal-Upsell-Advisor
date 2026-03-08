-- Follow-up offset (days): when to queue next call/email after this touchpoint. Run in Supabase if table exists.

ALTER TABLE public.workflow_steps
ADD COLUMN IF NOT EXISTS follow_up_offset_days INTEGER DEFAULT 3;

COMMENT ON COLUMN public.workflow_steps.follow_up_offset_days IS 'Days after this touchpoint before next call/email is queued';
