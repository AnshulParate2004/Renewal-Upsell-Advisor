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
  csm: string;
  lastContact: string;
  contractStart: string;
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
  type: "renewal" | "upsell" | "cross_sell";
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
