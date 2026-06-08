import { fetchApi } from "./client";
import type { Account } from "@/data/mockData";
import type {
  LifecycleAlert,
  LifecycleDashboardData,
  LifecycleStageId,
  NextBestAction,
  AgentRecommendation,
  ActionRecommendation,
  ProductConsumption,
  RecommendedChannel,
} from "@/types/lifecycle";
import { getVendorId } from "@/lib/vendorProducts";

interface ApiProductConsumption {
  product_id: string;
  name: string;
  purchased: boolean;
  deployed: boolean;
  current_pct: number;
  target_pct: number;
}

interface ApiLifecycleAlert {
  account_id: string;
  account_name?: string;
  stage: LifecycleStageId;
  stage_label: string;
  priority: number;
  health_status: string;
  score: number;
  why_now: string;
  consumption: ApiProductConsumption[];
  contract_month: number;
  contract_total_months: number;
  recommended_channel?: string;
  recommended_channel_label?: string;
  recommended_action?: string;
  channel_reason?: string;
  due_hint?: string;
  history_insights?: string[];
}

interface ApiDashboardResponse {
  stage_alerts: ApiLifecycleAlert[];
  account_alerts: ApiLifecycleAlert[];
  nba_items: {
    id: string;
    account_id: string;
    account_name?: string;
    stage: LifecycleStageId;
    stage_label: string;
    action: string;
    priority: number;
    due_hint: string;
  }[];
  selected_alert: ApiLifecycleAlert | null;
  agent_recommendation: {
    actions: string[];
    assets: { label: string; type: "guide" | "kit" | "template" }[];
    data_insight: string;
  } | null;
  portfolio_consumption: {
    avg_deployment_pct: number;
    products_at_risk: number;
    unused_entitlements: number;
    accounts_needing_action: number;
  };
  stage_counts: Record<string, number>;
}

interface ApiActionRecommendation {
  channel: RecommendedChannel;
  channel_label: string;
  action: string;
  why_now: string;
  channel_reason: string;
  stage: LifecycleStageId;
  stage_label: string;
  due_hint: string;
  history_insights?: string[];
}

function mapConsumption(items: ApiProductConsumption[]): ProductConsumption[] {
  return items.map((p) => ({
    productId: p.product_id,
    name: p.name,
    purchased: p.purchased,
    deployed: p.deployed,
    currentPct: p.current_pct,
    targetPct: p.target_pct,
  }));
}

function mapAlert(raw: ApiLifecycleAlert, accountsById: Map<string, Account>): LifecycleAlert {
  const account =
    accountsById.get(raw.account_id) ??
    ({
      id: raw.account_id,
      name: raw.account_name ?? "Unknown",
      industry: "",
      arr: 0,
      healthScore: 0,
      riskScore: 0,
      utilization: 0,
      renewalDate: "",
      renewalStage: "q1",
      csm: "",
      lastContact: "",
      contractStart: "",
      sentiment: "neutral",
      sentimentScore: 0,
      relationshipScore: 0,
      churnProbability: 0,
      licensesUsed: 0,
      licensesTotal: 0,
    } as Account);

  return {
    account,
    stage: raw.stage,
    stageLabel: raw.stage_label,
    priority: raw.priority,
    healthStatus: raw.health_status as LifecycleAlert["healthStatus"],
    score: raw.score,
    whyNow: raw.why_now,
    consumption: mapConsumption(raw.consumption),
    contractMonth: raw.contract_month,
    contractTotalMonths: raw.contract_total_months,
  };
}

function mapNbaItems(items: ApiDashboardResponse["nba_items"]): NextBestAction[] {
  return items.map((item) => ({
    id: item.id,
    accountId: item.account_id,
    accountName: item.account_name ?? "",
    stage: item.stage,
    stageLabel: item.stage_label,
    action: item.action,
    priority: item.priority,
    dueHint: item.due_hint,
  }));
}

function mapAgentRecommendation(
  raw: ApiDashboardResponse["agent_recommendation"]
): AgentRecommendation | null {
  if (!raw) return null;
  return {
    actions: raw.actions,
    assets: raw.assets,
    dataInsight: raw.data_insight,
  };
}

function computePortfolioFromAlerts(alerts: LifecycleAlert[]) {
  const purchased = alerts.flatMap((a) => a.consumption).filter((p) => p.purchased);
  const avgDeploymentPct = purchased.length
    ? Math.round(purchased.reduce((sum, p) => sum + p.currentPct, 0) / purchased.length)
    : 0;

  return {
    avgDeploymentPct,
    productsAtRisk: purchased.filter((p) => p.currentPct < p.targetPct * 0.6).length,
    unusedEntitlements: purchased.filter((p) => !p.deployed).length,
    accountsNeedingAction: alerts.filter(
      (a) => a.stage !== "expand" || a.healthStatus !== "Excellent"
    ).length,
  };
}

function computeStageCounts(alerts: LifecycleAlert[]): Record<string, number> {
  const counts: Record<string, number> = {
    all: alerts.length,
    protect: 0,
    renew: 0,
    adopt: 0,
    expand: 0,
    activate: 0,
  };
  alerts.forEach((a) => {
    counts[a.stage] = (counts[a.stage] ?? 0) + 1;
  });
  return counts;
}

