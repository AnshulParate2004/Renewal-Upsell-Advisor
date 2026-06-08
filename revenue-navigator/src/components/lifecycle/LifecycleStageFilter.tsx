import { cn } from "@/lib/utils";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleEngine";
import type { LifecycleStageId } from "@/types/lifecycle";

export type StageFilter = LifecycleStageId | "all";

interface LifecycleStageFilterProps {
  value: StageFilter;
  onChange: (value: StageFilter) => void;
  counts: Record<StageFilter, number>;
}

export function LifecycleStageFilter({ value, onChange, counts }: LifecycleStageFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border-2 transition-all whitespace-nowrap",
          value === "all"
            ? "border-black bg-foreground text-background shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            : "border-black/20 text-muted-foreground hover:border-black/50 hover:text-foreground bg-card"
        )}
      >
        All
        <span className="ml-1 opacity-70">({counts.all})</span>
      </button>
      {LIFECYCLE_STAGES.map((stage) => (
        <button
          key={stage.id}
          type="button"
          onClick={() => onChange(stage.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border-2 transition-all whitespace-nowrap",
            value === stage.id
              ? cn("border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]", stage.badgeClass)
              : "border-black/20 text-muted-foreground hover:border-black/50 hover:text-foreground bg-card"
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", stage.accentClass)} />
          {stage.label}
          <span className="opacity-70">({counts[stage.id]})</span>
        </button>
      ))}
    </div>
  );
}
