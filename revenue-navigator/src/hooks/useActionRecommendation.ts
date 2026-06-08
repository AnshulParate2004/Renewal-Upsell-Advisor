import { useQuery } from "@tanstack/react-query";
import { lifecycleApi } from "@/lib/api/lifecycle";
import type { ActionRecommendation } from "@/types/lifecycle";

export function useActionRecommendation(accountId: string) {
  return useQuery({
    queryKey: ["action-recommendation", accountId],
    queryFn: () => lifecycleApi.getAccountRecommendation(accountId),
    enabled: Boolean(accountId),
    staleTime: 30_000,
    retry: 1,
  });
}

export type { ActionRecommendation };
