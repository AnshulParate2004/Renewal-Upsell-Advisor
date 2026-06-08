-- seed_q1_q4_workflows.sql
-- Seed default workflow templates and steps for Cloudflare & Aditya Birla Q1-Q4
-- Run this in Supabase SQL Editor to populate the Q1, Q2, Q3, Q4 workflow steps for each pipeline type.

-- 1. Create Cloudflare Templates
INSERT INTO public.workflow_templates (id, stage_name, description)
VALUES 
    (gen_random_uuid(), 'cf_q1', 'Cloudflare Q1 Automated Workflow'),
    (gen_random_uuid(), 'cf_q2', 'Cloudflare Q2 Automated Workflow'),
    (gen_random_uuid(), 'cf_q3', 'Cloudflare Q3 Automated Workflow'),
    (gen_random_uuid(), 'cf_q4', 'Cloudflare Q4 Automated Workflow')
ON CONFLICT (stage_name) DO NOTHING;

-- 2. Create Aditya Birla Templates
INSERT INTO public.workflow_templates (id, stage_name, description)
VALUES 
    (gen_random_uuid(), 'ab_q1', 'Aditya Birla Q1 Automated Workflow'),
    (gen_random_uuid(), 'ab_q2', 'Aditya Birla Q2 Automated Workflow'),
    (gen_random_uuid(), 'ab_q3', 'Aditya Birla Q3 Automated Workflow'),
    (gen_random_uuid(), 'ab_q4', 'Aditya Birla Q4 Automated Workflow')
ON CONFLICT (stage_name) DO NOTHING;

-- Block to safely insert steps without hardcoding UUIDs
DO $$
DECLARE
    v_cf_q1 UUID;
    v_cf_q2 UUID;
    v_cf_q3 UUID;
    v_cf_q4 UUID;
    v_ab_q1 UUID;
    v_ab_q2 UUID;
    v_ab_q3 UUID;
    v_ab_q4 UUID;
BEGIN
    -- Get template IDs
    SELECT id INTO v_cf_q1 FROM public.workflow_templates WHERE stage_name = 'cf_q1';
    SELECT id INTO v_cf_q2 FROM public.workflow_templates WHERE stage_name = 'cf_q2';
    SELECT id INTO v_cf_q3 FROM public.workflow_templates WHERE stage_name = 'cf_q3';
    SELECT id INTO v_cf_q4 FROM public.workflow_templates WHERE stage_name = 'cf_q4';

    SELECT id INTO v_ab_q1 FROM public.workflow_templates WHERE stage_name = 'ab_q1';
    SELECT id INTO v_ab_q2 FROM public.workflow_templates WHERE stage_name = 'ab_q2';
    SELECT id INTO v_ab_q3 FROM public.workflow_templates WHERE stage_name = 'ab_q3';
    SELECT id INTO v_ab_q4 FROM public.workflow_templates WHERE stage_name = 'ab_q4';

    -- Clear existing default steps for these templates so we can re-insert safely
    DELETE FROM public.workflow_steps 
    WHERE template_id IN (v_cf_q1, v_cf_q2, v_cf_q3, v_cf_q4, v_ab_q1, v_ab_q2, v_ab_q3, v_ab_q4);

    -- Insert Cloudflare Q1 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cf_q1, 1, 'Q1 Kickoff Email', 'Month 1', 30, 'email', 'Welcome to Q1. Checking on initial setup and satisfaction.', 'weekly', '09:00', '17:00', 3, true),
    (v_cf_q1, 2, 'Q1 Health Check Call', 'Month 2', 60, 'call', 'Call to discuss adoption and any early blockers.', 'monthly', '10:00', '16:00', 5, true);

    -- Insert Cloudflare Q2 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cf_q2, 1, 'Q2 Value Realization Call', 'Month 4', 30, 'call', 'Discuss feature adoption and value realized so far.', 'monthly', '10:00', '16:00', 3, true),
    (v_cf_q2, 2, 'Q2 Stakeholder Update', 'Month 5', 60, 'email', 'Send Q2 progress report and gather stakeholder feedback.', 'weekly', '09:00', '17:00', 5, true);

    -- Insert Cloudflare Q3 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cf_q3, 1, 'Q3 Renewal Prep Email', 'Month 7', 30, 'email', 'Early renewal warning and budget cycle preparation.', 'weekly', '09:00', '17:00', 5, true),
    (v_cf_q3, 2, 'Q3 Exec Sponsor Call', 'Month 8', 60, 'call', 'Align with executive sponsor on expected outcomes for renewal.', 'monthly', '09:00', '14:00', 7, true);

    -- Insert Cloudflare Q4 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cf_q4, 1, 'Q4 Contract Negotiation', 'Month 10', 30, 'call', 'Finalize terms, discuss upsell opportunities, and secure commit.', 'weekly', '10:00', '18:00', 3, true),
    (v_cf_q4, 2, 'Q4 Final Reminder', 'Month 11', 60, 'email', 'Final reminder for renewal execution and invoicing details.', 'daily', '08:00', '18:00', 2, true);


    -- Insert Aditya Birla Q1 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_ab_q1, 1, 'Initial Policy Review', 'Month 1', 30, 'email', 'Welcome Email. Providing policy document access and benefits overview.', 'weekly', '09:00', '17:00', 3, true),
    (v_ab_q1, 2, 'Claims Setup Call', 'Month 2', 60, 'call', 'Walkthrough of support channels and claims process.', 'monthly', '10:00', '16:00', 5, true);

    -- Insert Aditya Birla Q2 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_ab_q2, 1, 'Wellness Check-in', 'Month 4', 30, 'call', 'Checking in on corporate wellness program adoption.', 'monthly', '10:00', '16:00', 3, true),
    (v_ab_q2, 2, 'Benefits App Promo', 'Month 5', 60, 'whatsapp', 'Send quick link and promo for logging into the Birla Health App.', 'weekly', '09:00', '17:00', 2, true);

    -- Insert Aditya Birla Q3 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_ab_q3, 1, 'Coverage Review Call', 'Month 7', 30, 'call', 'Review current coverage and assess if any upgrades are needed.', 'monthly', '09:00', '17:00', 5, true),
    (v_ab_q3, 2, 'Claims Mid-Year Report', 'Month 8', 60, 'email', 'Share claims utilization and potential health outcomes summary.', 'weekly', '09:00', '17:00', 3, true);

    -- Insert Aditya Birla Q4 Steps
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_ab_q4, 1, 'Renewal Notice Update', 'Month 10', 30, 'whatsapp', 'Send a quick WhatsApp reminder that the renewal window has opened.', 'weekly', '09:00', '18:00', 2, true),
    (v_ab_q4, 2, 'Final Sign-off Call', 'Month 11', 60, 'call', 'Call HR or Administrator to finalize plan premiums and sign-off.', 'weekly', '10:00', '16:00', 3, true);

END $$;
