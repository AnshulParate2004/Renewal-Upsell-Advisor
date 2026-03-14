import { fetchApi } from './client';

export const emailApi = {
    // Legacy generic methods
    getAll: async () => fetchApi('/email/'),
    getById: async (id: string) => fetchApi(`/email/${id}`),
    create: async (data: any) => null,
    update: async (id: string, data: any) => null,
    delete: async (id: string) => null,
    send: async (data: any) => fetchApi('/email/send', { method: 'POST', body: JSON.stringify(data) }),

    // Actual Email endpoints mapped to backend
    sendTest: async (toEmail: string) => fetchApi(`/email/send-test?to_email=${encodeURIComponent(toEmail)}`, { method: 'POST' }),
    triggerCampaign: async (purpose?: string) =>
        fetchApi('/email/trigger-campaign', {
            method: 'POST',
            body: purpose && purpose.trim() ? JSON.stringify({ purpose: purpose.trim() }) : undefined,
        }),
    getPreview: async (accountId: string, purpose?: string) => {
        const params = new URLSearchParams({ account_id: accountId });
        if (purpose && purpose.trim()) params.set('purpose', purpose.trim());
        return fetchApi(`/email/preview?${params.toString()}`, { method: 'GET' });
    },

    sendToAccount: async (accountId: string, data?: { subject?: string; html_body?: string; text_body?: string; purpose?: string }) => {
        return fetchApi('/email/send-to-account', {
            method: 'POST',
            body: JSON.stringify({
                account_id: accountId,
                ...data
            })
        });
    },

    getStatus: async () => fetchApi('/email/status', { method: 'GET' })
};
