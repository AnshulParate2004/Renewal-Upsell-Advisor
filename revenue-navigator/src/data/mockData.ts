// ─── Account Data ───
export interface Account {
  id: string;
  name: string;
  arr: number;
  healthScore: number;
  riskScore: number;
  sentiment: "positive" | "neutral" | "negative";
  utilization: number;
  licensesUsed: number;
  licensesTotal: number;
  renewalDate: string;
  renewalStage: "t90" | "t60" | "t30" | "renewed" | "lost";
  industry: string;
  csm: string;
  lastContact: string;
  contractStart: string;
}

export const accounts: Account[] = [
  { id: "1", name: "Acme Corporation", arr: 120000, healthScore: 78, riskScore: 85, sentiment: "negative", utilization: 67, licensesUsed: 34, licensesTotal: 50, renewalDate: "2026-02-24", renewalStage: "t30", industry: "Technology", csm: "Sarah Chen", lastContact: "2 hours ago", contractStart: "2025-02-24" },
  { id: "2", name: "TechStart Inc", arr: 45000, healthScore: 42, riskScore: 72, sentiment: "neutral", utilization: 45, licensesUsed: 9, licensesTotal: 20, renewalDate: "2026-03-15", renewalStage: "t30", industry: "SaaS", csm: "James Wilson", lastContact: "Yesterday", contractStart: "2025-03-15" },
  { id: "3", name: "Global Systems", arr: 200000, healthScore: 91, riskScore: 15, sentiment: "positive", utilization: 92, licensesUsed: 92, licensesTotal: 100, renewalDate: "2026-04-10", renewalStage: "t60", industry: "Enterprise", csm: "Sarah Chen", lastContact: "3 days ago", contractStart: "2025-04-10" },
  { id: "4", name: "DataFlow Analytics", arr: 85000, healthScore: 65, riskScore: 55, sentiment: "neutral", utilization: 78, licensesUsed: 39, licensesTotal: 50, renewalDate: "2026-05-01", renewalStage: "t90", industry: "Analytics", csm: "Maria Lopez", lastContact: "1 week ago", contractStart: "2025-05-01" },
  { id: "5", name: "CloudNine Solutions", arr: 150000, healthScore: 88, riskScore: 20, sentiment: "positive", utilization: 85, licensesUsed: 68, licensesTotal: 80, renewalDate: "2026-03-20", renewalStage: "t30", industry: "Cloud", csm: "James Wilson", lastContact: "4 hours ago", contractStart: "2025-03-20" },
  { id: "6", name: "Nexus Enterprises", arr: 95000, healthScore: 55, riskScore: 68, sentiment: "negative", utilization: 35, licensesUsed: 7, licensesTotal: 20, renewalDate: "2026-04-25", renewalStage: "t90", industry: "Finance", csm: "Maria Lopez", lastContact: "2 weeks ago", contractStart: "2025-04-25" },
  { id: "7", name: "Pinnacle Group", arr: 175000, healthScore: 82, riskScore: 30, sentiment: "positive", utilization: 76, licensesUsed: 57, licensesTotal: 75, renewalDate: "2026-03-05", renewalStage: "t30", industry: "Healthcare", csm: "Sarah Chen", lastContact: "Yesterday", contractStart: "2025-03-05" },
  { id: "8", name: "Vertex Labs", arr: 62000, healthScore: 70, riskScore: 45, sentiment: "neutral", utilization: 60, licensesUsed: 18, licensesTotal: 30, renewalDate: "2026-05-15", renewalStage: "t90", industry: "Research", csm: "James Wilson", lastContact: "5 days ago", contractStart: "2025-05-15" },
  { id: "9", name: "Horizon Media", arr: 110000, healthScore: 35, riskScore: 90, sentiment: "negative", utilization: 25, licensesUsed: 5, licensesTotal: 20, renewalDate: "2026-02-28", renewalStage: "t30", industry: "Media", csm: "Maria Lopez", lastContact: "3 weeks ago", contractStart: "2025-02-28" },
  { id: "10", name: "Summit Financial", arr: 250000, healthScore: 95, riskScore: 5, sentiment: "positive", utilization: 88, licensesUsed: 176, licensesTotal: 200, renewalDate: "2026-04-15", renewalStage: "t60", industry: "Finance", csm: "Sarah Chen", lastContact: "1 hour ago", contractStart: "2025-04-15" },
  { id: "11", name: "Rapid Dynamics", arr: 38000, healthScore: 48, riskScore: 78, sentiment: "negative", utilization: 30, licensesUsed: 3, licensesTotal: 10, renewalDate: "2026-03-28", renewalStage: "t60", industry: "Manufacturing", csm: "James Wilson", lastContact: "10 days ago", contractStart: "2025-03-28" },
  { id: "12", name: "EcoTech Green", arr: 72000, healthScore: 80, riskScore: 25, sentiment: "positive", utilization: 70, licensesUsed: 28, licensesTotal: 40, renewalDate: "2026-06-01", renewalStage: "t90", industry: "CleanTech", csm: "Maria Lopez", lastContact: "2 days ago", contractStart: "2025-06-01" },
];

// ─── Voice Calls ───
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

