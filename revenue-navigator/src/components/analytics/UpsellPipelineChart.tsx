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
import type { UpsellStageMetric } from "@/lib/api/analytics";
import { formatCurrency } from "@/data/mockData";

interface Props {
  data: UpsellStageMetric[];
}

export function UpsellPipelineChart({ data }: Props) {
  const chartData = data.map((d) => ({
    name: d.stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    count: d.count,
    value: d.value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full flex items-center justify-center min-h-[320px]">
        <p className="text-sm text-muted-foreground">No upsell opportunities in pipeline</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Upsell Pipeline by Stage</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Opportunity count and predicted value</p>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }}
              formatter={(value: number, name: string) =>
                name === "value" ? formatCurrency(value) : value
              }
            />
            <Legend iconType="circle" />
            <Bar dataKey="count" name="Opportunities" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="value" name="Value" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
