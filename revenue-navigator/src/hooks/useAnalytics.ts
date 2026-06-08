/**
 * React Query hooks for Analytics
 */
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { useRevenue } from '@/contexts/RevenueContext';
import { billingIntervalParam } from '@/lib/revenueUtils';

export const useDashboardStats = () => {
  const { revenueType } = useRevenue();
  const billingInterval = billingIntervalParam(revenueType);

  return useQuery({
    queryKey: ['dashboard-stats', billingInterval],
    queryFn: () => analyticsApi.getDashboardStats(billingInterval),
    staleTime: 60000,
    refetchInterval: 120000,
  });
};

export const usePortfolioAnalytics = () => {
  const { revenueType } = useRevenue();
  const billingInterval = billingIntervalParam(revenueType);

  return useQuery({
    queryKey: ['portfolio-analytics', billingInterval],
    queryFn: () => analyticsApi.getPortfolioAnalytics(billingInterval),
    staleTime: 60000,
    refetchInterval: 120000,
  });
};

export const useAnalyticsTrends = (months = 12) => {
  const { revenueType } = useRevenue();
  const billingInterval = billingIntervalParam(revenueType);

  return useQuery({
    queryKey: ['analytics-trends', billingInterval, months],
    queryFn: () => analyticsApi.getAnalyticsTrends(billingInterval, months),
    staleTime: 60000,
    refetchInterval: 120000,
  });
};
