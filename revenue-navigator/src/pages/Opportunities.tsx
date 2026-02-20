import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, BarChart3, Target, Plus, Loader2 } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useAccounts } from "@/hooks/useAccounts";

const typeBadge: Record<string, { label: string; color: string; bg: string }> = {
  renewal: { label: "Renewal", color: "text-primary", bg: "bg-primary/10" },
  upsell: { label: "Upsell", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  cross_sell: { label: "Cross-sell", color: "text-amber-600", bg: "bg-amber-500/10" },
};

const stageLabel: Record<string, string> = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  closed_won: "Won",
  closed_lost: "Lost",
};

export default function Opportunities() {
  const [typeFilter, setTypeFilter] = useState("all");
  const { data: opportunities = [], isLoading, error } = useOpportunities();
  const { data: accounts = [] } = useAccounts();

  const enrichedOpportunities = useMemo(() => {
    return opportunities.map(opp => {
      const account = accounts.find(a => a.id === opp.accountId);
      return { ...opp, accountName: account?.name || 'Unknown Account' };
    });
  }, [opportunities, accounts]);

  const filtered = useMemo(() => {
    return enrichedOpportunities.filter((o) => typeFilter === "all" || o.type === typeFilter);
  }, [enrichedOpportunities, typeFilter]);

  const totalPipeline = useMemo(() => enrichedOpportunities.reduce((s, o) => s + o.value, 0), [enrichedOpportunities]);
  const weightedValue = useMemo(() => enrichedOpportunities.reduce((s, o) => s + o.value * (o.probability / 100), 0), [enrichedOpportunities]);
  const avgDeal = enrichedOpportunities.length > 0 ? totalPipeline / enrichedOpportunities.length : 0;
  const conversionRate = Math.round((enrichedOpportunities.filter((o) => o.stage === "closed_won").length / enrichedOpportunities.length) * 100) || 15;

  const summaryMetrics = [
    { label: 'Pipeline Total', value: formatCurrency(totalPipeline), icon: <DollarSign size={16} />, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Weighted Forecast', value: formatCurrency(weightedValue), icon: <BarChart3 size={16} />, bg: 'bg-emerald-500/10', color: 'text-emerald-600' },
    { label: 'Avg Deal Size', value: formatCurrency(avgDeal), icon: <TrendingUp size={16} />, bg: 'bg-amber-500/10', color: 'text-amber-600' },
    { label: 'Conversion Rate', value: `${conversionRate}%`, icon: <Target size={16} />, bg: 'bg-primary/10', color: 'text-primary' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b-2 border-black px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Opportunities</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Strategic opportunity management</p>
          </div>
          <button className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
            <Plus className="w-3.5 h-3.5" /> New Opportunity
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isLoading ? (
            <div className="col-span-4 flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="ml-2.5 text-muted-foreground text-sm">Loading...</span>
            </div>
          ) : (
            summaryMetrics.map((m, i) => (
              <div key={i} className="bg-card rounded-xl border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                <div className={`w-9 h-9 border-2 border-black ${m.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <span className={m.color}>{m.icon}</span>
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight mb-0.5">{m.value}</div>
                <div className="text-xs text-muted-foreground">{m.label}</div>
              </div>
            ))
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-muted rounded-lg p-0.5 border-2 border-black">
            {(['all', 'renewal', 'upsell', 'cross_sell'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setTypeFilter(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${typeFilter === filter ? 'bg-card text-foreground shadow-sm border-2 border-black' : 'text-muted-foreground hover:text-foreground bg-transparent'}`}
              >
                {filter === 'all' ? 'All Types' : filter.replace('_', '-').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b-2 border-black">
              <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
                <th className="pl-5 py-3">Account</th>
                <th className="text-center py-3">Type</th>
                <th className="text-right py-3 pr-4">Value</th>
                <th className="text-center py-3">Probability</th>
                <th className="text-center py-3">Stage</th>
                <th className="text-center py-3 pr-5">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr className="border-b-2 border-black"><td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </td></tr>
              ) : error ? (
                <tr className="border-b-2 border-black"><td colSpan={6} className="p-0">
                  <EmptyState variant="not-found" title="Failed to Load" message="Failed to load opportunities." />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr className="border-b-2 border-black"><td colSpan={6} className="p-0">
                  <EmptyState variant="no-results" title="No Opportunities Found" message="Try adjusting your filters." />
                </td></tr>
              ) : (
                filtered.map((opp) => {
                  const badge = typeBadge[opp.type] || { label: opp.type, color: 'text-muted-foreground', bg: 'bg-muted' };
                  return (
                    <tr key={opp.id} className="hover:bg-muted/20 transition-colors group border-b-2 border-black">
                      <td className="pl-5 py-3.5 font-medium text-foreground group-hover:text-primary transition-colors">{opp.accountName}</td>
                      <td className="text-center py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="text-right py-3.5 font-medium text-foreground pr-4">{formatCurrency(opp.value)}</td>
                      <td className="text-center py-3.5">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden border border-black/10">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${opp.probability}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{opp.probability}%</span>
                        </div>
                      </td>
                      <td className="text-center py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${opp.stage === 'closed_won' ? 'bg-emerald-500/10 text-emerald-600' : opp.stage === 'closed_lost' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                          {stageLabel[opp.stage] || opp.stage}
                        </span>
                      </td>
                      <td className="text-center py-3.5 text-xs text-muted-foreground pr-5">{opp.createdDate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