export const voiceCalls: VoiceCall[] = [
  { id: "c1", accountId: "1", accountName: "Acme Corporation", date: "2026-02-12 10:30", duration: "8:34", outcome: "picked_up", sentiment: "positive", retryCount: 0, transcript: ["[Agent]: Hi, this is Sarah from S-007. I wanted to check in about your renewal coming up.", "[Customer]: Hi Sarah, thanks for reaching out. We've been happy overall.", "[Agent]: Great to hear! I noticed your utilization is at 67%. Would you like to explore our expanded plan?", "[Customer]: That sounds interesting, send me the details."] },
  { id: "c2", accountId: "9", accountName: "Horizon Media", date: "2026-02-12 09:15", duration: "0:00", outcome: "missed", retryCount: 2 },
  { id: "c3", accountId: "2", accountName: "TechStart Inc", date: "2026-02-11 14:20", duration: "5:12", outcome: "picked_up", sentiment: "neutral", retryCount: 1, transcript: ["[Agent]: Hi, calling about your account review.", "[Customer]: Sure, what do you need?", "[Agent]: We noticed a dip in usage. Anything we can help with?", "[Customer]: We've been busy. Let me get back to you next week."] },
  { id: "c4", accountId: "6", accountName: "Nexus Enterprises", date: "2026-02-11 11:00", duration: "1:20", outcome: "voicemail", retryCount: 0 },
  { id: "c5", accountId: "4", accountName: "DataFlow Analytics", date: "2026-02-10 16:45", duration: "12:08", outcome: "picked_up", sentiment: "positive", retryCount: 0, transcript: ["[Agent]: Hi, this is Maria. How's everything going with the platform?", "[Customer]: Really well actually. We're looking to expand.", "[Agent]: Wonderful! Let's schedule a demo for the advanced analytics module.", "[Customer]: Perfect, how about next Tuesday?"] },
  { id: "c6", accountId: "11", accountName: "Rapid Dynamics", date: "2026-02-10 10:00", duration: "0:00", outcome: "retry", retryCount: 3 },
];

// ─── Opportunities ───
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

export const opportunities: Opportunity[] = [
  { id: "o1", accountId: "3", accountName: "Global Systems", type: "upsell", value: 48000, probability: 85, stage: "quote_sent", createdDate: "2026-01-15" },
  { id: "o2", accountId: "1", accountName: "Acme Corporation", type: "renewal", value: 120000, probability: 60, stage: "negotiation", createdDate: "2026-01-20" },
  { id: "o3", accountId: "5", accountName: "CloudNine Solutions", type: "upsell", value: 35000, probability: 70, stage: "identified", createdDate: "2026-02-01" },
  { id: "o4", accountId: "10", accountName: "Summit Financial", type: "cross_sell", value: 80000, probability: 90, stage: "quote_sent", createdDate: "2026-01-10" },
  { id: "o5", accountId: "7", accountName: "Pinnacle Group", type: "renewal", value: 175000, probability: 95, stage: "negotiation", createdDate: "2026-01-25" },
  { id: "o6", accountId: "4", accountName: "DataFlow Analytics", type: "upsell", value: 22000, probability: 55, stage: "identified", createdDate: "2026-02-05" },
  { id: "o7", accountId: "12", accountName: "EcoTech Green", type: "cross_sell", value: 15000, probability: 40, stage: "identified", createdDate: "2026-02-08" },
  { id: "o8", accountId: "8", accountName: "Vertex Labs", type: "renewal", value: 62000, probability: 80, stage: "quote_sent", createdDate: "2026-02-02" },
];

// ─── Analytics Chart Data ───
export const revenueData = [
  { month: "Mar", total: 2100, new: 150, expansion: 80, churned: -50 },
  { month: "Apr", total: 2180, new: 120, expansion: 60, churned: -30 },
  { month: "May", total: 2220, new: 90, expansion: 100, churned: -80 },
  { month: "Jun", total: 2280, new: 130, expansion: 70, churned: -40 },
  { month: "Jul", total: 2310, new: 100, expansion: 50, churned: -60 },
  { month: "Aug", total: 2350, new: 110, expansion: 90, churned: -20 },
  { month: "Sep", total: 2300, new: 80, expansion: 40, churned: -100 },
  { month: "Oct", total: 2340, new: 140, expansion: 60, churned: -30 },
  { month: "Nov", total: 2380, new: 95, expansion: 75, churned: -45 },
  { month: "Dec", total: 2350, new: 70, expansion: 50, churned: -90 },
  { month: "Jan", total: 2400, new: 120, expansion: 85, churned: -35 },
  { month: "Feb", total: 2420, new: 105, expansion: 65, churned: -25 },
];

export const churnData = [
  { month: "Sep", renewed: 18, churned: 3, atRisk: 5 },
  { month: "Oct", renewed: 22, churned: 2, atRisk: 4 },
  { month: "Nov", renewed: 15, churned: 4, atRisk: 7 },
  { month: "Dec", renewed: 20, churned: 1, atRisk: 3 },
  { month: "Jan", renewed: 25, churned: 3, atRisk: 6 },
  { month: "Feb", renewed: 19, churned: 2, atRisk: 5 },
];

export const sentimentData = [
  { day: "1", score: 0.6 }, { day: "5", score: 0.55 }, { day: "10", score: 0.7 },
  { day: "15", score: 0.45 }, { day: "20", score: 0.65 }, { day: "25", score: 0.72 },
  { day: "30", score: 0.68 },
];

// ─── Helper Formatters ───
export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

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
