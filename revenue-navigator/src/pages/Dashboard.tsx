import { Users, AlertTriangle, TrendingUp, DollarSign, Heart, Smile, Loader2, ShieldCheck, Briefcase } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboardStats } from "@/hooks/useAnalytics";
import { useAccounts } from "@/hooks/useAccounts";
import { useRevenue } from "@/contexts/RevenueContext";
import { motion } from "framer-motion";
import RelationshipTrendChart from "@/components/charts/RelationshipScoreChart";

export default function Dashboard() {
  const { revenueType } = useRevenue();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useAccounts();

  const totalArr = stats?.total_arr ?? accounts.reduce((sum, a) => sum + a.arr, 0);
  const totalMrr = stats?.total_mrr ?? accounts.reduce((sum, a) => sum + (a.mrr || a.arr / 12), 0);
  const displayRevenue = revenueType === 'MRR' ? totalMrr : totalArr;
  const churnRiskCount = stats?.churn_risk_count ?? 0;
  const renewalRate = accounts.length > 0
    ? Math.round((accounts.filter((a) => a.renewalStage === "renewed" || a.healthScore >= 70).length / accounts.length) * 100)
    : 0;
  const upsellPipeline = stats?.upsell_pipeline ?? 0;
  const displayPipeline = revenueType === 'MRR' ? upsellPipeline / 12 : upsellPipeline;
  const avgRelationshipScore = stats?.avg_relationship_score ?? 0;
  const avgSentimentScore = (stats?.avg_sentiment_score ?? 0).toFixed(2);
  const isLoading = statsLoading || accountsLoading;

  const safeAccountsCount = accounts.filter(a => a.riskScore < 70).length;

  const metricCards = [
    { label: 'Total Customers', value: accounts.length, icon: <Briefcase size={18} />, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500', borderColor: 'border-blue-500/20' },
    { label: `Total ${revenueType}`, value: formatCurrency(displayRevenue), icon: <DollarSign size={18} />, iconBg: 'bg-primary/10', iconColor: 'text-primary', borderColor: 'border-primary/20' },
    { label: 'Safe Accounts', value: safeAccountsCount, icon: <ShieldCheck size={18} />, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500', borderColor: 'border-emerald-500/20' },
    { label: 'Churn Risk', value: churnRiskCount, icon: <AlertTriangle size={18} />, iconBg: 'bg-destructive/10', iconColor: 'text-destructive', isAlert: true, borderColor: 'border-destructive/20' },
    { label: 'Renewal Rate', value: `${renewalRate}%`, icon: <TrendingUp size={18} />, iconBg: 'bg-primary/10', iconColor: 'text-primary', borderColor: 'border-primary/20' },
    { label: 'Upsell Pipeline', value: formatCurrency(displayPipeline), icon: <Users size={18} />, iconBg: 'bg-accent/10', iconColor: 'text-accent', borderColor: 'border-accent/20' },
    { label: 'Avg Relationship', value: `${Math.round(avgRelationshipScore)}%`, icon: <Heart size={18} />, iconBg: 'bg-pink-500/10', iconColor: 'text-pink-500', borderColor: 'border-pink-500/20' },
    { label: 'Avg Sentiment', value: avgSentimentScore, icon: <Smile size={18} />, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500', borderColor: 'border-amber-500/20' },
    { label: 'Avg Deal Size', value: formatCurrency(Math.floor(displayRevenue / (accounts.filter(a => a.arr > 0).length || 1))), icon: <TrendingUp size={18} />, iconBg: 'bg-orange-500/10', iconColor: 'text-orange-500', borderColor: 'border-orange-500/20' },
    { label: 'Conversion Rate', value: '15%', icon: <Smile size={18} />, iconBg: 'bg-indigo-500/10', iconColor: 'text-indigo-500', borderColor: 'border-indigo-500/20' },
  ];

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-card border-b-2 border-black px-6 py-5 shrink-0"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time performance intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-background text-muted-foreground border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-auto max-w-[1600px] mx-auto w-full flex flex-col">
        {/* Metric Cards */}
        <div className="p-6 pb-0">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 shrink-0">
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground text-sm">Loading dashboard data...</span>
              </div>
            ) : (statsError || accountsError) ? (
              <div className="col-span-full flex items-center justify-center py-12 text-destructive">
                <AlertTriangle className="w-5 h-5 mr-3" />
                <div className="flex flex-col">
                  <span className="text-sm">Failed to load dashboard data.</span>
                  <span className="text-xs mt-1 text-muted-foreground">
                    {statsError?.message || accountsError?.message || 'Make sure the backend is running'}
                  </span>
                </div>
              </div>
            ) : (
              metricCards.map((metric, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.35 }}
                  className="bg-card rounded-xl border-2 border-black p-5 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <div className={`w-9 h-9 rounded-lg border-2 border-black ${metric.iconBg} ${metric.iconColor} flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                      {metric.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-foreground">
                    {metric.value}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="p-6 shrink-0 h-[450px]">
          <div className="bg-card rounded-xl border-2 border-black overflow-hidden h-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col">
            <RelationshipTrendChart />
          </div>
        </div>
      </div>
    </div>
  );
}
