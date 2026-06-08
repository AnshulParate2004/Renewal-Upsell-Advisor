import { Progress } from "@/components/ui/progress";
import type { AnalyticsGoals } from "@/lib/api/analytics";
import { formatCurrency } from "@/data/mockData";

interface Props {
  goals: AnalyticsGoals;
}

function GoalRow({
  label,
  actual,
  target,
  format = "number",
}: {
  label: string;
  actual: number;
  target: number;
  format?: "number" | "currency" | "percent";
}) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  const displayActual =
    format === "currency" ? formatCurrency(actual) : format === "percent" ? `${actual}%` : actual;
  const displayTarget =
    format === "currency" ? formatCurrency(target) : format === "percent" ? `${target}%` : target;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {displayActual} / {displayTarget}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export function GoalsProgressCard({ goals }: Props) {
  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Goals vs Actual</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Targets from Settings</p>
      </div>
      <div className="p-5 space-y-5">
        <GoalRow
          label="Upsell Pipeline"
          actual={goals.upsell_pipeline_actual}
          target={goals.upsell_pipeline_target}
          format="currency"
        />
        <GoalRow
          label="Renewal Rate"
          actual={goals.renewal_rate_percent}
          target={goals.renewal_target_percent}
          format="percent"
        />
        <GoalRow
          label="High-Risk Accounts (lower is better)"
          actual={goals.high_risk_count}
          target={Math.max(1, goals.high_risk_threshold_percent / 10)}
          format="number"
        />
      </div>
    </div>
  );
}
