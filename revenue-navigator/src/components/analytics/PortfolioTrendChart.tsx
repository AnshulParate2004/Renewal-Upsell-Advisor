import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TrendDataPoint } from "@/lib/api/analytics";
import { formatCurrency } from "@/data/mockData";
import { useRevenue } from "@/contexts/RevenueContext";

interface Props {
  data: TrendDataPoint[];
}

export function PortfolioTrendChart({ data }: Props) {
  const { revenueType } = useRevenue();
  const label = revenueType === "ARR" ? "Total ARR" : "Total MRR";

  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Portfolio Revenue Trend</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Last 12 months</p>
        </div>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }}
              formatter={(value: number, name: string) =>
                name === label ? formatCurrency(value) : value
              }
            />
            <Legend iconType="circle" />
            <Line yAxisId="left" type="monotone" dataKey="total_revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={label} />
            <Line yAxisId="right" type="monotone" dataKey="churn_risk_count" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Churn Risk Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
