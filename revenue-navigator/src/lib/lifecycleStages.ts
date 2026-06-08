import type { LifecycleStageConfig } from "@/types/lifecycle";

/** UI styling for lifecycle stages — computation lives on backend. */
export const LIFECYCLE_STAGES: LifecycleStageConfig[] = [
  { id: "protect", label: "Protect", priority: 1, accentClass: "bg-red-500", borderClass: "border-red-500/40", badgeClass: "bg-red-100 text-red-800 border-red-300" },
  { id: "renew", label: "Renew", priority: 2, accentClass: "bg-blue-500", borderClass: "border-blue-500/40", badgeClass: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "adopt", label: "Adopt", priority: 3, accentClass: "bg-amber-500", borderClass: "border-amber-500/40", badgeClass: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "expand", label: "Expand", priority: 4, accentClass: "bg-emerald-500", borderClass: "border-emerald-500/40", badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "activate", label: "Activate", priority: 5, accentClass: "bg-slate-500", borderClass: "border-slate-400/40", badgeClass: "bg-slate-100 text-slate-800 border-slate-300" },
];
