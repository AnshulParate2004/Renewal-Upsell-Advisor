-- seed_crowdstrike_workflows.sql
-- Seed 20-step workflow for Crowdstrike Q1-Q4

-- 1. Create Crowdstrike Templates
INSERT INTO public.workflow_templates (id, stage_name, description)
VALUES 
    (gen_random_uuid(), 'cs_q1', 'Crowdstrike Q1 Security Posture Review'),
    (gen_random_uuid(), 'cs_q2', 'Crowdstrike Q2 Threat Assessment'),
    (gen_random_uuid(), 'cs_q3', 'Crowdstrike Q3 Value & Expansion'),
    (gen_random_uuid(), 'cs_q4', 'Crowdstrike Q4 Renewal Finalization')
ON CONFLICT (stage_name) DO NOTHING;

DO $$
DECLARE
    v_cs_q1 UUID;
    v_cs_q2 UUID;
    v_cs_q3 UUID;
    v_cs_q4 UUID;
BEGIN
    SELECT id INTO v_cs_q1 FROM public.workflow_templates WHERE stage_name = 'cs_q1';
    SELECT id INTO v_cs_q2 FROM public.workflow_templates WHERE stage_name = 'cs_q2';
    SELECT id INTO v_cs_q3 FROM public.workflow_templates WHERE stage_name = 'cs_q3';
    SELECT id INTO v_cs_q4 FROM public.workflow_templates WHERE stage_name = 'cs_q4';

    DELETE FROM public.workflow_steps 
    WHERE template_id IN (v_cs_q1, v_cs_q2, v_cs_q3, v_cs_q4);

    -- Q1 Steps (5 steps)
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cs_q1, 1, 'Q1 Welcome & Security Baseline', 'Day 15', 15, 'email', 'Welcome and initial security baseline setup instructions.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q1, 2, 'Q1 Onboarding Call', 'Day 30', 30, 'call', 'Walkthrough of the platform and checking initial deployment success.', 'monthly', '10:00', '16:00', 5, true),
    (v_cs_q1, 3, 'Q1 Admin Training Reminder', 'Day 45', 45, 'whatsapp', 'Reminder to complete Crowdstrike admin training modules.', 'weekly', '09:00', '17:00', 2, true),
    (v_cs_q1, 4, 'Q1 Threat Detection Report', 'Day 60', 60, 'email', 'Monthly threat detection summary report.', 'monthly', '09:00', '17:00', 3, true),
    (v_cs_q1, 5, 'Q1 Executive Health Check', 'Day 80', 80, 'call', 'High-level check-in with the CISO or security lead on platform value.', 'monthly', '10:00', '15:00', 5, true);

    -- Q2 Steps (5 steps)
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cs_q2, 1, 'Q2 Feature Adoption Email', 'Day 100', 30, 'email', 'Tips on adopting advanced endpoint protection features.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q2, 2, 'Q2 Security Posture Call', 'Day 120', 60, 'call', 'Review of current security posture and open vulnerabilities.', 'monthly', '10:00', '16:00', 5, true),
    (v_cs_q2, 3, 'Q2 Mid-Year Threat Landscape', 'Day 140', 80, 'email', 'Industry-specific threat landscape report.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q2, 4, 'Q2 Product Update Webinar', 'Day 160', 100, 'whatsapp', 'Invitation to the latest product release webinar.', 'weekly', '09:00', '17:00', 2, true),
    (v_cs_q2, 5, 'Q2 Technical Account Manager Check-in', 'Day 175', 115, 'call', 'Technical deep dive with TAM to optimize configuration.', 'monthly', '10:00', '16:00', 5, true);

    -- Q3 Steps (5 steps)
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cs_q3, 1, 'Q3 Expansion Opportunity Email', 'Day 190', 30, 'email', 'Introducing cloud security and identity protection modules.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q3, 2, 'Q3 Renewal Prep Call', 'Day 210', 60, 'call', 'Early discussion on renewal timeline and budget allocation.', 'monthly', '10:00', '16:00', 5, true),
    (v_cs_q3, 3, 'Q3 ROI Assessment', 'Day 230', 80, 'email', 'Sharing the ROI assessment and incident response metrics.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q3, 4, 'Q3 Customer Success Survey', 'Day 250', 100, 'whatsapp', 'Quick survey on satisfaction with Crowdstrike support.', 'weekly', '09:00', '17:00', 2, true),
    (v_cs_q3, 5, 'Q3 Exec Alignment Call', 'Day 265', 115, 'call', 'Alignment with executive sponsor to ensure budget is secured for renewal.', 'monthly', '10:00', '15:00', 5, true);

    -- Q4 Steps (5 steps)
    INSERT INTO public.workflow_steps 
    (template_id, step_order, title, time_label, days_offset, action_type, topic, frequency, send_window_start, send_window_end, follow_up_offset_days, is_active)
    VALUES 
    (v_cs_q4, 1, 'Q4 Renewal Proposal Sent', 'Day 280', 30, 'email', 'Official renewal proposal and contract sent for review.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q4, 2, 'Q4 Contract Negotiation Call', 'Day 300', 60, 'call', 'Call to address any questions on the contract and finalize terms.', 'weekly', '10:00', '16:00', 5, true),
    (v_cs_q4, 3, 'Q4 Procurement Follow-up', 'Day 320', 80, 'email', 'Follow-up with procurement to ensure timely processing.', 'weekly', '09:00', '17:00', 3, true),
    (v_cs_q4, 4, 'Q4 Urgent Renewal Reminder', 'Day 340', 100, 'whatsapp', 'Urgent reminder regarding impending contract expiration.', 'daily', '09:00', '17:00', 1, true),
    (v_cs_q4, 5, 'Q4 Final Sign-off Call', 'Day 350', 110, 'call', 'Final confirmation call to ensure signature and continuity of service.', 'daily', '10:00', '16:00', 2, true);

END $$;
