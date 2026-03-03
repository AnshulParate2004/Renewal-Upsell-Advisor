// ─── Type Definitions ───
export interface SentimentHistory {
  date: string;
  score: number; // -1 to 1
  source: 'email' | 'call' | 'support_ticket' | 'survey';
  summary?: string;
}

export interface AccountActivity {
  id: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'support_ticket' | 'contract_change' | 'usage_spike' | 'usage_drop' | 'payment';
  title: string;
  description: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface MetricsHistory {
  date: string;
  healthScore: number;
  riskScore: number;
  relationshipScore: number;
  churnProbability: number; // Historical churn predictions
  utilization: number;
  sentimentScore: number;
}

// ─── Account Data Type ───
export interface Account {
  id: string;
  name: string;
  arr: number;
  healthScore: number;
  riskScore: number;
  sentiment: "positive" | "neutral" | "negative";
  relationshipScore: number; // 0-100: Strength of relationship with account
  churnProbability: number; // 0-1: ML-predicted probability of churn
  sentimentScore: number; // -1 to 1: Numeric sentiment analysis score
  utilization: number;
  licensesUsed: number;
  licensesTotal: number;
  renewalDate: string;
  renewalStage: "t90" | "t60" | "t30" | "renewed" | "lost";
  industry: string;
  company_size?: string; // Added to match Supabase schema
  csm: string;
  lastContact: string;
  contractStart: string;
  /** Account status: active, churned, at_risk, renewed */
  status?: string;
  // Contact information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Historical data
  sentimentHistory?: SentimentHistory[];
  activityTimeline?: AccountActivity[];
  metricsHistory?: MetricsHistory[];
}

// ─── Voice Call Type ───
export interface VoiceCall {
  id: string;
  accountId: string;
  accountName: string;
  date: string;
  duration: string;
  outcome: "picked_up" | "missed" | "retry" | "voicemail";
  sentiment?: "positive" | "neutral" | "negative";
  retryCount: number;
  transcript?: string[];
}

// ─── Opportunity Type ───
export interface Opportunity {
  id: string;
  accountId: string;
  accountName: string;
  type: "upsell" | "expansion";
  value: number;
  probability: number;
  stage: "identified" | "quote_sent" | "negotiation" | "closed_won" | "closed_lost";
  createdDate: string;
}

// ─── Helper Formatters ───
export const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    // Millions: $1.4M
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    // Thousands: $200K
    return `$${Math.round(value / 1000)}K`;
  } else {
    // Less than 1K: $500
    return `$${value}`;
  }
};

export const getRiskColor = (score: number) =>
  score >= 70 ? "destructive" : score >= 40 ? "warning" : "success";

export const getHealthColor = (score: number) =>
  score >= 70 ? "success" : score >= 40 ? "warning" : "destructive";

export const getSentimentEmoji = (s: string) =>
  s === "positive" ? "😊" : s === "neutral" ? "😐" : "😟";

export const getDaysUntil = (date: string) => {
  const diff = new Date(date).getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/** Days since a date (e.g. contract start). Positive = past, negative = future. */
export function getDaysSinceStart(date: string): number {
  const diff = new Date().getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Pipeline stage: plan % (0–30% T-30, 30–60% T-60, 60–100% T-90); past renewal or status=renewed → Renewed. */
export type RenewalStage = "t90" | "t60" | "t30" | "renewed";

export interface RenewalStageOptions {
  milestonePercents?: number[];
  reminderDaysBeforeRenewal?: number;
}

export function getRenewalStageFromPlan(
  contractStartDate: string | undefined | null,
  renewalDate: string | undefined | null,
  status?: string | null,
  options?: RenewalStageOptions | null
): RenewalStage {
  if (status === "renewed") return "renewed";
  const today = new Date().toISOString().split("T")[0];
  const end = renewalDate && renewalDate.trim() ? renewalDate.trim() : today;
  const endMs = new Date(end).getTime();
  if (Number.isNaN(endMs)) return "t30";
  // Past renewal (overdue) → Renewed so they don’t all sit in T-90
  const daysUntilRenewal = getDaysUntil(end);
  if (daysUntilRenewal <= 0) return "renewed";
  const reminderDays = options?.reminderDaysBeforeRenewal ?? 1;
  if (reminderDays >= 0 && daysUntilRenewal <= reminderDays) return "t90";
  const start = contractStartDate && contractStartDate.trim() ? contractStartDate.trim() : today;
  const startMs = new Date(start).getTime();
  if (Number.isNaN(startMs)) return "t30";
  const planDurationDays = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
  const daysElapsed = getDaysSinceStart(start);
  const percent = Number.isFinite(daysElapsed) && planDurationDays > 0
    ? (daysElapsed / planDurationDays) * 100
    : 0;
  const p = Number.isFinite(percent) ? Math.max(0, percent) : 0;
  const defaultMilestones = [30, 60, 90, 95];
  const raw = options?.milestonePercents;
  const milestones = raw?.length ? raw : defaultMilestones;
  const m0 = milestones[0];
  const m1 = milestones.length >= 2 ? milestones[1] : 100;
  if (p < m0) return "t30";
  if (p < m1) return "t60";
  return "t90";
}
