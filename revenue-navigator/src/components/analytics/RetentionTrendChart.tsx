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
import type { TrendDataPoint } from "@/lib/api/analytics";

interface Props {
  data: TrendDataPoint[];
}

export function RetentionTrendChart({ data }: Props) {
  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Retention Flow</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Renewed vs at-risk accounts over time</p>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }} />
            <Legend iconType="circle" />
            <Bar dataKey="renewed_count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Renewed" />
            <Bar dataKey="at_risk_count" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="At Risk" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
