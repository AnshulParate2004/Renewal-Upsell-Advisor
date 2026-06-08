import { Gauge, AlertTriangle, PackageX, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  avgDeploymentPct: number;
  productsAtRisk: number;
  unusedEntitlements: number;
  accountsNeedingAction: number;
}

export function ConsumptionOverview({ avgDeploymentPct, productsAtRisk, unusedEntitlements, accountsNeedingAction }: Props) {
  const metrics = [
    { label: "Avg Deployment", value: `${avgDeploymentPct}%`, icon: Gauge, color: "text-sky-600", bg: "bg-sky-500/10" },
    { label: "Products At Risk", value: productsAtRisk, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Unused Entitlements", value: unusedEntitlements, icon: PackageX, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Need Action", value: accountsNeedingAction, icon: Zap, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((m, idx) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-card rounded-lg border-2 border-black/20 px-4 py-3 flex items-center gap-3"
        >
          <div className={`w-9 h-9 rounded-lg ${m.bg} ${m.color} flex items-center justify-center`}>
            <m.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-medium text-muted-foreground uppercase">{m.label}</p>
            <p className="text-lg font-bold">{m.value}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
