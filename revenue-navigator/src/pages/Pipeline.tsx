import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, ShieldAlert, Loader2, Settings } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useRevenue } from "@/contexts/RevenueContext";
import { useLifecycleDashboard } from "@/hooks/useLifecycleDashboard";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleStages";
import type { LifecycleStageConfig } from "@/types/lifecycle";
import {
  LifecycleStageFilter,
  type StageFilter,
} from "@/components/lifecycle/LifecycleStageFilter";
import { QuarterlyFlowSheet } from "@/components/QuarterlyFlowSheet";
import { getPipelineType, workflowStageForQuarter } from "@/lib/pipelineConfig";
import { cn } from "@/lib/utils";
import {
  QUARTERS,
  RISK_COLUMNS,
  buildQuarterLifecycleBuckets,
  buildRiskColumnLifecycleBuckets,
  sumBucketsAcrossQuarters,
  sumBucketsAcrossRiskColumns,
  type BucketStats,
  type QuarterId,
  type RiskColumnId,
} from "@/lib/quarterLifecycleBuckets";
import { formatCurrency } from "@/data/mockData";
import type { LifecycleStageId } from "@/types/lifecycle";

const QUARTER_ICONS: Record<QuarterId, typeof CheckCircle2> = {
  q1: CheckCircle2,
  q2: Clock,
  q3: Clock,
  q4: Clock,
};

function LifecycleBucketCards({
  buckets,
  columnTotal,
  columnLabel,
  stageFilter,
  onStageFilter,
  revenueLabel,
  visibleStages,
}: {
  buckets: Record<LifecycleStageId, BucketStats>;
  columnTotal: { count: number; revenue: number };
  columnLabel: string;
  stageFilter: StageFilter;
  onStageFilter: (stage: StageFilter) => void;
  revenueLabel: string;
  visibleStages: LifecycleStageConfig[];
}) {
  return (
    <>
      {visibleStages.map((stage) => {
        const bucket = buckets[stage.id as LifecycleStageId];
        const count = bucket.count;
        const revenue = bucket.revenue;
        const sharePct = columnTotal.count ? Math.round((count / columnTotal.count) * 100) : 0;
        const dimmed = stageFilter !== "all" && stageFilter !== stage.id;

        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => onStageFilter(stage.id)}
            className={cn(
              "w-full rounded-lg border border-black/15 bg-card p-3 text-left transition-all hover:shadow-sm",
              dimmed && "opacity-35",
              stageFilter === stage.id && "ring-2 ring-black ring-offset-1",
              stage.borderClass
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={cn(
                  "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border",
                  stage.badgeClass
                )}
              >
                {stage.label}
              </span>
              <span className="text-lg font-bold tabular-nums">{count}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {count === 1 ? "account" : "accounts"} · {formatCurrency(revenue)}
            </p>
            {columnTotal.count > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {sharePct}% of {columnLabel} · {revenueLabel}
              </p>
            )}
          </button>
        );
      })}
    </>
  );
}

