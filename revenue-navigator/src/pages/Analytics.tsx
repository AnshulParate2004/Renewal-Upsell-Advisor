import { Download, FileText, Loader2, AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePortfolioAnalytics, useAnalyticsTrends } from "@/hooks/useAnalytics";
import { useRevenue } from "@/contexts/RevenueContext";
import { AnalyticsKpiStrip } from "@/components/analytics/AnalyticsKpiStrip";
import { LifecycleFunnelChart } from "@/components/analytics/LifecycleFunnelChart";
import { RenewalQuarterChart } from "@/components/analytics/RenewalQuarterChart";
import { UpsellPipelineChart } from "@/components/analytics/UpsellPipelineChart";
import { PortfolioTrendChart } from "@/components/analytics/PortfolioTrendChart";
import { RetentionTrendChart } from "@/components/analytics/RetentionTrendChart";
import { RiskDistributionChart } from "@/components/analytics/RiskDistributionChart";
import { ScoreDistributionChart } from "@/components/analytics/ScoreDistributionChart";
import { ConsumptionMetricsCard } from "@/components/analytics/ConsumptionMetricsCard";
import { TopAtRiskTable } from "@/components/analytics/TopAtRiskTable";
import { GoalsProgressCard } from "@/components/analytics/GoalsProgressCard";
import { exportAnalyticsCsv } from "@/components/analytics/exportAnalyticsCsv";

export default function Analytics() {
  const { revenueType } = useRevenue();
  const revenueLabel = revenueType === "ARR" ? "Total ARR" : "Total MRR";

  const { data: portfolio, isLoading, error } = usePortfolioAnalytics();
  const { data: trends, isLoading: trendsLoading } = useAnalyticsTrends(12);

  const isPageLoading = isLoading || trendsLoading;
  const trendSeries = trends?.series ?? [];

  const handleExportCsv = () => {
    if (portfolio) exportAnalyticsCsv(portfolio, revenueLabel);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b-2 border-black px-6 py-5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Portfolio intelligence — renewal, lifecycle, upsell, and risk metrics
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              title="PDF export coming soon"
              className="h-9 px-3 bg-card text-muted-foreground border-2 border-black/30 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!portfolio}
              className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 space-y-5">
        {error ? (
          <div className="flex items-center justify-center py-24 text-destructive">
            <AlertTriangle className="w-5 h-5 mr-3" />
            <span className="text-sm">Failed to load analytics. Ensure the backend is running.</span>
          </div>
        ) : isPageLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2.5 text-muted-foreground text-sm">Loading analytics...</span>
          </div>
        ) : !portfolio || portfolio.kpis.total_accounts === 0 ? (
          <EmptyState
            title="No analytics data"
            message="No accounts match the current billing filter. Try switching ARR/MRR or add accounts."
          />
        ) : (
          <>
            <AnalyticsKpiStrip kpis={portfolio.kpis} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LifecycleFunnelChart data={portfolio.lifecycle_stages} />
              <RenewalQuarterChart data={portfolio.renewal_quarters} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PortfolioTrendChart data={trendSeries} />
              <RetentionTrendChart data={trendSeries} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RiskDistributionChart data={portfolio.risk_distribution} />
              <ScoreDistributionChart distributions={portfolio.score_distributions} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UpsellPipelineChart data={portfolio.upsell_by_stage} />
              <ConsumptionMetricsCard data={portfolio.portfolio_consumption} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <GoalsProgressCard goals={portfolio.goals} />
              <TopAtRiskTable accounts={portfolio.top_at_risk_accounts} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
