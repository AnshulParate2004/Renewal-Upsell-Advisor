import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Account } from "@/data/mockData";
import { lifecycleApi } from "@/lib/api/lifecycle";
import { getVendorId } from "@/lib/vendorProducts";
import type { LifecycleDashboardData, LifecycleAlert } from "@/types/lifecycle";
import { useRevenue } from "@/contexts/RevenueContext";
import { billingIntervalParam } from "@/lib/revenueUtils";

export type LifecycleDashboardResult = LifecycleDashboardData & {
  stageCounts: Record<string, number>;
  accountAlerts: LifecycleAlert[];
};

export function useLifecycleDashboard(accounts: Account[]) {
  const { revenueType } = useRevenue();
  const billingInterval = billingIntervalParam(revenueType);
  const vendor = getVendorId();

  const rawQuery = useQuery({
    queryKey: ["lifecycle-dashboard", billingInterval, vendor],
    queryFn: () => lifecycleApi.fetchDashboardRaw(billingInterval),
    staleTime: 60_000,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  const data = useMemo((): LifecycleDashboardResult | undefined => {
    if (!rawQuery.data) return undefined;
    return lifecycleApi.mapDashboard(rawQuery.data, accounts);
  }, [rawQuery.data, accounts, accounts.length]);

  return {
    ...rawQuery,
    data,
  };
}
