import { useState } from "react";
import { GripVertical, Clock, DollarSign, ShieldAlert, CheckCircle2 } from "lucide-react";
import { accounts, formatCurrency, getDaysUntil } from "@/data/mockData";

type Stage = "t90" | "t60" | "t30" | "renewed";

const stageConfig: Record<Stage, { title: string; bgColor: string; icon: React.ReactNode }> = {
  t90: { title: "T-90_HORIZON", bgColor: "bg-secondary", icon: <Clock size={16} /> },
  t60: { title: "T-60_CRITICAL", bgColor: "bg-accent", icon: <Clock size={16} /> },
  t30: { title: "T-30_IMMEDIATE", bgColor: "bg-destructive", icon: <ShieldAlert size={16} /> },
  renewed: { title: "PERSISTED_RENEWAL", bgColor: "bg-primary", icon: <CheckCircle2 size={16} /> },
};

const stages: Stage[] = ["t90", "t60", "t30", "renewed"];

export default function Pipeline() {
  const [accountData, setAccountData] = useState(accounts);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const byStage = (stage: Stage) => accountData.filter((a) => a.renewalStage === stage);
  const stageArr = (stage: Stage) => byStage(stage).reduce((s, a) => s + a.arr, 0);

  const handleDragStart = (id: string) => setDraggedId(id);

  const handleDrop = (stage: Stage) => {
    if (!draggedId) return;
    setAccountData((prev) =>
      prev.map((a) => (a.id === draggedId ? { ...a, renewalStage: stage } : a))
    );
    setDraggedId(null);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-5xl font-bold text-foreground tracking-tight leading-none">
            Persistence <span className="text-primary">Flow</span>
          </h1>
          <p className="text-sm font-medium text-gray-500 mt-3">
            Temporal Renewal Matrix & Cohort Persistence Analysis
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold text-primary flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Active Pipeline Sync
          </span>
          <div className="sticker-outline px-4 py-2 text-xs font-bold bg-white">
            STABILITY: 94% NOMINAL
          </div>
        </div>
      </div>

      {/* Board */}
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
                <div className={`p-2 rounded-lg ${stageConfig[stage].bgColor === 'bg-destructive' ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary'} border border-gray-100 shadow-sm`}>
                  {stageConfig[stage].icon}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground tracking-tight uppercase leading-none">
                    {stageConfig[stage].title.replace('_', ' ')}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                    Registry: {byStage(stage).length}
                  </p>
                </div>
              </div>
              <div className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 shadow-sm">
                {formatCurrency(stageArr(stage))}
              </div>
            </div>

            {/* Column Body */}
            <div className="flex-1 bg-gray-50/50 rounded-2xl border border-gray-100 p-4 space-y-4 min-h-[600px] shadow-inner">
              {byStage(stage).map((account) => {
                const days = getDaysUntil(account.renewalDate);
                const isCritical = account.riskScore >= 70;
                return (
                  <div
                    key={account.id}
                    draggable
                    onDragStart={() => handleDragStart(account.id)}
                    className="cursor-grab paper-card p-5 bg-white group transition-all hover:shadow-xl hover:shadow-purple-900/5 active:cursor-grabbing border border-gray-100 shadow-sm relative overflow-hidden"
                  >
                    {isCritical && <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />}

                    <div className="flex items-start justify-between mb-6">
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{account.name}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatCurrency(account.arr)} ARR</p>
                      </div>
                      <div className="p-1.5 bg-gray-50 rounded-lg border border-gray-100 opacity-20 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto">
                      {isCritical ? (
                        <span className="badge-risk">CRITICAL</span>
                      ) : (
                        <span className="badge-safe">NOMINAL</span>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${days <= 30 ? 'text-red-500' : 'text-gray-400'}`}>
                          T-{days}D
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {byStage(stage).length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                  <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center text-xl font-bold">+</div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em]">Zero_Nodes</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
