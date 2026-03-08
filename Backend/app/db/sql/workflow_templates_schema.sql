-- Workflow templates and steps (for Workflows feature).
-- Run this in Supabase SQL Editor.

-- Templates: e.g. "Q1 Renewal", "Onboarding"
CREATE TABLE IF NOT EXISTS public.workflow_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Steps: each step belongs to a template (order, title, action type, etc.)
CREATE TABLE IF NOT EXISTS public.workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    time_label VARCHAR(50),
    days_offset INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    topic TEXT,
    frequency VARCHAR(20) DEFAULT 'weekly',
    send_window_start VARCHAR(5),
    send_window_end VARCHAR(5),
    follow_up_offset_days INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Optional: index for listing steps by template (used by API select "*, steps:workflow_steps(*)")
CREATE INDEX IF NOT EXISTS idx_workflow_steps_template_id ON public.workflow_steps(template_id);
