import { fetchApi } from './client';

export const analyticsApi = {
    getDashboardStats: async () => {
        return fetchApi('/analytics/dashboard');
    },
    getById: async (id: string) => null,
    create: async (data: any) => null,
    update: async (id: string, data: any) => null,
    delete: async (id: string) => null,
};
