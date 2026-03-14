import { fetchApi } from './client';

export const mlApi = {
    getAll: async () => null,
    getById: async (id: string) => null,
    create: async (data: any) => null,
    update: async (id: string, data: any) => null,
    delete: async (id: string) => null,
};

export const triggerMlPipeline = async (data?: any) => {
    return fetchApi('/ml/trigger', {
        method: 'POST',
        body: JSON.stringify(data || {})
    });
};
