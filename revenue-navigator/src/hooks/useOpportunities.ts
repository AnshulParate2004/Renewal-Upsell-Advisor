/**
 * React Query hooks for Opportunities
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opportunitiesApi } from '@/lib/api/opportunities';

export const useOpportunities = (skip = 0, limit = 100) => {
  return useQuery({
    queryKey: ['opportunities', skip, limit],
    queryFn: () => opportunitiesApi.getAll(skip, limit),
    staleTime: 30000,
  });
};

export const useOpportunity = (id: string) => {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => opportunitiesApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateOpportunity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: opportunitiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
    },
  });
};

export const useUpdateOpportunity = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      opportunitiesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity', variables.id] });
    },
  });
};
