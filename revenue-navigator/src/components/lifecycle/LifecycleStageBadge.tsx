import { cn } from "@/lib/utils";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleStages";
import type { LifecycleStageId } from "@/types/lifecycle";

interface LifecycleStageBadgeProps {
  stage: LifecycleStageId;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function LifecycleStageBadge({ stage, label, size = "sm", className }: LifecycleStageBadgeProps) {
  const config = LIFECYCLE_STAGES.find((s) => s.id === stage);
  if (!config) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold uppercase tracking-wider border rounded-md shrink-0",
        config.badgeClass,
        size === "sm" ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        className
      )}
      title={`Lifecycle bucket: ${label ?? config.label}`}
    >
      {label ?? config.label}
    </span>
  );
}
