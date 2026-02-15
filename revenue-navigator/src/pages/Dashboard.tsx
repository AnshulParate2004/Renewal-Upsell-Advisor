import { useState } from "react";
import { Users, AlertTriangle, TrendingUp, DollarSign, Heart, Smile, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/data/mockData";
import { motion } from "framer-motion";
import AnimatedCard from "@/components/ui/AnimatedCard";
import RelationshipTrendChart from "@/components/charts/RelationshipScoreChart";
import { useDashboardStats } from "@/hooks/useAnalytics";
import { useAccounts } from "@/hooks/useAccounts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useAccounts();

  // Calculate metrics from API data or use fallback
  const totalArr = stats?.total_arr ?? 0;
  const churnRiskCount = stats?.churn_risk_count ?? 0;
  const renewalRate = accounts.length > 0
    ? Math.round((accounts.filter((a) => a.renewalStage === "renewed" || a.healthScore >= 70).length / accounts.length) * 100)
    : 0;
  const upsellPipeline = stats?.upsell_pipeline ?? 0;
  const avgRelationshipScore = stats?.avg_relationship_score ?? 0;
  const avgSentimentScore = (stats?.avg_sentiment_score ?? 0).toFixed(2);

  const isLoading = statsLoading || accountsLoading;

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-end justify-between shrink-0 pb-6 border-b-4 border-foreground"
      >
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tight leading-none uppercase">
            Revenue <span className="text-primary">Navigator</span>
          </h1>
          <p className="text-sm font-black text-foreground/60 mt-2 uppercase tracking-wider">
            Real-Time Performance Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="sticker-outline px-4 py-2 text-sm">
            Live Dashboard
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 shrink-0">
        {isLoading ? (
          <div className="col-span-6 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/60">Loading dashboard data...</span>
          </div>
        ) : (statsError || accountsError) ? (
          <div className="col-span-6 flex items-center justify-center py-12 text-red-600">
            <AlertTriangle className="w-8 h-8 mr-3" />
            <div className="flex flex-col">
              <span>Failed to load dashboard data.</span>
              <span className="text-xs mt-2 text-red-500">
                {statsError?.message || accountsError?.message || 'Unknown error'}
              </span>
              <span className="text-xs mt-1 text-gray-500">
                Make sure the backend is running on http://localhost:8000
              </span>
            </div>
          </div>
        ) : (
          [
            { label: 'Total ARR', value: totalArr, displayValue: formatCurrency(totalArr), icon: <DollarSign size={20} />, color: 'text-foreground', iconBg: 'bg-primary', iconColor: 'text-white' },
            { label: 'Churn Risk', value: churnRiskCount, displayValue: churnRiskCount, icon: <AlertTriangle size={20} />, color: 'text-red-600', iconBg: 'bg-white', iconColor: 'text-red-600', iconBorder: 'border-red-600', isAlert: true },
            { label: 'Renewal Rate', value: renewalRate, displayValue: `${renewalRate}%`, icon: <TrendingUp size={20} />, color: 'text-primary', iconBg: 'bg-white', iconColor: 'text-primary', iconBorder: 'border-primary' },
            { label: 'Upsell Pipeline', value: upsellPipeline, displayValue: formatCurrency(upsellPipeline), icon: <Users size={20} />, color: 'text-foreground', iconBg: 'bg-accent', iconColor: 'text-white' },
            { label: 'Avg Relationship', value: avgRelationshipScore, displayValue: `${Math.round(avgRelationshipScore)}%`, icon: <Heart size={20} />, color: 'text-foreground', iconBg: 'bg-white', iconColor: 'text-foreground', iconBorder: 'border-foreground' },
            { label: 'Avg Sentiment', value: parseFloat(avgSentimentScore), displayValue: avgSentimentScore, icon: <Smile size={20} />, color: 'text-foreground', iconBg: 'bg-white', iconColor: 'text-foreground', iconBorder: 'border-foreground' }
          ].map((metric, idx) => (
          <AnimatedCard
            key={idx}
            delay={idx * 0.05}
            className={`paper-card p-5 flex flex-col justify-between group cursor-default transition-all ${metric.isAlert ? 'bg-red-50' : 'bg-white'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-black text-foreground/60 uppercase tracking-wider">{metric.label}</p>
              <div className={`w-10 h-10 p-2 border-2 ${metric.iconBorder || 'border-foreground'} rounded-lg ${metric.iconBg} ${metric.iconColor} flex items-center justify-center shrink-0`} style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                {metric.icon}
              </div>
            </div>
            <div className={`text-3xl font-black tracking-tight ${metric.color}`}>
              {metric.displayValue}
            </div>
          </AnimatedCard>
          ))
        )}
      </div>

      {/* Customer Relationship Trend Chart */}
      <div className="flex-1 min-h-0">
        <RelationshipTrendChart />
      </div>
    </div>
  );
}
