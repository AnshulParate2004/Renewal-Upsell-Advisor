import { ArrowLeft, Building2, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LifecycleStageBadge } from "@/components/lifecycle/LifecycleStageBadge";
import type { ActionRecommendation } from "@/types/lifecycle";
import type { Account } from "@/data/mockData";

interface Props {
  account: Account;
  lifecycleRec?: ActionRecommendation | null;
  lifecycleLoading?: boolean;
}

export function AccountDetailHeader({ account, lifecycleRec, lifecycleLoading }: Props) {
  const navigate = useNavigate();

  return (
    <div className="border-b border-black/10 bg-card/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-md">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
                  {account.name}
                </h1>
                {lifecycleRec ? (
                  <LifecycleStageBadge stage={lifecycleRec.stage} label={lifecycleRec.stageLabel} size="md" />
                ) : lifecycleLoading ? (
                  <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {account.industry || "—"}
                <span className="mx-2 text-border">·</span>
                <span className="font-mono text-xs">{account.id.slice(0, 8)}…</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          >
            <Edit2 className="w-4 h-4" />
            Edit account
          </button>
        </div>
      </div>
    </div>
  );
}
