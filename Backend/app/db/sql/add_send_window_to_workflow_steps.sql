-- When to send: start and end time (HH:MM) for each step. Run in Supabase if table already exists.

ALTER TABLE public.workflow_steps
ADD COLUMN IF NOT EXISTS send_window_start VARCHAR(5);

ALTER TABLE public.workflow_steps
ADD COLUMN IF NOT EXISTS send_window_end VARCHAR(5);

COMMENT ON COLUMN public.workflow_steps.send_window_start IS 'Start of send window, HH:MM (e.g. 09:00)';
COMMENT ON COLUMN public.workflow_steps.send_window_end IS 'End of send window, HH:MM (e.g. 17:00)';
