/**
 * React Query hooks for Accounts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { useRevenue } from '@/contexts/RevenueContext';
import type { Account } from '@/data/mockData';

/** Filter strictly by revenue field: arr present => annual; mrr present (and no arr) => monthly. */
export const useAccounts = (skip = 0, limit = 1000) => {
  const { revenueType } = useRevenue();
  const billingInterval = revenueType === 'MRR' ? 'monthly' : 'annual';
  return useQuery({
    queryKey: ['accounts', skip, limit, billingInterval],
    queryFn: async () => {
      const raw = await accountsApi.getAll(skip, limit, billingInterval);
      const hasArr = (a: Account) => (a.arr ?? 0) > 0;
      const hasMrr = (a: Account) => (a.mrr ?? 0) > 0;
      const isStrictlyAnnual = (a: Account) => hasArr(a);
      const isStrictlyMonthly = (a: Account) => hasMrr(a) && !hasArr(a);
      return revenueType === 'MRR'
        ? raw.filter(isStrictlyMonthly)
        : raw.filter(isStrictlyAnnual);
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

export const useAccount = (id: string) => {
  return useQuery({
    queryKey: ['account', id],
    queryFn: () => accountsApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: accountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Account> }) =>
      accountsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', variables.id] });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
