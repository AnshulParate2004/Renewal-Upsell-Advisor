import { useState } from "react";
import { GripVertical } from "lucide-react";
import { accounts, formatCurrency, getDaysUntil } from "@/data/mockData";

type Stage = "t90" | "t60" | "t30" | "renewed";

const stageConfig: Record<Stage, { title: string; borderColor: string; bgColor: string }> = {
  t90: { title: "T-90 Days", borderColor: "border-b-blue-600", bgColor: "bg-blue-50" },
  t60: { title: "T-60 Days", borderColor: "border-b-yellow-500", bgColor: "bg-yellow-50" },
  t30: { title: "T-30 Days", borderColor: "border-b-red-600", bgColor: "bg-red-50" },
  renewed: { title: "Renewed ✅", borderColor: "border-b-emerald-600", bgColor: "bg-emerald-50" },
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
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-foreground tracking-tight">Renewal Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage}
            className="min-w-[300px] flex-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage)}
          >
            <div className={`border-2 border-black dark:border-white border-b-[6px] ${stageConfig[stage].borderColor} bg-white dark:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]`}>
              <div className={`p-3 border-b-2 border-black dark:border-white ${stageConfig[stage].bgColor} dark:bg-gray-700`}>
                <p className="text-sm font-black uppercase tracking-wider text-black dark:text-white">{stageConfig[stage].title}</p>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-mono font-bold">{formatCurrency(stageArr(stage))}</span>
                  <span className="font-bold">{byStage(stage).length} accounts</span>
                </div>
              </div>
              <div className="p-3 space-y-3 min-h-[200px]">
                {byStage(stage).map((account) => {
                  const days = getDaysUntil(account.renewalDate);
                  return (
                    <div
                      key={account.id}
                      draggable
                      onDragStart={() => handleDragStart(account.id)}
                      className="cursor-grab rounded border-2 border-black dark:border-white bg-white dark:bg-gray-900 p-3 transition-all hover:-translate-y-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-black dark:text-white">{account.name}</p>
                          <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mt-0.5">{formatCurrency(account.arr)}</p>
                        </div>
                        <GripVertical className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase border-2 border-black ${account.riskScore >= 70
                          ? 'bg-red-600 text-white shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                          : 'bg-white text-green-700 shadow-[1px_1px_0px_0px_rgba(0,0,0,0.1)]'
                          }`}>
                          Risk: {account.riskScore}
                        </span>
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono">📅 {days}d</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
