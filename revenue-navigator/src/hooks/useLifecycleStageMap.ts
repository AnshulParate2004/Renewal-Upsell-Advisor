import { useMemo } from "react";
import type { Account } from "@/data/mockData";
import type { LifecycleStageId } from "@/types/lifecycle";
import { useLifecycleDashboard } from "@/hooks/useLifecycleDashboard";

export type AccountLifecycleStage = {
  stage: LifecycleStageId;
  stageLabel: string;
};

export function useLifecycleStageMap(accounts: Account[]) {
  const { data, isLoading } = useLifecycleDashboard(accounts);

  const stageByAccountId = useMemo(() => {
    const map = new Map<string, AccountLifecycleStage>();
    data?.accountAlerts.forEach((alert) => {
      map.set(alert.account.id, {
        stage: alert.stage,
        stageLabel: alert.stageLabel,
      });
    });
    return map;
  }, [data?.accountAlerts]);

  return { stageByAccountId, isLoading };
}