export default function Pipeline() {
  const { revenueType } = useRevenue();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: lifecycle, isLoading: lifecycleLoading } = useLifecycleDashboard(accounts);

  const [viewType, setViewType] = useState<"quarterly" | "risk">("quarterly");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [flowSheetStage, setFlowSheetStage] = useState<string | null>(null);

  const pipelineVendor = getPipelineType();
  const isMonthly = revenueType === "MRR";

  const isRiskView = viewType === "risk";
  const isLoading = accountsLoading || (lifecycleLoading && !lifecycle);

  const { byQuarter, quarterTotals } = useMemo(
    () => buildQuarterLifecycleBuckets(lifecycle?.accountAlerts, revenueType),
    [lifecycle?.accountAlerts, revenueType]
  );

  const { byColumn, columnTotals } = useMemo(
    () => buildRiskColumnLifecycleBuckets(lifecycle?.accountAlerts, revenueType),
    [lifecycle?.accountAlerts, revenueType]
  );

  const stageCounts = useMemo(() => {
    if (isRiskView) {
      const perStage = sumBucketsAcrossRiskColumns(byColumn);
      const total = RISK_COLUMNS.reduce((sum, col) => sum + columnTotals[col.id].count, 0);
      return {
        all: total,
        protect: perStage.protect,
        renew: perStage.renew,
        adopt: perStage.adopt,
        expand: perStage.expand,
        activate: perStage.activate,
      };
    }
    const perStage = sumBucketsAcrossQuarters(byQuarter);
    const quarterTotal = QUARTERS.reduce((sum, q) => sum + quarterTotals[q.id].count, 0);
    const fromLifecycle = lifecycle?.stageCounts;
    return {
      all: quarterTotal,
      protect: fromLifecycle?.protect ?? perStage.protect,
      renew: fromLifecycle?.renew ?? perStage.renew,
      adopt: fromLifecycle?.adopt ?? perStage.adopt,
      expand: fromLifecycle?.expand ?? perStage.expand,
      activate: fromLifecycle?.activate ?? perStage.activate,
    };
  }, [isRiskView, byQuarter, quarterTotals, byColumn, columnTotals, lifecycle?.stageCounts, lifecycle?.accountAlerts?.length]);

  const visibleLifecycleStages = useMemo(() => {
    if (stageFilter === "all") return LIFECYCLE_STAGES;
    return LIFECYCLE_STAGES.filter((s) => s.id === stageFilter);
  }, [stageFilter]);

  const totalAccounts = stageCounts.all;
  const revenueLabel = revenueType === "MRR" ? "MRR" : "ARR";

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      <div className="bg-card border-b-2 border-black px-6 py-5 shrink-0 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Customer Lifecycle</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRiskView
                ? `Risk pipeline — Critical & Not Renewed · ${totalAccounts} at-risk accounts`
                : `Quarterly pipeline — Q1–Q4 · ${totalAccounts} accounts`}
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center p-1 bg-muted rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <button
                type="button"
                onClick={() => {
                  setViewType("quarterly");
                  setStageFilter("all");
                }}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  viewType === "quarterly"
                    ? "bg-white text-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Quarterly pipeline
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewType("risk");
                  setStageFilter("all");
                }}
                className={cn(
                  "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
                  viewType === "risk"
                    ? "bg-white text-destructive shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Risk pipeline
              </button>
            </div>
            <span className="text-xs font-medium text-primary flex items-center gap-2 px-3 py-1.5 bg-background border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Live sync
            </span>
            <Link
              to="/app/settings"
              className="p-2 bg-white text-muted-foreground hover:text-foreground border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              title="Settings"
            >
              <Settings size={16} />
            </Link>
          </div>
        </div>

        {!isLoading && (
          <div className="pt-1 border-t border-black/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Filter by lifecycle bucket
            </p>
            <LifecycleStageFilter
              value={stageFilter}
              onChange={setStageFilter}
              counts={stageCounts}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-6 max-w-[1600px] mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground text-sm">Loading pipeline…</span>
          </div>
        ) : isRiskView ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pb-8">
            {RISK_COLUMNS.map((column) => {
              const totals = columnTotals[column.id];
              return (
                <div key={column.id} className="flex flex-col gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg border border-black/15",
                      column.headerBg
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldAlert className={cn("w-4 h-4 shrink-0", column.accentClass)} />
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{column.label}</h3>
                        <p className="text-[10px] text-muted-foreground">{column.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{totals.count} accounts</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(totals.revenue)}</p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex-1 bg-muted/30 border-2 border-black rounded-xl p-3 space-y-2 min-h-[420px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                      column.borderClass
                    )}
                  >
                    <LifecycleBucketCards
                      buckets={byColumn[column.id as RiskColumnId]}
                      columnTotal={totals}
                      columnLabel={column.label}
                      stageFilter={stageFilter}
                      onStageFilter={setStageFilter}
                      revenueLabel={revenueLabel}
                      visibleStages={visibleLifecycleStages}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-8 snap-x">
            {QUARTERS.map((quarter) => {
              const totals = quarterTotals[quarter.id];
              const QuarterIcon = QUARTER_ICONS[quarter.id];

              return (
                <div
                  key={quarter.id}
                  className="min-w-[280px] w-full max-w-[320px] shrink-0 xl:shrink xl:max-w-none flex-1 basis-0 snap-start flex flex-col gap-3"
                >
                  <div
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg border border-black/15",
                      quarter.headerBg
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={quarter.accentClass}>
                        <QuarterIcon size={16} />
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          {quarter.label}
                          <button
                            type="button"
                            onClick={() =>
                              setFlowSheetStage(workflowStageForQuarter(pipelineVendor, quarter.id))
                            }
                            className="p-1 rounded hover:bg-black/5 text-muted-foreground hover:text-foreground transition-colors"
                            title={`Configure ${quarter.label} pipeline workflow`}
                          >
                            <Settings size={12} />
                          </button>
                        </h3>
                        <p className="text-[10px] text-muted-foreground">{quarter.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{totals.count} accounts</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(totals.revenue)}</p>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "flex-1 bg-muted/30 border-2 border-black rounded-xl p-3 space-y-2 min-h-[420px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
                      quarter.borderClass
                    )}
                  >
                    <LifecycleBucketCards
                      buckets={byQuarter[quarter.id]}
                      columnTotal={totals}
                      columnLabel={quarter.label}
                      stageFilter={stageFilter}
                      onStageFilter={setStageFilter}
                      revenueLabel={revenueLabel}
                      visibleStages={visibleLifecycleStages}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <QuarterlyFlowSheet
        stage={flowSheetStage}
        isOpen={flowSheetStage !== null}
        onOpenChange={(open) => {
          if (!open) setFlowSheetStage(null);
        }}
        isMonthly={isMonthly}
      />
    </div>
  );
}
