import { useMemo, useState } from "react";
import { GripVertical, Clock, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency, getDaysUntil, getRenewalStageFromPlan } from "@/data/mockData";
import { useAccounts } from "@/hooks/useAccounts";
import { useUpdateAccount } from "@/hooks/useAccounts";
import { useAppSettings } from "@/hooks/useSettings";

type Stage = "t90" | "t60" | "t30" | "renewed";

const stages: Stage[] = ["t90", "t60", "t30", "renewed"];

/** Default column titles when milestones not yet loaded. */
const defaultStageConfig: Record<Stage, { title: string; color: string; icon: React.ReactNode }> = {
  t90: { title: "60%+", color: "text-primary", icon: <Clock size={14} /> },
  t60: { title: "30–60%", color: "text-amber-500", icon: <Clock size={14} /> },
  t30: { title: "0–30%", color: "text-destructive", icon: <ShieldAlert size={14} /> },
  renewed: { title: "Renewed", color: "text-emerald-600", icon: <CheckCircle2 size={14} /> },
};

export default function Pipeline() {
  const { data: accounts = [], isLoading } = useAccounts();
  const { data: appSettings } = useAppSettings();
  const updateAccount = useUpdateAccount();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const stageOptions = useMemo(() => {
    const schedule = appSettings?.schedule;
    const metrics = appSettings?.metrics;
    return {
      milestonePercents: (metrics?.callMilestonePercents?.length ? metrics.callMilestonePercents : [30, 60, 90, 95]) as number[],
      reminderDaysBeforeRenewal: schedule?.reminderDaysBeforeRenewal ?? 1,
    };
  }, [appSettings]);

  const stageConfig = useMemo(() => {
    const m = stageOptions.milestonePercents;
    const m0 = m[0] ?? 30;
    const m1 = m.length >= 2 ? (m[1] ?? 60) : 100;
    return {
      t30: { ...defaultStageConfig.t30, title: `0–${m0}%` },
      t60: { ...defaultStageConfig.t60, title: `${m0}–${m1}%` },
      t90: { ...defaultStageConfig.t90, title: `${m1}%+` },
      renewed: defaultStageConfig.renewed,
    };
  }, [stageOptions.milestonePercents]);

  const byStage = (stage: Stage) =>
    accounts.filter((a) => getRenewalStageFromPlan(a.contractStart, a.renewalDate, a.status, stageOptions) === stage);
  const stageArr = (stage: Stage) => byStage(stage).reduce((s, a) => s + a.arr, 0);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (stage: Stage) => {
    if (!draggedId) return;
    updateAccount.mutate({ id: draggedId, data: { renewalStage: stage } });
    setDraggedId(null);
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">
      {/* Page Header */}
      <div className="bg-card border-b-2 border-black px-6 py-5 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Renewal Pipeline</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Drag accounts between stages to update status</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-primary flex items-center gap-2 px-3 py-1.5 bg-background border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Live sync
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 max-w-[1600px] mx-auto w-full">

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground text-sm">Loading pipeline...</span>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-8 snap-x">
            {stages.map((stage) => (
              <div
                key={stage}
                className="min-w-[300px] flex-1 snap-start flex flex-col gap-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={stageConfig[stage].color}>{stageConfig[stage].icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{stageConfig[stage].title}</h3>
                      <p className="text-[11px] text-muted-foreground">{byStage(stage).length} accounts</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border-2 border-black">
                    {formatCurrency(stageArr(stage))}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-muted/30 border-2 border-black rounded-xl p-3 space-y-3 min-h-[500px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {byStage(stage).map((account) => {
                    const days = getDaysUntil(account.renewalDate);
                    const isRenewed = stage === "renewed";
                    const isCritical = account.riskScore >= 70;
                    const renewalLabel = isRenewed
                      ? (days < 0 ? `${Math.abs(days)}d since renewal` : "Renewed")
                      : `${days}d to renewal`;
                    const renewalBadgeStyle = isRenewed
                      ? "text-emerald-600 bg-emerald-500/10"
                      : days <= 30
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground bg-muted/50";
                    return (
                      <div
                        key={account.id}
                        draggable
                        onDragStart={() => handleDragStart(account.id)}
                        className="cursor-grab bg-card border-2 border-black rounded-xl p-4 group transition-all active:cursor-grabbing relative overflow-hidden"
                      >
                        {isCritical && !isRenewed && <div className="absolute top-0 left-0 w-1 h-full bg-destructive rounded-l-xl" />}

                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{account.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(account.arr)} ARR</p>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-opacity" />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border-2 border-black ${isCritical && !isRenewed ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                            {isCritical && !isRenewed ? 'Critical' : 'Healthy'}
                          </span>
                          <span className={`text-xs font-medium border-2 border-black px-2 py-0.5 rounded ${renewalBadgeStyle}`}>
                            {renewalLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {byStage(stage).length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-16">
                      <div className="w-10 h-10 border-2 border-dashed border-black rounded-xl flex items-center justify-center text-muted-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Plus className="w-4 h-4" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">No accounts</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
