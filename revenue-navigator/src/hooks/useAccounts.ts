/**
 * React Query hooks for Accounts
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '@/lib/api/accounts';
import { useRevenue } from '@/contexts/RevenueContext';
import { filterAccountsByRevenueType, billingIntervalParam } from '@/lib/revenueUtils';
import type { Account } from '@/data/mockData';

export const useAccounts = (skip = 0, limit = 1000) => {
  const { revenueType } = useRevenue();
  const billingInterval = billingIntervalParam(revenueType);
  return useQuery({
    queryKey: ['accounts', skip, limit, billingInterval],
    queryFn: async () => {
      const raw = await accountsApi.getAll(skip, limit, billingInterval);
      return filterAccountsByRevenueType(raw, revenueType);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
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
