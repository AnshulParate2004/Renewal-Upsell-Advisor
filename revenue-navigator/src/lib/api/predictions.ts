import { fetchApi } from './client';

export const predictionsApi = {
    getAll: async (request?: any) => {
        // There isn't a direct equivalent to getting all predictions for a list without an ID or payload, 
        // keeping signature backward compatible but throwing error directly or returning empty 
        return [];
    },
    getById: async (id: string) => {
        return null;
    },
    create: async (data: any) => {
        return null;
    },
    update: async (id: string, data: any) => {
        return null;
    },
    delete: async (id: string) => {
        return null;
    },
    predict: async (data: any) => {
        return fetchApi('/predictions/predict', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
