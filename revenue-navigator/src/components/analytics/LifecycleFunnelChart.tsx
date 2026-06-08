import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LifecycleStageMetric } from "@/lib/api/analytics";

interface Props {
  data: LifecycleStageMetric[];
}

const STAGE_COLORS: Record<string, string> = {
  protect: "hsl(0, 84%, 60%)",
  renew: "hsl(221, 83%, 53%)",
  adopt: "hsl(38, 92%, 50%)",
  expand: "hsl(142, 71%, 45%)",
  activate: "hsl(215, 16%, 47%)",
};

export function LifecycleFunnelChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.label,
    accounts: d.count,
    revenue: d.revenue,
    fill: STAGE_COLORS[d.stage] ?? "hsl(var(--primary))",
  }));

  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Lifecycle Funnel</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Accounts and revenue by lifecycle stage</p>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={70} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }}
            />
            <Legend iconType="circle" />
            <Bar dataKey="accounts" name="Accounts" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
