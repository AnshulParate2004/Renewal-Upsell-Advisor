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
import type { RenewalQuarterMetric } from "@/lib/api/analytics";
import { formatCurrency } from "@/data/mockData";

interface Props {
  data: RenewalQuarterMetric[];
}

const QUARTER_COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(262, 83%, 58%)", "hsl(38, 92%, 50%)"];

export function RenewalQuarterChart({ data }: Props) {
  const chartData = data.map((d, i) => ({
    name: d.label,
    accounts: d.count,
    revenue: d.revenue,
    subtitle: d.days_range,
    fill: QUARTER_COLORS[i % QUARTER_COLORS.length],
  }));

  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Renewal Pipeline by Quarter</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Q1–Q4 account distribution</p>
      </div>
      <div className="p-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }}
              formatter={(value: number, name: string) =>
                name === "revenue" ? formatCurrency(value) : value
              }
              labelFormatter={(label) => {
                const row = chartData.find((d) => d.name === label);
                return row ? `${label} · ${row.subtitle}` : label;
              }}
            />
            <Legend iconType="circle" />
            <Bar dataKey="accounts" name="Accounts" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
