import { Package, AlertTriangle, Layers, Users } from "lucide-react";
import type { PortfolioConsumption } from "@/lib/api/analytics";

interface Props {
  data: PortfolioConsumption;
}

export function ConsumptionMetricsCard({ data }: Props) {
  const items = [
    { label: "Avg Deployment", value: `${data.avg_deployment_pct}%`, icon: Layers, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Products at Risk", value: data.products_at_risk, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Unused Entitlements", value: data.unused_entitlements, icon: Package, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Needing Action", value: data.accounts_needing_action, icon: Users, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Consumption Health</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Product deployment across portfolio</p>
      </div>
      <div className="p-5 grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border-2 border-black/15 p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg shrink-0 ${item.bg} ${item.color} flex items-center justify-center`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-xl font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
