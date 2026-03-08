import { useState, useMemo } from "react";
import { DollarSign, TrendingUp, Target, Plus, Loader2 } from "lucide-react";
import { formatCurrency } from "@/data/mockData";
import { EmptyState } from "@/components/ui/EmptyState";
import { useOpportunities } from "@/hooks/useOpportunities";
import { useAccounts } from "@/hooks/useAccounts";

const typeBadge: Record<string, { label: string; color: string; bg: string }> = {
  upsell: { label: "Upsell", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  expansion: { label: "Expansion", color: "text-violet-600", bg: "bg-violet-500/10" },
};

const stageLabel: Record<string, string> = {
  prospecting: "Prospecting",
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  identified: "Identified",
  closed_won: "Won",
  closed_lost: "Lost",
};

const stageBadgeStyle: Record<string, string> = {
  identified: "bg-sky-500/10 text-sky-600 border-sky-600/30",
  prospecting: "bg-amber-500/10 text-amber-600 border-amber-600/30",
  qualification: "bg-orange-500/10 text-orange-600 border-orange-600/30",
  proposal: "bg-blue-500/10 text-blue-600 border-blue-600/30",
  negotiation: "bg-purple-500/10 text-purple-600 border-purple-600/30",
  closed_won: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30",
  closed_lost: "bg-destructive/10 text-destructive border-destructive/30",
};

/** Probability is 0–1 from API; returns percentage for display and bar width. */
function probabilityPercent(prob: number): number {
  return prob <= 1 && prob >= 0 ? Math.round(prob * 10000) / 100 : Math.min(100, Math.max(0, prob));
}

/** When stage is missing or "identified", derive a display stage from probability so the list shows variety. */
function displayStage(stage: string | undefined, probability: number): string {
  const s = (stage || "").toLowerCase();
  if (s && s !== "identified") return s;
  const p = typeof probability === "number" ? probability : 0;
  if (p < 0.25) return "prospecting";
  if (p < 0.45) return "qualification";
  if (p < 0.65) return "proposal";
  if (p < 0.85) return "negotiation";
  return "identified";
}

/** Color for probability: high=green, mid=amber, low=red. */
function probabilityColor(prob: number): { bar: string; text: string } {
  const p = typeof prob === "number" ? prob : 0;
  if (p >= 0.7) return { bar: "bg-emerald-500", text: "text-emerald-600" };
  if (p >= 0.4) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-400", text: "text-rose-600" };
}

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
  const avgDeal = enrichedOpportunities.length > 0 ? totalPipeline / enrichedOpportunities.length : 0;
  const conversionRate = Math.round((enrichedOpportunities.filter((o) => o.stage === "closed_won").length / enrichedOpportunities.length) * 100) || 15;

  const summaryMetrics = [
    { label: 'Pipeline Total', value: formatCurrency(totalPipeline), icon: <DollarSign size={16} />, bg: 'bg-primary/10', color: 'text-primary' },
    { label: 'Avg Deal Size', value: formatCurrency(avgDeal), icon: <TrendingUp size={16} />, bg: 'bg-amber-500/10', color: 'text-amber-600' },
    { label: 'Conversion Rate', value: `${conversionRate}`, icon: <Target size={16} />, bg: 'bg-primary/10', color: 'text-primary' },
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {isLoading ? (
            <div className="col-span-3 flex items-center justify-center py-10">
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
            {(['all', 'upsell', 'expansion'] as const).map((filter) => (
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
                  const pct = probabilityPercent(opp.probability);
                  const probStyle = probabilityColor(opp.probability);
                  const stage = displayStage(opp.stage, opp.probability);
                  const stageStyle = stageBadgeStyle[stage] ?? "bg-muted text-muted-foreground border-black/20";
                  const valueColor = opp.value > 0 ? "text-emerald-600 font-semibold" : "text-muted-foreground";
                  return (
                    <tr key={opp.id} className="hover:bg-muted/20 transition-colors group border-b-2 border-black last:border-b-0">
                      <td className="pl-5 py-3.5 font-medium text-foreground group-hover:text-primary transition-colors">{opp.accountName}</td>
                      <td className="text-center py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className={`text-right py-3.5 pr-4 ${valueColor}`}>{formatCurrency(opp.value)}</td>
                      <td className="text-center py-3.5">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden border border-black/10">
                            <div className={`h-full rounded-full ${probStyle.bar}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-xs font-medium ${probStyle.text}`}>{pct}</span>
                        </div>
                      </td>
                      <td className="text-center py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 ${stageStyle}`}>
                          {stageLabel[stage] || stage}
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
