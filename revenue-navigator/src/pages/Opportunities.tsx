import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, BarChart3, Target, Briefcase, Zap, Loader2 } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { PageContainer } from "@/components/ui/PageContainer";
import { PageHeader } from "@/components/ui/PageHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useAccounts } from "@/hooks/useAccounts";

const typeBadge: Record<string, { label: string; bgColor: string }> = {
  renewal: { label: "RENEWAL", bgColor: "bg-primary" },
  upsell: { label: "UPSELL", bgColor: "bg-accent" },
  cross_sell: { label: "CROSS_SELL", bgColor: "bg-foreground" },
};

export default function Opportunities() {
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: opportunities = [], isLoading, error } = useOpportunities();
  const { data: accounts = [] } = useAccounts();

  // Enrich opportunities with account names
  const enrichedOpportunities = useMemo(() => {
    return opportunities.map(opp => {
      const account = accounts.find(a => a.id === opp.accountId);
      return {
        ...opp,
        accountName: account?.name || 'Unknown Account'
      };
    });
  }, [opportunities, accounts]);

  const filtered = useMemo(() => {
    return enrichedOpportunities.filter((o) => typeFilter === "all" || o.type === typeFilter);
  }, [enrichedOpportunities, typeFilter]);

  const totalPipeline = useMemo(() => enrichedOpportunities.reduce((s, o) => s + o.value, 0), [enrichedOpportunities]);
  const weightedValue = useMemo(() => enrichedOpportunities.reduce((s, o) => s + o.value * (o.probability / 100), 0), [enrichedOpportunities]);
  const avgDeal = enrichedOpportunities.length > 0 ? totalPipeline / enrichedOpportunities.length : 0;
  const conversionRate = Math.round(
    (enrichedOpportunities.filter((o) => o.stage === "closed_won").length / enrichedOpportunities.length) * 100
  ) || 15;

  return (
    <PageContainer className="h-[calc(100vh-64px)]">
      <PageHeader
        title="Growth Pipeline"
        subtitle="Strategic Opportunity Management"
        badge="PIPELINE"
        actions={
          <div className="flex items-center gap-3">
            <div className="text-sm italic text-accent font-bold">High Velocity!</div>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-4 flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3 text-foreground/60 font-black uppercase tracking-wider">Loading opportunities...</span>
          </div>
        ) : error ? (
          <div className="col-span-4">
            <EmptyState
              variant="not-found"
              title="Failed to Load Opportunities"
              message={error.message || "Failed to load opportunities. Please try again."}
            />
          </div>
        ) : (
          [
            { label: 'Pipeline Total', value: formatCurrency(totalPipeline), icon: <DollarSign size={20} />, iconBg: 'bg-primary', iconColor: 'text-white', delay: 0 },
            { label: 'Weighted Forecast', value: formatCurrency(weightedValue), icon: <BarChart3 size={20} />, iconBg: 'bg-accent', iconColor: 'text-white', delay: 0.05 },
            { label: 'Avg Deal Index', value: formatCurrency(avgDeal), icon: <TrendingUp size={20} />, iconBg: 'bg-white', iconColor: 'text-foreground', delay: 0.1 },
            { label: 'Closer Ratio', value: `${conversionRate}%`, icon: <Target size={20} />, iconBg: 'bg-white', iconColor: 'text-foreground', delay: 0.15 }
          ].map((metric, idx) => (
            <MetricCard
              key={idx}
              label={metric.label}
              value={metric.value}
              icon={metric.icon}
              iconBg={metric.iconBg}
              iconColor={metric.iconColor}
              delay={metric.delay}
            />
          ))
        )}
      </div>

      {/* Filters & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'renewal', 'upsell', 'cross_sell'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setTypeFilter(filter)}
              className={`px-4 py-2 text-sm font-black border-2 border-foreground rounded-lg transition-all uppercase tracking-wider ${typeFilter === filter ? 'bg-primary text-white' : 'bg-white text-foreground hover:bg-accent/10'}`}
              style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}
            >
              {filter === 'all' ? 'All Types' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        <button className="px-4 py-2 bg-accent text-white border-2 border-foreground rounded-lg font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2 group" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
          <Briefcase size={16} className="group-hover:scale-110 transition-transform" />
          New Opportunity
        </button>
      </div>

      {/* Table */}
      <div className="paper-card table-container overflow-hidden bg-white p-0">
        <table className="w-full text-sm">
          <thead className="bg-accent border-b-4 border-foreground">
            <tr className="text-xs uppercase text-white font-black tracking-widest text-left">
              <th className="pl-6 py-4">Account</th>
              <th className="text-center py-4">Type</th>
              <th className="text-right py-4">Value</th>
              <th className="text-center py-4">Probability</th>
              <th className="text-center py-4">Stage</th>
              <th className="text-center py-4 pr-6">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-foreground">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  <span className="ml-3 text-foreground/60">Loading opportunities...</span>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-red-600">
                  Failed to load opportunities.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    variant="no-results"
                    title="No Opportunities Found"
                    message="Try adjusting your filters or create a new opportunity."
                  />
                </td>
              </tr>
            ) : (
              filtered.map((opp) => (
                <tr key={opp.id} className="hover:bg-primary/10 transition-colors group">
                <td className="pl-6 py-4 font-black text-foreground uppercase tracking-wide group-hover:text-primary transition-colors">{opp.accountName}</td>
                <td className="text-center py-4">
                  <div className={`inline-flex py-1 px-3 text-xs text-white border-2 border-foreground rounded-lg font-black uppercase tracking-wider ${typeBadge[opp.type].bgColor}`} style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                    {typeBadge[opp.type].label}
                  </div>
                </td>
                <td className="text-right py-4 font-black text-foreground uppercase">{formatCurrency(opp.value)}</td>
                <td className="text-center py-4">
                  <div className="w-24 h-3 border-2 border-foreground bg-gray-100 rounded-lg inline-block relative overflow-hidden" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${opp.probability}%` }}
                    ></div>
                    <span className="absolute -top-5 right-0 text-xs font-black text-foreground uppercase">{opp.probability}%</span>
                  </div>
                </td>
                <td className="text-center py-4 text-xs font-black uppercase text-foreground">{opp.stage.replace('_', ' ')}</td>
                <td className="text-center py-4 text-xs font-black text-foreground uppercase pr-6">{opp.createdDate}</td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
