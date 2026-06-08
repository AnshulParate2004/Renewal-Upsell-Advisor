import type { Account } from "@/data/mockData";

export type LifecycleStageId = "protect" | "renew" | "adopt" | "expand" | "activate";

export type HealthStatus = "At Risk" | "Watch" | "Good" | "Excellent" | "New Account";

export interface ProductConsumption {
  productId: string;
  name: string;
  purchased: boolean;
  deployed: boolean;
  currentPct: number;
  targetPct: number;
}

export interface LifecycleStageConfig {
  id: LifecycleStageId;
  label: string;
  priority: number;
  accentClass: string;
  borderClass: string;
  badgeClass: string;
}

export interface LifecycleAlert {
  account: Account;
  stage: LifecycleStageId;
  stageLabel: string;
  priority: number;
  healthStatus: HealthStatus;
  score: number;
  whyNow: string;
  consumption: ProductConsumption[];
  contractMonth?: number;
  contractTotalMonths?: number;
}

export interface NextBestAction {
  id: string;
  accountId: string;
  accountName: string;
  stage: LifecycleStageId;
  stageLabel: string;
  action: string;
  priority: number;
  dueHint?: string;
}

export interface AgentRecommendation {
  actions: string[];
  assets: { label: string; type: "guide" | "kit" | "template" }[];
  dataInsight: string;
}

export interface LifecycleDashboardData {
  stageAlerts: LifecycleAlert[];
  nbaItems: NextBestAction[];
  selectedAlert: LifecycleAlert | null;
  agentRecommendation: AgentRecommendation | null;
  portfolioConsumption: {
    avgDeploymentPct: number;
    productsAtRisk: number;
    unusedEntitlements: number;
    accountsNeedingAction: number;
  };
}

export type RecommendedChannel = "call" | "message" | "email";

export interface ActionRecommendation {
  channel: RecommendedChannel;
  channelLabel: string;
  action: string;
  whyNow: string;
  channelReason: string;
  stage: LifecycleStageId;
  stageLabel: string;
  dueHint: string;
}
