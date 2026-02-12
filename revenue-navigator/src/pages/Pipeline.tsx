import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Phone, Mail, GripVertical } from "lucide-react";
import { accounts, formatCurrency, getRiskColor, getDaysUntil, type Account } from "@/data/mockData";

type Stage = "t90" | "t60" | "t30" | "renewed";

const stageConfig: Record<Stage, { title: string; color: string }> = {
  t90: { title: "T-90 Days", color: "border-t-info" },
  t60: { title: "T-60 Days", color: "border-t-warning" },
  t30: { title: "T-30 Days", color: "border-t-destructive" },
  renewed: { title: "Renewed ✅", color: "border-t-success" },
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
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Renewal Pipeline</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div
            key={stage}
            className="min-w-[300px] flex-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(stage)}
          >
            <Card className={`border-t-4 ${stageConfig[stage].color}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">{stageConfig[stage].title}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{formatCurrency(stageArr(stage))}</span>
                  <span>{byStage(stage).length} accounts</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[200px]">
                {byStage(stage).map((account) => {
                  const riskColor = getRiskColor(account.riskScore);
                  const days = getDaysUntil(account.renewalDate);
                  return (
                    <div
                      key={account.id}
                      draggable
                      onDragStart={() => handleDragStart(account.id)}
                      className="cursor-grab rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">{account.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{formatCurrency(account.arr)}</p>
                        </div>
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${riskColor === "destructive" ? "border-destructive text-destructive" : riskColor === "warning" ? "border-warning text-warning" : "border-success text-success"}`}
                        >
                          Risk: {account.riskScore}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">📅 {account.renewalDate}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1.5">
                        Last contact: {account.lastContact}
                      </p>
                      <div className="flex gap-1 mt-2">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"><Eye className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"><Phone className="h-3 w-3" /></Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]"><Mail className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
