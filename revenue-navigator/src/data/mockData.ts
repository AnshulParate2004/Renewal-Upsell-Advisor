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
  transcript?: string;
  sentiment_score?: number;
  emails?: { id: string, sender: 'agent'|'user', subject: string, body: string, date: string }[];
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
  arr?: number | null; // Annual recurring revenue (can be null)
  mrr?: number | null; // Monthly wise instalment (can be null)
  /** 'monthly' | 'annual' - used to filter when Annual/Monthly toggle is selected */
  billingInterval?: 'monthly' | 'annual' | null;
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
  renewalStage: string;
  industry: string;
  company_size?: string; // Added to match Supabase schema
  csm: string;
  /** Partner name (from partner_name or csm_name in DB) */
  partnerName?: string;
  lastContact: string;
  contractStart: string;
  contractEnd?: string;
  /** Account status: active, churned, at_risk, renewed */
  status?: string;
  automation_enabled?: boolean;
  // Contact information
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactCity?: string;
  contactState?: string;
  primary_contact_phone?: string;
  phone?: string;
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
  type: "upsell";
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

/** Renewal in days = days from today. When status is renewed and renewal_date is set, use contract_end − today; else use renewal_date if set, else contract_end. */
export function getRenewalInDays(
  renewalDate: string | undefined | null,
  contractEnd: string | undefined | null,
  status?: string | null
): number | null {
  const s = (status ?? '').toString().trim().toLowerCase();
  const isRenewed = s === 'renewed' || s === 'renewal';
  const hasRenewalDate = renewalDate && String(renewalDate).trim();
  const hasContractEnd = contractEnd && String(contractEnd).trim();
  const useDate = isRenewed && hasRenewalDate && hasContractEnd
    ? (contractEnd && String(contractEnd).trim()) || null
    : hasRenewalDate
      ? (renewalDate && String(renewalDate).trim()) || null
      : hasContractEnd
        ? (contractEnd && String(contractEnd).trim()) || null
        : null;
  if (!useDate) return null;
  return getDaysUntil(useDate);
}

/** Days since a date (e.g. contract start). Positive = past, negative = future. */
export function getDaysSinceStart(date: string): number {
  const diff = new Date().getTime() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Pipeline stage varies by pipeline_type. We return string. */
export type RenewalStage = string;

export interface RenewalStageOptions {
  milestonePercents?: number[];
  reminderDaysBeforeRenewal?: number;
}

export function getRenewalStageFromPlan(
  _contractStartDate: string | undefined | null,
  renewalDate: string | undefined | null,
  status?: string | null,
  _options?: RenewalStageOptions | null,
  contractEnd?: string | undefined | null,
  _renewalStage?: string | undefined | null
): RenewalStage {
  const today = new Date().toISOString().split("T")[0];
  const s = (status ?? "").toString().trim().toLowerCase();
  const isRenewed = s === "renewed" || s === "renewal";
  // Renewed accounts: bucket by days to contract end (apply renewal); others by renewal/contract end
  const end =
    isRenewed && contractEnd && String(contractEnd).trim()
      ? String(contractEnd).trim()
      : (renewalDate && renewalDate.trim())
        ? renewalDate.trim()
        : (contractEnd && String(contractEnd).trim())
          ? contractEnd.trim()
          : today;
  if (Number.isNaN(new Date(end).getTime())) return "q4";

  const daysToRenewal = getDaysUntil(end);

  // Past renewal date and not renewed → No Renewed column
  if (!isRenewed && daysToRenewal < 0) return "no_renewed";
  // Renewed with past contract end → Q4; else bucket by days
  if (daysToRenewal > 270) return "q1";
  if (daysToRenewal > 180) return "q2";
  if (daysToRenewal > 90) return "q3";
  return "q4";
}

/** Stage for monthly billing: only M1 or no_renewed.
 * - If renewal_stage is 'no_renewed' → stay in Not Renewed (even if date changes)
 * - Otherwise use days to renewal (same logic as the badge) so negative days go to Not Renewed
 */
export function getRenewalStageForMonthly(
  contractStartDate: string | undefined | null,
  renewalDate: string | undefined | null,
  status?: string | null,
  contractEnd?: string | undefined | null,
  renewalStage?: string | undefined | null
): "m1" | "no_renewed" {
  const stage = (renewalStage ?? "").toString().trim().toLowerCase();
  if (stage === "no_renewed") return "no_renewed";
  // Otherwise derive from days to renewal (like getRenewalInDays), so overdue accounts go to Not Renewed
  const days = getRenewalInDays(renewalDate, contractEnd, status) ?? getDaysUntil(renewalDate ?? "");
  if (days < 0) return "no_renewed";
  return "m1";
}
