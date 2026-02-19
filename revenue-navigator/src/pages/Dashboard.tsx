import { Users, AlertTriangle, TrendingUp, DollarSign, Heart, Smile, Loader2 } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import RelationshipTrendChart from "@/components/charts/RelationshipScoreChart";
import { useDashboardStats } from "@/hooks/useAnalytics";
import { useAccounts } from "@/hooks/useAccounts";

export default function Dashboard() {
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

  const metrics = [
    { 
      label: 'Total ARR', 
      value: formatCurrency(totalArr), 
      icon: <DollarSign size={20} />, 
      color: 'default' as const,
      iconBg: 'bg-primary', 
      iconColor: 'text-white',
      delay: 0
    },
    { 
      label: 'Churn Risk', 
      value: churnRiskCount, 
      icon: <AlertTriangle size={20} />, 
      color: 'danger' as const,
      iconBg: 'bg-white', 
      iconColor: 'text-red-600', 
      iconBorder: 'border-red-600', 
      isAlert: true,
      delay: 0.05
    },
    { 
      label: 'Renewal Rate', 
      value: `${renewalRate}%`, 
      icon: <TrendingUp size={20} />, 
      color: 'primary' as const,
      iconBg: 'bg-white', 
      iconColor: 'text-primary', 
      iconBorder: 'border-primary',
      delay: 0.1
    },
    { 
      label: 'Upsell Pipeline', 
      value: formatCurrency(upsellPipeline), 
      icon: <Users size={20} />, 
      color: 'default' as const,
      iconBg: 'bg-accent', 
      iconColor: 'text-white',
      delay: 0.15
    },
    { 
      label: 'Avg Relationship', 
      value: `${Math.round(avgRelationshipScore)}%`, 
      icon: <Heart size={20} />, 
      color: 'default' as const,
      iconBg: 'bg-white', 
      iconColor: 'text-foreground', 
      iconBorder: 'border-foreground',
      delay: 0.2
    },
    { 
      label: 'Avg Sentiment', 
      value: avgSentimentScore, 
      icon: <Smile size={20} />, 
      color: 'default' as const,
      iconBg: 'bg-white', 
      iconColor: 'text-foreground', 
      iconBorder: 'border-foreground',
      delay: 0.25
    }
  ];

  return (
    <PageContainer className="h-[calc(100vh-64px)]">
      <PageHeader
        title="Revenue Navigator"
        subtitle="Real-Time Performance Intelligence"
        badge="Live Dashboard"
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 shrink-0">
        {isLoading ? (
          <div className="col-span-6 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/60 font-black uppercase tracking-wider">Loading dashboard data...</span>
          </div>
        ) : (statsError || accountsError) ? (
          <div className="col-span-6">
            <EmptyState
              variant="not-found"
              title="Failed to Load Data"
              message={statsError?.message || accountsError?.message || 'Failed to load dashboard data. Make sure the backend is running on http://localhost:8000'}
            />
          </div>
        ) : (
          metrics.map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              color={metric.color}
              iconBg={metric.iconBg}
              iconColor={metric.iconColor}
              iconBorder={metric.iconBorder}
              isAlert={metric.isAlert}
              delay={metric.delay}
            />
          ))
        )}
      </div>

      {/* Customer Relationship Trend Chart */}
      <div className="flex-1 min-h-0">
        <RelationshipTrendChart />
      </div>
    </PageContainer>
  );
}
