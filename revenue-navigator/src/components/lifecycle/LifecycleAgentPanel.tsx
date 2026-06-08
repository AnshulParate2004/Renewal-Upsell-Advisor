import { Link, useNavigate } from "react-router-dom";
import { Mail, Calendar, ExternalLink, Clock, FileText, Package, Bot, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LifecycleAlert, AgentRecommendation } from "@/types/lifecycle";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleStages";
import { useRevenue } from "@/contexts/RevenueContext";
import { formatAccountRevenue } from "@/lib/revenueUtils";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Props {
  alert: LifecycleAlert | null;
  recommendation: AgentRecommendation | null;
  emptyMessage?: string;
}

const assetIcons = { guide: FileText, kit: Package, template: Mail };

export function LifecycleAgentPanel({ alert, recommendation, emptyMessage }: Props) {
  const { revenueType } = useRevenue();
  const navigate = useNavigate();
  const accountPath = `/app/accounts/${alert?.account.id ?? ""}`;

  const goToAccount = (focus?: "call" | "email" | "message") => {
    if (!alert?.account.id) return;
    const url = focus ? `${accountPath}?focus=${focus}` : accountPath;
    navigate(url);
  };

  if (!alert || !recommendation) {
    return (
      <div className="bg-card rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center min-h-[360px]">
        <p className="text-sm text-muted-foreground text-center px-6">
          {emptyMessage ?? "Select a lifecycle card to view agent recommendations"}
        </p>
      </div>
    );
  }

  const stage = LIFECYCLE_STAGES.find((s) => s.id === alert.stage)!;
  const { account, healthStatus, consumption, contractMonth, contractTotalMonths } = alert;

  return (
    <div className="bg-card rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[360px] overflow-hidden">
      <div className="px-4 py-3 border-b-2 border-black flex items-center gap-2 bg-gradient-to-r from-primary/5 to-transparent">
        <Bot className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold">Lifecycle Agent</h2>
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", stage.badgeClass)}>
          {alert.stageLabel}
        </span>
        <Sparkles className="w-3.5 h-3.5 text-amber-500 ml-auto" />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div>
          <Link
            to={accountPath}
            className="font-bold hover:text-primary transition-colors underline-offset-2 hover:underline"
          >
            {account.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatAccountRevenue(account, revenueType)} · Month {contractMonth}/{contractTotalMonths} · {healthStatus}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Consumption</p>
          {consumption.filter((p) => p.purchased).map((product) => (
            <div key={product.productId}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-medium truncate pr-2">{product.name}</span>
                <span className={cn(
                  "font-bold shrink-0",
                  product.currentPct < product.targetPct * 0.6 ? "text-red-600" :
                  product.currentPct < product.targetPct ? "text-amber-600" : "text-emerald-600"
                )}>
                  {product.currentPct}% / {product.targetPct}%
                </span>
              </div>
              <Progress value={product.currentPct} className="h-1.5" />
              {!product.deployed && <p className="text-[10px] text-red-600 mt-0.5">Purchased — not deployed</p>}
            </div>
          ))}
        </div>

        <div className="bg-muted/40 rounded-lg border p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Data Insight</p>
          <p className="text-xs">{recommendation.dataInsight}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Recommended Actions</p>
          <ol className="space-y-1.5">
            {recommendation.actions.map((action, i) => (
              <li key={i} className="flex gap-2 text-xs">
                <span className="font-bold text-primary">{i + 1}.</span>{action}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Asset Bundle</p>
          <div className="flex flex-wrap gap-2">
            {recommendation.assets.map((asset) => {
              const Icon = assetIcons[asset.type];
              return (
                <button key={asset.label} type="button" className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg border-2 border-black/20 hover:border-black">
                  <Icon className="w-3 h-3" />{asset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button
            size="sm"
            type="button"
            className="h-8 text-xs gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            onClick={() => goToAccount("email")}
          >
            <Mail className="w-3 h-3" /> Send email
          </Button>
          <Button
            size="sm"
            type="button"
            variant="outline"
            className="h-8 text-xs gap-1.5 border-2 border-black"
            onClick={() => goToAccount("call")}
          >
            <Calendar className="w-3 h-3" /> Schedule call
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-2 border-black" asChild>
            <Link to={accountPath}>
              <ExternalLink className="w-3 h-3" /> View account
            </Link>
          </Button>
          <Button
            size="sm"
            type="button"
            variant="ghost"
            className="h-8 text-xs gap-1.5 text-muted-foreground"
            onClick={() => goToAccount()}
          >
            <Clock className="w-3 h-3" /> Snooze 7 days
          </Button>
        </div>
      </div>
    </div>
  );
}
