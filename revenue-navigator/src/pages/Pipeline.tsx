import { useState } from "react";
import { GripVertical, Clock, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency, getDaysUntil } from "@/data/mockData";
import { useAccounts } from "@/hooks/useAccounts";
import { useUpdateAccount } from "@/hooks/useAccounts";

type Stage = "t90" | "t60" | "t30" | "renewed";

const stageConfig: Record<Stage, { title: string; bgColor: string; icon: React.ReactNode }> = {
  t90: { title: "T-90_HORIZON", bgColor: "bg-secondary", icon: <Clock size={16} /> },
  t60: { title: "T-60_CRITICAL", bgColor: "bg-accent", icon: <Clock size={16} /> },
  t30: { title: "T-30_IMMEDIATE", bgColor: "bg-destructive", icon: <ShieldAlert size={16} /> },
  renewed: { title: "PERSISTED_RENEWAL", bgColor: "bg-primary", icon: <CheckCircle2 size={16} /> },
};

const stages: Stage[] = ["t90", "t60", "t30", "renewed"];

export default function Pipeline() {
  const { data: accounts = [], isLoading } = useAccounts();
  const updateAccount = useUpdateAccount();
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const byStage = (stage: Stage) => accounts.filter((a) => a.renewalStage === stage);
  const stageArr = (stage: Stage) => byStage(stage).reduce((s, a) => s + a.arr, 0);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (stage: Stage) => {
    if (!draggedId) return;
    // Update account via API
    updateAccount.mutate({
      id: draggedId,
      data: { renewalStage: stage }
    });
    setDraggedId(null);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b-4 border-foreground pb-8">
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tight leading-none uppercase">
            Persistence <span className="text-primary">Flow</span>
          </h1>
          <p className="text-sm font-black text-foreground/60 mt-3 uppercase tracking-wider">
            Temporal Renewal Matrix & Cohort Persistence Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-primary flex items-center gap-2 uppercase tracking-wider">
            <div className="w-2 h-2 bg-primary border border-foreground animate-pulse" />
            Active Pipeline Sync
          </span>
          <div className="sticker-outline px-4 py-2 text-xs font-black bg-white">
            STABILITY: 94% NOMINAL
          </div>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-foreground/60">Loading pipeline data...</span>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 snap-x custom-scrollbar">
          {stages.map((stage) => (
          <div
            key={stage}
            className="min-w-[340px] flex-1 snap-start flex flex-col gap-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 border-2 border-foreground rounded-lg ${stageConfig[stage].bgColor === 'bg-destructive' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`} style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                  {stageConfig[stage].icon}
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground tracking-tight uppercase leading-none">
                    {stageConfig[stage].title.replace('_', ' ')}
                  </h3>
                  <p className="text-[10px] font-black text-foreground/60 mt-1 uppercase tracking-widest">
                    Registry: {byStage(stage).length}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-white border-2 border-foreground rounded-lg text-[10px] font-black text-foreground uppercase" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                {formatCurrency(stageArr(stage))}
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 bg-gray-50/50 border-4 border-foreground rounded-lg p-4 space-y-4 min-h-[600px]">
              {byStage(stage).map((account) => {
                const days = getDaysUntil(account.renewalDate);
                const isCritical = account.riskScore >= 70;
                return (
                  <div
                    key={account.id}
                    draggable
                    onDragStart={() => handleDragStart(account.id)}
                    className="cursor-grab paper-card p-5 bg-white group transition-all active:cursor-grabbing relative overflow-hidden"
                  >
                    {isCritical && <div className="absolute top-0 left-0 w-2 h-full bg-red-500 border-r-2 border-foreground" />}

                    <div className="flex items-start justify-between mb-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-black text-foreground group-hover:text-primary transition-colors tracking-tight uppercase">{account.name}</p>
                        <p className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">{formatCurrency(account.arr)} ARR</p>
                      </div>
                      <div className="p-1.5 bg-white border-2 border-foreground rounded-lg opacity-20 group-hover:opacity-100 transition-opacity" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                        <GripVertical className="h-4 w-4 text-foreground" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      {isCritical ? (
                        <span className="badge-risk">CRITICAL</span>
                      ) : (
                        <span className="badge-safe">NOMINAL</span>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-foreground" />
                        <span className={`text-[10px] font-black tracking-widest uppercase ${days <= 30 ? 'text-red-500' : 'text-foreground/60'}`}>
                          T-{days}D
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {byStage(stage).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                  <div className="w-12 h-12 border-4 border-dashed border-foreground flex items-center justify-center text-xl font-black">+</div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em]">Zero_Nodes</p>
                </div>
              )}
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
