import { fetchApi } from './client';

const mapOpportunity = (opp: any) => {
    if (!opp) return opp;
    return {
        ...opp,
        accountId: opp.account_id,
        accountName: opp.account_name,
        createdDate: opp.created_date || opp.created_at,
        createdAt: opp.created_at,
        updatedAt: opp.updated_at,
        recommendedProducts: opp.recommended_products,
    };
};

export const opportunitiesApi = {
    getAll: async (skip: number = 0, limit: number = 100) => {
        const data = await fetchApi(`/opportunities/?skip=${skip}&limit=${limit}`);
        return Array.isArray(data) ? data.map(mapOpportunity) : data;
    },
    getById: async (id: string) => {
        const data = await fetchApi(`/opportunities/${id}`);
        return mapOpportunity(data);
    },
    create: async (data: any) => {
        return fetchApi(`/opportunities/`, {
            method: 'POST',
            body: JSON.stringify({
                ...data,
                account_id: data.accountId,
            }),
        });
    },
    update: async (id: string, data: any) => {
        return fetchApi(`/opportunities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    delete: async (id: string) => {
        return fetchApi(`/opportunities/${id}`, {
            method: 'DELETE',
        });
    },
};
