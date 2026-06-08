import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ScoreDistribution } from "@/lib/api/analytics";

interface Props {
  distributions: ScoreDistribution[];
}

const METRIC_LABELS: Record<string, string> = {
  health: "Health",
  risk: "Risk",
  utilization: "Utilization",
};

const METRIC_COLORS: Record<string, string> = {
  health: "hsl(142, 71%, 45%)",
  risk: "hsl(var(--destructive))",
  utilization: "hsl(221, 83%, 53%)",
};

export function ScoreDistributionChart({ distributions }: Props) {
  return (
    <div className="bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] h-full">
      <div className="px-5 py-3.5 border-b-2 border-black">
        <h3 className="text-sm font-semibold">Score Distributions</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">Health, risk, and utilization buckets</p>
      </div>
      <div className="p-5 space-y-4">
        {distributions.map((dist) => (
          <div key={dist.metric}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              {METRIC_LABELS[dist.metric] ?? dist.metric}
            </p>
            <ResponsiveContainer width="100%" height={70}>
              <BarChart data={dist.buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "2px solid #000", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="count" fill={METRIC_COLORS[dist.metric] ?? "hsl(var(--primary))"} radius={[4, 4, 0, 0]} name="Accounts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ))}
      </div>
    </div>
  );
}
