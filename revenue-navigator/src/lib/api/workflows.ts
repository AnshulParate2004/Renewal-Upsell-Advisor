import { fetchApi } from './client';

export type StepFrequency = "daily" | "weekly" | "monthly";

export interface WorkflowStep {
    id?: string;
    step_order: number;
    title: string;
    time_label?: string;
    days_offset: number;
    action_type: "email" | "call" | "task";
    topic?: string;
    frequency?: StepFrequency;
    send_window_start?: string;  // "HH:MM" when to start sending
    send_window_end?: string;    // "HH:MM" when to stop sending
    follow_up_offset_days?: number;  // Days after this touchpoint to queue next call/email
    is_active: boolean;
    template_id?: string;
}

export interface WorkflowTemplate {
    id: string;
    stage_name: string;
    description?: string;
    steps?: WorkflowStep[];
}

export const workflowsApi = {
    getTemplates: async () => {
        return fetchApi('/workflows/templates');
    },

    createTemplate: async (data: Partial<WorkflowTemplate>) => {
        return fetchApi('/workflows/templates', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateTemplate: async (templateId: string, data: Partial<WorkflowTemplate>) => {
        return fetchApi(`/workflows/templates/${templateId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    createStep: async (data: Partial<WorkflowStep>) => {
        return fetchApi('/workflows/steps', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateStep: async (stepId: string, data: Partial<WorkflowStep>) => {
        return fetchApi(`/workflows/steps/${stepId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteStep: async (stepId: string) => {
        return fetchApi(`/workflows/steps/${stepId}`, {
            method: 'DELETE',
        });
    }
};
