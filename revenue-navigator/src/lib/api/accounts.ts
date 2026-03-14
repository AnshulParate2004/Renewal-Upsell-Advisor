import { fetchApi } from './client';
import type { Account, AccountActivity } from '@/data/mockData';

/** Map API (snake_case) account to frontend (camelCase) Account shape */
function mapAccountFromApi(row: Record<string, unknown>): Account {
  const sentCat = (row.sentiment_category as string) || '';
  const sentiment = sentCat.toLowerCase().includes('positive')
    ? 'positive'
    : sentCat.toLowerCase().includes('negative')
      ? 'negative'
      : 'neutral';
  return {
    id: (row.id as string) ?? '',
    name: (row.name as string) ?? '',
    arr: row.arr != null && row.arr !== '' ? Number(row.arr) : undefined,
    mrr: (row.monthly_wise_instalment ?? row.mrr) != null && (row.monthly_wise_instalment ?? row.mrr) !== '' ? Number(row.monthly_wise_instalment ?? row.mrr) : undefined,
    billingInterval: (row.billing_interval === 'monthly' || row.billing_interval === 'annual') ? row.billing_interval : undefined,
    healthScore: Number(row.health_score) ?? 0,
    riskScore: Number(row.risk_score) ?? 0,
    relationshipScore: Number(row.relationship_score) ?? 0,
    churnProbability: Number(row.churn_probability) ?? 0,
    sentimentScore: Number(row.sentiment_score) ?? 0,
    sentiment,
    utilization: Number(row.utilization_percentage) ?? 0,
    licensesUsed: Number(row.licenses_used) ?? 0,
    licensesTotal: Number(row.licenses_total) ?? 0,
    renewalDate: (row.renewal_date as string) ?? '',
    renewalStage: (row.renewal_stage as any) ?? 'q1',
    industry: (row.industry as string) ?? '',
    company_size: row.company_size as string | undefined,
    csm: (row.csm_name as string) ?? '',
    partnerName: row.partner_name as string | undefined,
    lastContact: (row.last_contact_date as string) ?? '',
    contractStart: (row.contract_start_date as string) ?? '',
    contractEnd: row.contract_end_date as string | undefined,
    status: row.status as string | undefined,
    contactName: row.primary_contact_name as string | undefined,
    contactEmail: row.primary_contact_email as string | undefined,
    contactPhone: row.primary_contact_phone as string | undefined,
    contactCity: row.primary_contact_city as string | undefined,
    contactState: row.primary_contact_state as string | undefined,
  };
}

/** Map frontend Account (camelCase) to API payload (snake_case) for create/update */
function mapAccountToApi(account: Partial<Account>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (account.name !== undefined) out.name = account.name;
  if (account.arr !== undefined) out.arr = account.arr === null ? null : account.arr;
  if (account.mrr !== undefined) out.monthly_wise_instalment = account.mrr === null ? null : account.mrr;
  if (account.billingInterval !== undefined) out.billing_interval = account.billingInterval || null;
  if (account.healthScore !== undefined) out.health_score = account.healthScore;
  if (account.riskScore !== undefined) out.risk_score = account.riskScore;
  if (account.relationshipScore !== undefined) out.relationship_score = account.relationshipScore;
  if (account.churnProbability !== undefined) out.churn_probability = account.churnProbability;
  if (account.sentimentScore !== undefined) out.sentiment_score = account.sentimentScore;
  if (account.utilization !== undefined) out.utilization_percentage = account.utilization;
  if (account.licensesUsed !== undefined) out.licenses_used = account.licensesUsed;
  if (account.licensesTotal !== undefined) out.licenses_total = account.licensesTotal;
  if (account.renewalDate !== undefined) out.renewal_date = account.renewalDate;
  if (account.renewalStage !== undefined) out.renewal_stage = account.renewalStage;
  if (account.industry !== undefined) out.industry = account.industry;
  if (account.company_size !== undefined) out.company_size = account.company_size;
  if (account.csm !== undefined) out.csm_name = account.csm;
  if (account.partnerName !== undefined) out.partner_name = account.partnerName;
  if (account.lastContact !== undefined) out.last_contact_date = account.lastContact;
  if (account.contractStart !== undefined) out.contract_start_date = account.contractStart;
  if (account.contractEnd !== undefined) out.contract_end_date = account.contractEnd;
  if (account.status !== undefined) out.status = account.status;
  if (account.contactName !== undefined) out.primary_contact_name = account.contactName;
  if (account.contactEmail !== undefined) out.primary_contact_email = account.contactEmail;
  if (account.contactPhone !== undefined) out.primary_contact_phone = account.contactPhone;
  if (account.contactCity !== undefined) out.primary_contact_city = account.contactCity;
  if (account.contactState !== undefined) out.primary_contact_state = account.contactState;
  return out;
}

export const accountsApi = {
  getAll: async (skip = 0, limit = 1000, billingInterval?: 'monthly' | 'annual' | null): Promise<Account[]> => {
    const params = new URLSearchParams();
    params.set('skip', String(skip));
    params.set('limit', String(limit));
    if (billingInterval) params.set('billing_interval', billingInterval);
    const data = await fetchApi(`/accounts/?${params.toString()}`);
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row: Record<string, unknown>) => mapAccountFromApi(row));
  },

  getById: async (id: string): Promise<Account> => {
    const row = await fetchApi(`/accounts/${id}`);
    if (!row || typeof row !== 'object') throw new Error('Account not found');
    return mapAccountFromApi(row as Record<string, unknown>);
  },

  getTimeline: async (accountId: string): Promise<AccountActivity[]> => {
    const data = await fetchApi(`/accounts/${accountId}/timeline`);
    if (!Array.isArray(data)) return [];
    return data as AccountActivity[];
  },

  create: async (account: Partial<Account>): Promise<Account> => {
    const payload = mapAccountToApi(account);
    const row = await fetchApi('/accounts/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!row || typeof row !== 'object') throw new Error('Failed to create account');
    return mapAccountFromApi(row as Record<string, unknown>);
  },

  update: async (id: string, account: Partial<Account>): Promise<Account> => {
    const payload = mapAccountToApi(account);
    const row = await fetchApi(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!row || typeof row !== 'object') throw new Error('Failed to update account');
    return mapAccountFromApi(row as Record<string, unknown>);
  },

  delete: async (id: string): Promise<void> => {
    await fetchApi(`/accounts/${id}`, { method: 'DELETE' });
  },
  
  bulkUpdate: async (data: { primary_contact_phone?: string; primary_contact_email?: string }): Promise<{ updated_count: number }> => {
    return await fetchApi('/accounts/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
