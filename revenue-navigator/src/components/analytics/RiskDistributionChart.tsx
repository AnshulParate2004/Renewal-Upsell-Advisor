import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { RiskDistributionItem } from "@/lib/api/analytics";

interface Props {
  data: RiskDistributionItem[];
}

const COLORS: Record<string, string> = {
  Renewed: "hsl(221, 83%, 53%)",
  "Low Risk": "hsl(142, 71%, 45%)",
  "Medium Risk": "hsl(38, 92%, 50%)",
  "High Risk": "hsl(var(--destructive))",
};

export function RiskDistributionChart({ data }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    color: COLORS[d.name] ?? "hsl(var(--muted-foreground))",
  }));

  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Portfolio Risk Distribution</h3>
      </div>
      <div className="p-5 flex justify-center">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={65} outerRadius={95} strokeWidth={0} paddingAngle={4}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }} />
            <Legend iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
