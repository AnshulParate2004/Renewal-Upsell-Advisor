import { fetchApi } from './client';

export interface AccountComment {
  id: string;
  account_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const accountCommentsApi = {
  getByAccountId: async (accountId: string): Promise<AccountComment[]> => {
    const data = await fetchApi(`/accounts/${accountId}/comments`);
    return Array.isArray(data) ? data : [];
  },

  create: async (accountId: string, body: string, createdBy?: string): Promise<AccountComment> => {
    return fetchApi(`/accounts/${accountId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, created_by: createdBy }),
    });
  },
};
