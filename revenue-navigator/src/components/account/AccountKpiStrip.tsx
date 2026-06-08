import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { accountCard } from "./accountDetailStyles";

export interface KpiItem {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  alert?: boolean;
}

interface Props {
  items: KpiItem[];
}

export function AccountKpiStrip({ items }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {items.map((m) => (
        <div
          key={m.label}
          className={cn(accountCard, "p-4 flex flex-col gap-2 hover:border-black/20 transition-colors")}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60", m.accent)}>
              {m.icon}
            </span>
            <span className="text-[11px] font-medium leading-tight">{m.label}</span>
          </div>
          <p
            className={cn(
              "text-xl font-bold tracking-tight pl-0.5",
              m.alert ? "text-destructive" : "text-foreground"
            )}
          >
            {m.value}
          </p>
        </div>
      ))}
    </div>
  );
}
