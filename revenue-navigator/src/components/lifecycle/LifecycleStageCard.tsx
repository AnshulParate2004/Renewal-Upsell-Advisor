import { cn } from "@/lib/utils";
import type { LifecycleAlert } from "@/types/lifecycle";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleStages";

interface Props {
  /** Representative alert for selection (agent panel); not shown in the card UI */
  alert: LifecycleAlert | undefined;
  stageId: LifecycleAlert["stage"];
  accountCount: number;
  isSelected: boolean;
  onSelect: () => void;
}

export function LifecycleStageCard({
  alert,
  stageId,
  accountCount,
  isSelected,
  onSelect,
}: Props) {
  const config = LIFECYCLE_STAGES.find((s) => s.id === stageId)!;
  const isEmpty = accountCount === 0;

  if (isEmpty) {
    return (
      <div
        className={cn(
          "rounded-xl border-2 border-dashed p-4 min-h-[160px] flex flex-col",
          config.borderClass
        )}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className={cn("w-2 h-2 rounded-full", config.accentClass)} />
          <span className="text-xs font-bold uppercase tracking-wider">{config.label}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">P{config.priority}</span>
        </div>
        <p className="text-4xl font-bold text-muted-foreground/40 tabular-nums">0</p>
        <p className="text-xs text-muted-foreground mt-auto">No accounts in this stage</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!alert}
      title={`${accountCount} account${accountCount !== 1 ? "s" : ""} in ${config.label}`}
      className={cn(
        "rounded-xl border-2 p-4 text-left min-h-[160px] flex flex-col transition-all w-full",
        "hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
        isSelected
          ? "border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-card"
          : "border-black/20 bg-card hover:border-black/60",
        !alert && "opacity-60 cursor-default"
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("w-2.5 h-2.5 rounded-full", config.accentClass)} />
        <span className="text-xs font-black uppercase tracking-wider">{config.label}</span>
        <span className="ml-auto text-[10px] font-bold text-muted-foreground">P{config.priority}</span>
      </div>
      <p className="text-4xl font-bold text-foreground tabular-nums">{accountCount}</p>
      <p className="text-sm text-muted-foreground mt-1">
        account{accountCount !== 1 ? "s" : ""} in bucket
      </p>
      <p className={cn("text-[10px] font-medium mt-auto pt-3", config.badgeClass, "inline-flex self-start px-2 py-0.5 rounded-full border")}>
        {config.label} stage
      </p>
    </button>
  );
}
