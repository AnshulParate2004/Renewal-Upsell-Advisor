import { useMemo } from "react";
import { DollarSign, TrendingUp, Clock, Loader2, RefreshCw } from "lucide-react";
import { formatCurrency, getRenewalInDays, type Account } from "@/data/mockData";
import { useOpportunities } from "@/hooks/useOpportunities";

const typeBadge: Record<string, { label: string; color: string; bg: string }> = {
  upsell: { label: "Upsell", color: "text-emerald-600", bg: "bg-emerald-500/10" },
  renewal: { label: "Renewal", color: "text-blue-600", bg: "bg-blue-500/10" },
  no_upsell: { label: "No upsell", color: "text-muted-foreground", bg: "bg-muted" },
};

const stageLabel: Record<string, string> = {
  prospecting: "Early stage",
  qualification: "Qualification",
  proposal: "Proposal",
  negotiation: "Negotiation",
  identified: "Identified",
  quote_sent: "Proposal",
  closed_won: "Won",
  closed_lost: "Lost",
  q1: "Q1 — Early",
  q2: "Q2 — Mid",
  q3: "Q3 — Late",
  q4: "Q4 — Critical",
  renewed: "Renewed",
  lost: "Lost",
};

const stageBadgeStyle: Record<string, string> = {
  identified: "bg-sky-500/10 text-sky-600 border-sky-600/30",
  prospecting: "bg-amber-500/10 text-amber-600 border-amber-600/30",
  qualification: "bg-orange-500/10 text-orange-600 border-orange-600/30",
  proposal: "bg-blue-500/10 text-blue-600 border-blue-600/30",
  quote_sent: "bg-blue-500/10 text-blue-600 border-blue-600/30",
  negotiation: "bg-purple-500/10 text-purple-600 border-purple-600/30",
  closed_won: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30",
  closed_lost: "bg-destructive/10 text-destructive border-destructive/30",
  q1: "bg-sky-500/10 text-sky-600 border-sky-600/30",
  q2: "bg-blue-500/10 text-blue-600 border-blue-600/30",
  q3: "bg-amber-500/10 text-amber-600 border-amber-600/30",
  q4: "bg-orange-500/10 text-orange-600 border-orange-600/30",
  renewed: "bg-emerald-500/10 text-emerald-600 border-emerald-600/30",
  lost: "bg-destructive/10 text-destructive border-destructive/30",
};

function probabilityPercent(prob: number): number {
  return prob <= 1 && prob >= 0 ? Math.round(prob * 10000) / 100 : Math.min(100, Math.max(0, prob));
}

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

function probabilityColor(prob: number): { bar: string; text: string } {
  const p = typeof prob === "number" ? prob : 0;
  if (p >= 0.7) return { bar: "bg-emerald-500", text: "text-emerald-600" };
  if (p >= 0.4) return { bar: "bg-amber-500", text: "text-amber-600" };
  return { bar: "bg-rose-400", text: "text-rose-600" };
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr || dateStr === "—") return "—";
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return dateStr.slice(0, 10);
  }
}

function formatRenewalStage(stage?: string): string {
  const s = (stage || "").toLowerCase();
  if (["q1", "q2", "q3", "q4"].includes(s)) return s;
  if (s === "renewed" || s === "lost") return s;
  if (s === "t30") return "q1";
  if (s === "t60") return "q2";
  if (s === "t90") return "q4";
  return s || "q3";
}

function renewalProbability(account: Account): number {
  const health = (account.healthScore ?? 50) / 100;
  const relationship = (account.relationshipScore ?? 50) / 100;
  return Math.min(1, Math.max(0, health * 0.8 + relationship * 0.2));
}

interface DetailRow {
  id: string;
  type: "upsell" | "renewal" | "no_upsell";
  value: number;
  probability: number;
  stage: string;
  date: string;
}

interface Props {
  account: Account;
}

