import { useMemo, useState } from "react";
import { GripVertical, Clock, ShieldAlert, CheckCircle2, Loader2, Settings } from "lucide-react";
import { formatCurrency, getDaysUntil, getRenewalInDays, getRenewalStageFromPlan } from "@/data/mockData";
import { useAccounts } from "@/hooks/useAccounts";
import { useUpdateAccount } from "@/hooks/useAccounts";
import { useAppSettings } from "@/hooks/useSettings";
import { useRevenue } from "@/contexts/RevenueContext";
import { QuarterlyFlowSheet } from "@/components/QuarterlyFlowSheet";

type Stage = "q1" | "q2" | "q3" | "q4" | "no_renewed";

const stages: Stage[] = ["q1", "q2", "q3", "q4", "no_renewed"];

const stageConfig: Record<Stage, { title: string; color: string; icon: React.ReactNode }> = {
  q1: { title: "Q1", color: "text-emerald-500", icon: <CheckCircle2 size={14} /> },
  q2: { title: "Q2", color: "text-blue-500", icon: <Clock size={14} /> },
  q3: { title: "Q3", color: "text-amber-500", icon: <Clock size={14} /> },
  q4: { title: "Q4", color: "text-destructive", icon: <ShieldAlert size={14} /> },
  no_renewed: { title: "Not Renewed", color: "text-destructive", icon: <ShieldAlert size={14} /> },
};

export default function Pipeline() {
  const { data: accounts = [], isLoading } = useAccounts();
  const updateAccount = useUpdateAccount();
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [flowModalOpen, setFlowModalOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<Stage | null>(null);
  const { revenueType } = useRevenue();

  const byStage = (stage: Stage) =>
    accounts.filter((a) => getRenewalStageFromPlan(a.contractStart, a.renewalDate, a.status, undefined, a.contractEnd, a.renewalStage) === stage);
  const stageArr = (stage: Stage) => byStage(stage).reduce((s, a) => s + a.arr, 0);
  const stageMrr = (stage: Stage) => byStage(stage).reduce((s, a) => s + (a.mrr || 0), 0);

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
                className="min-w-[300px] w-full max-w-[350px] shrink-0 xl:shrink xl:max-w-none flex-1 basis-0 snap-start flex flex-col gap-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={stageConfig[stage].color}>{stageConfig[stage].icon}</span>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {stageConfig[stage].title}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuarter(stage);
                            setFlowModalOpen(true);
                          }}
                          className="px-1.5 py-1 hover:bg-black/5 rounded-md transition-colors text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                          title={`Configure ${stageConfig[stage].title} Flow`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{byStage(stage).length} accounts</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border-2 border-black">
                    {formatCurrency(revenueType === 'MRR' ? stageMrr(stage) : stageArr(stage))}
                  </span>
                </div>

                {/* Column Body */}
                <div className="flex-1 bg-muted/30 border-2 border-black rounded-xl p-3 space-y-3 min-h-[500px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {byStage(stage).map((account) => {
                    const renewalDays = getRenewalInDays(account.renewalDate, account.contractEnd, account.status);
                    const days = renewalDays ?? getDaysUntil(account.renewalDate ?? "");
                    const statusLower = (account.status ?? "").toString().trim().toLowerCase();
                    const renewalStageLower = (account.renewalStage ?? "").toString().trim().toLowerCase();
                    const isRenewed = statusLower === "renewed" || statusLower === "renewal" || renewalStageLower === "renewed";
                    const isCritical = account.riskScore >= 70;
                    // Renewed: show "Renewed" + "Xd to apply renewal" (green); else "Xd to renewal"
                    const renewalLabel = isRenewed
                      ? (renewalDays != null ? `${renewalDays}d to apply renewal` : "Renewed")
                      : (renewalDays != null ? `${renewalDays}d to renewal` : `${days}d to renewal`);
                    const renewalBadgeStyle = isRenewed
                      ? "text-emerald-600 bg-emerald-500/10"
                      : (renewalDays ?? days) <= 30
                        ? "text-destructive bg-destructive/10"
                        : "text-muted-foreground bg-muted/50";
                    return (
                      <div
                        key={account.id}
                        draggable
                        onDragStart={() => handleDragStart(account.id)}
                        className={`cursor-grab bg-card border-2 border-black rounded-xl p-4 group transition-all active:cursor-grabbing relative overflow-hidden ${isRenewed ? "border-l-4 border-l-emerald-500" : ""}`}
                      >
                        {isCritical && !isRenewed && <div className="absolute top-0 left-0 w-1 h-full bg-destructive rounded-l-xl" />}

                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{account.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatCurrency(revenueType === 'MRR' ? (account.mrr || account.arr / 12) : account.arr)} {revenueType}
                            </p>
                          </div>
                          <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-opacity" />
                        </div>

                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          {isRenewed && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border-2 border-black bg-emerald-500/10 text-emerald-600">
                              Renewed
                            </span>
                          )}
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

      {/* Quarterly Flow Modal */}
      <QuarterlyFlowSheet
        stage={selectedQuarter}
        isOpen={flowModalOpen}
        onOpenChange={setFlowModalOpen}
      />
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
}
