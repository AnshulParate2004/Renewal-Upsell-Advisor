import { fetchApi } from './client';

/** Range filter: min/max applied together. */
export interface RangeFilterPayload {
    min?: number;
    max?: number;
}

/** Multi-filter config matching Accounts page (all applied as AND). pipelineStage = Renewal Pipeline stage (q1|q2|q3|q4|renewed). */
export interface CampaignFilterConfig {
    risk?: RangeFilterPayload;
    healthScore?: RangeFilterPayload;
    arr?: RangeFilterPayload;
    renewal?: RangeFilterPayload;
    utilization?: RangeFilterPayload;
    relationshipScore?: RangeFilterPayload;
    churn?: RangeFilterPayload;
    locationKeyword?: string;
    partnerNameKeyword?: string;
    pipelineStage?: string;
}

export interface AutoCampaign {
    id?: string;
    name: string;
    description?: string;
    target_audience_filter: string;
    filter_min_value?: number;
    filter_max_value?: number;
    filter_config?: CampaignFilterConfig;
    recurring_frequency: string;
    action_type: string;
    is_active: boolean;
    /** Campaign runs only when today is on or after this date (YYYY-MM-DD). Optional. */
    start_date?: string | null;
    /** Campaign runs only when today is on or before this date (YYYY-MM-DD). Optional. */
    end_date?: string | null;
    /** Send messages only at or after this time each day. Optional. HH:MM 24h (IST). */
    schedule_start_time?: string | null;
    /** Send messages only at or before this time each day. Optional. HH:MM 24h (IST). */
    schedule_end_time?: string | null;
    /** Days after this touchpoint to queue the next call or email. Optional. */
    follow_up_offset_days?: number | null;
    /** True if last run had errors or did not send to some accounts (show in Incomplete). Set by backend. */
    last_run_incomplete?: boolean | null;
    /** Display section from backend: 'upcoming' | 'ongoing' | 'incomplete' | 'completed'. Stored in DB. */
    status?: string | null;
}

export const campaignsApi = {
    getCampaigns: async () => {
        return fetchApi('/campaigns/');
    },

    getCampaign: async (id: string) => {
        return fetchApi(`/campaigns/${id}`);
    },

    createCampaign: async (data: Partial<AutoCampaign>) => {
        return fetchApi('/campaigns/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateCampaign: async (campaignId: string, data: Partial<AutoCampaign>) => {
        return fetchApi(`/campaigns/${campaignId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteCampaign: async (campaignId: string) => {
        return fetchApi(`/campaigns/${campaignId}`, {
            method: 'DELETE',
        });
    },

    /** Run all due campaigns now (no backend restart needed). */
    runNow: async () =>
        fetchApi('/campaigns/run-now', { method: 'POST' }),
};