export function AccountUpsellRenewalDetails({ account }: Props) {
  const { data: opportunities = [], isLoading } = useOpportunities();

  const accountOpps = useMemo(
    () => opportunities.filter((o) => o.accountId === account.id),
    [opportunities, account.id]
  );

  const upsellOpp = accountOpps[0];
  const upsellValue = upsellOpp
    ? (typeof upsellOpp.value === "number" ? upsellOpp.value : Number(upsellOpp.value ?? 0))
    : 0;
  const renewalValue = account.arr ?? (account.mrr != null ? account.mrr * 12 : 0);
  const renewalDays = getRenewalInDays(account.renewalDate, account.contractEnd, account.status) ?? 0;
  const renewProb = renewalProbability(account);

  const rows: DetailRow[] = useMemo(() => {
    const list: DetailRow[] = [];

    if (upsellOpp) {
      const rawValue = typeof upsellOpp.value === "number" ? upsellOpp.value : Number(upsellOpp.value ?? 0);
      list.push({
        id: upsellOpp.id,
        type: rawValue > 0 ? "upsell" : "no_upsell",
        value: rawValue,
        probability: upsellOpp.probability ?? 0,
        stage: displayStage(upsellOpp.stage, upsellOpp.probability ?? 0),
        date: upsellOpp.createdDate ?? "—",
      });
    } else {
      list.push({
        id: `${account.id}-no-upsell`,
        type: "no_upsell",
        value: 0,
        probability: 0,
        stage: "closed_lost",
        date: "—",
      });
    }

    list.push({
      id: `${account.id}-renewal`,
      type: "renewal",
      value: renewalValue,
      probability: renewProb,
      stage: formatRenewalStage(account.renewalStage),
      date: account.renewalDate || account.contractEnd || "—",
    });

    return list;
  }, [upsellOpp, account, renewalValue, renewProb]);

  const summaryMetrics = [
    {
      label: "Upsell Pipeline",
      value: formatCurrency(upsellValue),
      icon: <DollarSign size={16} />,
      bg: "bg-primary/10",
      color: "text-primary",
    },
    {
      label: "Renewal ARR",
      value: formatCurrency(renewalValue),
      icon: <TrendingUp size={16} />,
      bg: "bg-blue-500/10",
      color: "text-blue-600",
    },
    {
      label: "Renewal in Days",
      value: `${renewalDays} days`,
      icon: <Clock size={16} />,
      bg: renewalDays <= 30 ? "bg-red-500/10" : "bg-amber-500/10",
      color: renewalDays <= 30 ? "text-red-600" : "text-amber-600",
    },
  ];

  return (
    <div className="rounded-xl border border-black/10 bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-black/8 bg-muted/30 flex items-center gap-2">
        <RefreshCw className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Upsell & renewal</h3>
      </div>

      <div className="p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryMetrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-black/10 p-4 bg-muted/20"
          >
            <div className={`w-9 h-9 ${m.bg} rounded-lg flex items-center justify-center mb-2`}>
              <span className={m.color}>{m.icon}</span>
            </div>
            <div className="text-xl font-bold">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-black/10">
            <tr className="text-[11px] uppercase text-muted-foreground font-medium tracking-wider text-left">
              <th className="pl-5 py-3">Type</th>
              <th className="text-right py-3 pr-4">Value</th>
              <th className="text-center py-3">Probability</th>
              <th className="text-center py-3">Stage</th>
              <th className="text-center py-3 pr-5">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = typeBadge[row.type];
                const pct = probabilityPercent(row.probability);
                const probStyle = probabilityColor(row.probability);
                const stageStyle = stageBadgeStyle[row.stage] ?? "bg-muted text-muted-foreground border-black/20";
                const valueColor = row.value > 0 ? "text-emerald-600 font-semibold" : "text-muted-foreground";

                return (
                  <tr key={row.id} className="border-b border-black/8 last:border-b-0 hover:bg-muted/30">
                    <td className="pl-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border-2 border-black ${badge.bg} ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className={`text-right py-3.5 pr-4 ${valueColor}`}>{formatCurrency(row.value)}</td>
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
                        {stageLabel[row.stage] || row.stage}
                      </span>
                    </td>
                    <td className="text-center py-3.5 text-xs text-muted-foreground pr-5">{formatDisplayDate(row.date)}</td>
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
