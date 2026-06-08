import { useQuery } from "@tanstack/react-query";
import { accountsApi } from "@/lib/api/accounts";

export function useAccountTicketStats(accountId: string) {
  return useQuery({
    queryKey: ["ticket-stats", accountId],
    queryFn: () => accountsApi.getTicketStats(accountId),
    enabled: Boolean(accountId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useBulkTicketStats(enabled = true) {
  return useQuery({
    queryKey: ["ticket-stats", "bulk"],
    queryFn: () => accountsApi.getBulkTicketStats(),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
