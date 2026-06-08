import { useQuery } from "@tanstack/react-query";
import { lifecycleApi } from "@/lib/api/lifecycle";

export function useAgentRecommendation(accountId: string | null) {
  return useQuery({
    queryKey: ["agent-recommendation", accountId],
    queryFn: () => lifecycleApi.getAgentRecommendation(accountId!),
    enabled: Boolean(accountId),
    staleTime: 60_000,
  });
}
