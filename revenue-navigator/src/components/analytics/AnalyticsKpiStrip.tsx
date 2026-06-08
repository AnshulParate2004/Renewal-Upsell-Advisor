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
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "@/data/mockData";
import type { PortfolioKpis } from "@/lib/api/analytics";
import { useRevenue } from "@/contexts/RevenueContext";

interface Props {
  kpis: PortfolioKpis;
}

interface MetricItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export function AnalyticsKpiStrip({ kpis }: Props) {
  const { revenueType } = useRevenue();
  const revenueLabel = revenueType === "ARR" ? "Total ARR" : "Total MRR";

  const metrics: MetricItem[] = [
    { label: "Total Customers", value: kpis.total_accounts, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: revenueLabel, value: formatCurrency(kpis.total_revenue), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
    { label: "Accounts on Track", value: kpis.accounts_on_track, icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Churn Prediction", value: kpis.churn_risk_count, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Upsell Predicted", value: formatCurrency(kpis.upsell_pipeline), icon: Users, color: "text-orange-600", bg: "bg-orange-500/10" },
    { label: "Upsell Accounts", value: kpis.upsell_account_count, icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Renewed", value: kpis.renewed_count, icon: RefreshCw, color: "text-indigo-600", bg: "bg-indigo-500/10" },
    { label: "Avg Relationship", value: Math.round(kpis.avg_relationship_score), icon: Heart, color: "text-pink-600", bg: "bg-pink-500/10" },
    { label: "Avg Sentiment", value: kpis.avg_sentiment_score.toFixed(2), icon: Smile, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Avg Health Score", value: Math.round(kpis.avg_health_score), icon: Activity, color: "text-teal-600", bg: "bg-teal-500/10" },
    { label: "Avg Licence Used", value: `${Math.round(kpis.avg_utilization_percent)}%`, icon: Gauge, color: "text-sky-600", bg: "bg-sky-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.03 }}
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
