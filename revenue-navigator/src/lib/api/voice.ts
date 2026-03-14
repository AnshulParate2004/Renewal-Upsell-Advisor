import { fetchApi } from './client';

export interface VoiceCallRow {
    id: string;
    account_id?: string;
    account_name: string;
    date: string;
    duration: string;
    duration_seconds?: number;
    status?: string;
    outcome: string;
    outcome_raw?: string;
    sentiment: string;
    retry_count: number;
}

/** Full call detail for the call detail dialog (transcript, summary, sentiment why). */
export interface VoiceCallDetail {
    id: string;
    account_id?: string;
    account_name: string;
    date: string;
    duration: string;
    duration_seconds?: number;
    outcome: string;
    transcript: string;
    summary: string;
    sentiment_category: string;
    sentiment_score?: number;
    keywords: string[];
}

export const voiceApi = {
    getAll: async () => {
        return fetchApi('/voice/calls');
    },
    /** List voice calls with pagination (skip, limit). Returns { calls, total }. */
    getCalls: async (skip: number = 0, limit: number = 100) => {
        const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
        return fetchApi(`/voice/calls?${params}`) as Promise<{ calls: VoiceCallRow[]; total: number }>;
    },
    /** Get full call detail (transcript, summary, sentiment, keywords) for the detail dialog. */
    getById: async (id: string) => {
        return fetchApi(`/voice/calls/${id}`) as Promise<VoiceCallDetail>;
    },
    create: async (data: any) => null,
    update: async (id: string, data: any) => null,
    delete: async (id: string) => null,

    // Specific voice endpoints
    triggerAll: async () => {
        return fetchApi('/voice/trigger-calls', {
            method: 'POST'
        });
    },
    triggerToAccount: async (accountId: string, purpose?: string) => {
        const body: { account_id: string; purpose?: string } = { account_id: accountId };
        if (purpose && purpose.trim()) body.purpose = purpose.trim();
        return fetchApi('/voice/trigger-call-to-account', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }
};
