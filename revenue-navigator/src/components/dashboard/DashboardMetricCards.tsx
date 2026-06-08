import {
  Users,
  AlertTriangle,
  DollarSign,
  Heart,
  Smile,
  ShieldCheck,
  Briefcase,
  Activity,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/data/mockData";
import type { Account } from "@/data/mockData";
import type { Opportunity } from "@/data/mockData";

interface DashboardMetricCardsProps {
  accounts: Account[];
  opportunities: Opportunity[];
  stats?: {
    churn_risk_count?: number;
    avg_relationship_score?: number;
    avg_sentiment_score?: number;
  } | null;
  revenueLabel: string;
  displayRevenue: number;
  stageFilter?: string;
}

interface MetricItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function DashboardMetricCards({
  accounts,
  opportunities,
  stats,
  revenueLabel,
  displayRevenue,
  stageFilter = "all",
}: DashboardMetricCardsProps) {
  const isStatusRenewed = (a: Account) => {
    const s = (a.status ?? "").toString().trim().toLowerCase();
    return s === "renewed" || s === "renewal";
  };

  const visibleAccountIds = new Set(accounts.map((a) => a.id));
  const visibleOpps = opportunities.filter((o) => o.accountId && visibleAccountIds.has(o.accountId));

  // Only use portfolio-wide stats while loading the full list (All view). Empty buckets must show zeros.
  const usePortfolioStats = stageFilter === "all" && accounts.length === 0;

  const churnRiskCount =
    accounts.length > 0
      ? accounts.filter((a) => (a.riskScore ?? 0) >= 70 && !isStatusRenewed(a)).length
      : usePortfolioStats
        ? (stats?.churn_risk_count ?? 0)
        : 0;

  const upsellPipeline = visibleOpps.reduce((sum, o) => {
    const rawValue = typeof o.value === "number" ? o.value : Number(o.value ?? 0);
    return sum + (Number.isFinite(rawValue) ? rawValue : 0);
  }, 0);

  const safeAccountsCount = accounts.filter(
    (a) => (a.riskScore ?? 0) < 40 || isStatusRenewed(a)
  ).length;

  const avgHealthScore =
    accounts.length > 0
      ? Math.round(accounts.reduce((sum, a) => sum + (a.healthScore ?? 0), 0) / accounts.length)
      : 0;

  const avgUtilizationPct =
    accounts.length > 0
      ? Math.round(
          accounts.reduce((sum, a) => {
            const u = Number(a.utilization ?? 0);
            return sum + (u <= 1 && u >= 0 ? u * 100 : u);
          }, 0) / accounts.length
        )
      : 0;

  const predictedUpsellAccountCount = visibleOpps.filter(
    (o) => (typeof o.value === "number" ? o.value : 0) > 0
  ).length;

  const avgRelationshipScore =
    accounts.length > 0
      ? Math.round(
          accounts.reduce((sum, a) => sum + (a.relationshipScore ?? 0), 0) / accounts.length
        )
      : usePortfolioStats
        ? Math.round(stats?.avg_relationship_score ?? 0)
        : 0;

  const avgSentimentScore =
    accounts.length > 0
      ? accounts.reduce((sum, a) => sum + (a.sentimentScore ?? 0), 0) / accounts.length
      : usePortfolioStats
        ? (stats?.avg_sentiment_score ?? 0)
        : 0;

  const shortRevenueLabel = revenueLabel.includes("Annual") ? "Total ARR" : "Total MRR";
  const customersLabel =
    stageFilter === "all" ? "Total Customers" : "Customers in bucket";

  const metrics: MetricItem[] = [
    { label: customersLabel, value: accounts.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: shortRevenueLabel, value: formatCurrency(displayRevenue), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Accounts on Track", value: safeAccountsCount, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Churn Prediction", value: churnRiskCount, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Upsell Predicted", value: formatCurrency(upsellPipeline), icon: Users, color: "text-orange-600", bg: "bg-orange-500/10" },
    { label: "Upsell Accounts", value: predictedUpsellAccountCount, icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Avg Relationship", value: avgRelationshipScore, icon: Heart, color: "text-pink-600", bg: "bg-pink-500/10" },
    { label: "Avg Sentiment", value: avgSentimentScore.toFixed(2), icon: Smile, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Avg Health Score", value: avgHealthScore, icon: Activity, color: "text-teal-600", bg: "bg-teal-500/10" },
    { label: "Avg Licence Used", value: `${avgUtilizationPct}%`, icon: Gauge, color: "text-sky-600", bg: "bg-sky-500/10" },
  ];

  return (
    <div key={stageFilter} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.04 }}
          className="bg-card rounded-lg border-2 border-black/20 px-4 py-3 flex items-center gap-3 min-h-[72px]"
        >
          <div className={`w-9 h-9 rounded-lg shrink-0 ${m.bg} ${m.color} flex items-center justify-center`}>
            <m.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate">{m.label}</p>
            <p className="text-lg font-bold truncate">{m.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