function scopeRawDashboard(raw: ApiDashboardResponse, accountIds: Set<string>): ApiDashboardResponse {
  if (accountIds.size === 0) return raw;

  const accountAlerts = raw.account_alerts.filter((a) => accountIds.has(a.account_id));
  const stageIds = new Set(["protect", "renew", "adopt", "expand", "activate"] as const);
  const stageAlerts = raw.stage_alerts.filter(
    (a) => accountIds.has(a.account_id) && stageIds.has(a.stage)
  );
  const nbaItems = raw.nba_items.filter((item) => accountIds.has(item.account_id));

  const selectedAlert =
    accountAlerts.find((a) => a.stage === "adopt") ??
    accountAlerts.find((a) => a.stage === "protect") ??
    accountAlerts[0] ??
    null;

  const purchased = accountAlerts.flatMap((a) =>
    (a.consumption ?? []).filter((p) => p.purchased)
  );
  const avgDeployment = purchased.length
    ? Math.round(purchased.reduce((sum, p) => sum + p.current_pct, 0) / purchased.length)
    : 0;

  const stageCounts: Record<string, number> = {
    all: accountAlerts.length,
    protect: 0,
    renew: 0,
    adopt: 0,
    expand: 0,
    activate: 0,
  };
  accountAlerts.forEach((a) => {
    stageCounts[a.stage] = (stageCounts[a.stage] ?? 0) + 1;
  });

  return {
    ...raw,
    account_alerts: accountAlerts,
    stage_alerts: stageAlerts,
    nba_items: nbaItems,
    selected_alert: selectedAlert,
    portfolio_consumption: {
      avg_deployment_pct: avgDeployment,
      products_at_risk: purchased.filter((p) => p.current_pct < p.target_pct * 0.6).length,
      unused_entitlements: purchased.filter((p) => !p.deployed).length,
      accounts_needing_action: accountAlerts.filter(
        (a) => a.stage !== "expand" || a.health_status !== "Excellent"
      ).length,
    },
    stage_counts: stageCounts,
  };
}

function mapDashboard(raw: ApiDashboardResponse, accounts: Account[]): LifecycleDashboardData & {
  stageCounts: Record<string, number>;
  accountAlerts: LifecycleAlert[];
} {
  const accountIds = new Set(accounts.map((a) => a.id));
  const scopedRaw = scopeRawDashboard(raw, accountIds);
  const accountsById = new Map(accounts.map((a) => [a.id, a]));

  const accountAlerts = scopedRaw.account_alerts.map((a) => mapAlert(a, accountsById));

  return {
    stageAlerts: scopedRaw.stage_alerts.map((a) => mapAlert(a, accountsById)),
    accountAlerts,
    nbaItems: mapNbaItems(scopedRaw.nba_items),
    selectedAlert: scopedRaw.selected_alert
      ? mapAlert(scopedRaw.selected_alert, accountsById)
      : null,
    agentRecommendation: mapAgentRecommendation(scopedRaw.agent_recommendation),
    portfolioConsumption: computePortfolioFromAlerts(accountAlerts),
    stageCounts: computeStageCounts(accountAlerts),
  };
}

function mapActionRecommendation(raw: ApiActionRecommendation): ActionRecommendation {
  return {
    channel: raw.channel,
    channelLabel: raw.channel_label,
    action: raw.action,
    whyNow: raw.why_now,
    channelReason: raw.channel_reason,
    stage: raw.stage,
    stageLabel: raw.stage_label,
    dueHint: raw.due_hint,
  };
}

export const lifecycleApi = {
  fetchDashboardRaw: async (
    billingInterval?: "monthly" | "annual"
  ): Promise<ApiDashboardResponse> => {
    const vendor = getVendorId();
    const params = new URLSearchParams({ vendor });
    if (billingInterval) params.set("billing_interval", billingInterval);
    return (await fetchApi(`/lifecycle/dashboard?${params}`)) as ApiDashboardResponse;
  },

  mapDashboard,

  getDashboard: async (
    accounts: Account[],
    billingInterval?: "monthly" | "annual"
  ): Promise<LifecycleDashboardData & { stageCounts: Record<string, number>; accountAlerts: LifecycleAlert[] }> => {
    const raw = await lifecycleApi.fetchDashboardRaw(billingInterval);
    return mapDashboard(raw, accounts);
  },

  getAccountRecommendation: async (accountId: string): Promise<ActionRecommendation> => {
    const vendor = getVendorId();
    const raw = (await fetchApi(
      `/lifecycle/accounts/${accountId}/recommendation?vendor=${vendor}`
    )) as ApiActionRecommendation;
    return mapActionRecommendation(raw);
  },

  getAgentRecommendation: async (accountId: string): Promise<AgentRecommendation> => {
    const vendor = getVendorId();
    const raw = (await fetchApi(
      `/lifecycle/accounts/${accountId}/agent?vendor=${vendor}`
    )) as ApiDashboardResponse["agent_recommendation"];
    return mapAgentRecommendation(raw)!;
  },
};
