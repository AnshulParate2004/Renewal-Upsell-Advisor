import { Ticket, CheckCircle2, Heart, Activity, Smile, Link2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { accountCard, accountCardHeader, accountSectionTitle } from "./accountDetailStyles";
import type { Account } from "@/data/mockData";
import type { TicketStats } from "@/lib/api/accounts";

interface Props {
  account: Account;
  ticketStats?: TicketStats;
  ticketStatsLoading?: boolean;
  onAutomationChange: (enabled: boolean) => void;
  getSentimentLabel: (score: number) => string;
  getSentimentColor: (score: number) => string;
  getSentimentEmoji: (score: number) => string;
}

function ScoreBar({
  value,
  variant,
}: {
  value: number;
  variant: "health" | "relationship";
}) {
  const healthClass =
    value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-destructive";
  const barClass = variant === "health" ? healthClass : "bg-primary";
  return (
    <div className="h-2 bg-muted rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", barClass)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function AccountHealthSidebar({
  account,
  ticketStats,
  ticketStatsLoading,
  onAutomationChange,
  getSentimentLabel,
  getSentimentColor,
  getSentimentEmoji,
}: Props) {
  const churnPct = Math.round((account.churnProbability ?? 0) * 100);
  const openTickets = Math.max(0, (ticketStats?.raised ?? 0) - (ticketStats?.resolved ?? 0));

  return (
    <div className={accountCard}>
      <div className={accountCardHeader}>
        <Activity className="w-4 h-4 text-primary" />
        <h3 className={accountSectionTitle}>Account health</h3>
      </div>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-orange-50 border border-orange-200/80 p-3">
            <div className="flex items-center gap-1.5 text-orange-700 mb-1">
              <Ticket className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Raised</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {ticketStatsLoading ? "…" : ticketStats?.raised ?? 0}
            </p>
          </div>
          <div className="rounded-lg bg-emerald-50 border border-emerald-200/80 p-3">
            <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800">
              {ticketStatsLoading ? "…" : ticketStats?.resolved ?? 0}
            </p>
          </div>
        </div>
        {openTickets > 0 && (
          <p className="text-xs text-muted-foreground -mt-2">
            {openTickets} open ticket{openTickets !== 1 ? "s" : ""} remaining
          </p>
        )}

        <div className="space-y-4 pt-1 border-t border-black/8">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Heart className="w-3 h-3" /> Health score
              </span>
              <span className="text-lg font-bold">{account.healthScore}</span>
            </div>
            <ScoreBar value={account.healthScore} variant="health" />
          </div>

          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Relationship
              </span>
              <span className="text-lg font-bold text-primary">{account.relationshipScore}</span>
            </div>
            <ScoreBar value={account.relationshipScore} variant="relationship" />
          </div>

          <div className="rounded-lg bg-slate-900 text-white p-4">
            <p className="text-[11px] font-medium text-white/70 mb-1">Churn probability</p>
            <p className="text-3xl font-bold">{churnPct}%</p>
            <span className="inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15">
              {account.riskScore >= 70 ? "Needs attention" : "Stable"}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-black/10 bg-muted/30 px-3 py-3">
            <div>
              <p className="text-xs font-medium text-foreground">Automated rescue</p>
              <p className="text-[11px] text-muted-foreground">
                {account.automation_enabled !== false ? "Enabled" : "Paused"}
              </p>
            </div>
            <Switch
              checked={account.automation_enabled !== false}
              onCheckedChange={onAutomationChange}
            />
          </div>

          <div className="rounded-lg border border-black/10 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Smile className="w-3 h-3" /> Sentiment
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getSentimentEmoji(account.sentimentScore)}</span>
              <div>
                <p className={cn("font-semibold text-sm", getSentimentColor(account.sentimentScore))}>
                  {getSentimentLabel(account.sentimentScore)}
                </p>
                <p className="text-[11px] text-muted-foreground">Score {account.sentimentScore.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
