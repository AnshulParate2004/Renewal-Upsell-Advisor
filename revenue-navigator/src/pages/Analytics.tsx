import { Download, FileText } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { revenueData, churnData, accounts } from "@/data/mockData";

const riskDistribution = [
  { name: "Low Risk", value: accounts.filter((a) => a.riskScore < 40).length, color: "#10b981" },
  { name: "Medium Risk", value: accounts.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, color: "#f59e0b" },
  { name: "High Risk", value: accounts.filter((a) => a.riskScore >= 70).length, color: "#ef4444" },
];

export default function Analytics() {
  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between border-b-4 border-foreground pb-6">
        <div>
          <h1 className="text-5xl font-black text-foreground tracking-tight leading-none uppercase">
            Strategic <span className="text-primary">Analytics</span>
          </h1>
          <p className="text-sm font-black text-foreground/60 mt-2 uppercase tracking-wider">
            Advanced Metric Aggregation & Predictive Intelligence
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-foreground border-2 border-foreground rounded-lg font-black text-sm transition-all flex items-center uppercase tracking-wider group" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
            <Download className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            PDF Export
          </button>
          <button className="px-4 py-2 bg-primary text-white border-2 border-foreground rounded-lg font-black text-sm transition-all flex items-center uppercase tracking-wider group" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
            <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            CSV Sync
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Revenue Trend */}
        <div className="lg:col-span-12 paper-card overflow-hidden bg-white p-0">
          <div className="p-6 border-b-4 border-foreground bg-primary/10 flex items-center justify-between">
            <h3 className="text-xl font-black text-foreground uppercase">Revenue Persistence Trend</h3>
            <div className="sticker-outline px-3 py-1 text-xs">Live Feed</div>
          </div>
          <div className="p-8">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "600" }}
                  axisLine={{ stroke: "#f1f5f9" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "600" }}
                  axisLine={{ stroke: "#f1f5f9" }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: '1px solid #f1f5f9', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: "700" }}
                />
                <Legend iconType="circle" verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} name="Total ARR" />
                <Line type="monotone" dataKey="churned" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--accent))", strokeWidth: 0 }} name="Churned" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Churn Analysis */}
        <div className="lg:col-span-7 paper-card table-container overflow-hidden bg-white p-0">
          <div className="p-6 border-b-4 border-foreground bg-accent/10 flex items-center gap-3">
            <div className="w-2 h-2 bg-accent border border-foreground rounded-full" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }} />
            <h3 className="text-xl font-black text-foreground uppercase">Retention Flow Matrix</h3>
          </div>
          <div className="p-8">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "600" }}
                  axisLine={{ stroke: "#f1f5f9" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "600" }}
                  axisLine={{ stroke: "#f1f5f9" }}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ backgroundColor: "#fff", border: '1px solid #f1f5f9', borderRadius: '12px' }} />
                <Legend iconType="circle" />
                <Bar dataKey="renewed" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="Renewed" />
                <Bar dataKey="atRisk" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="At Risk" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="lg:col-span-5 paper-card table-container overflow-hidden bg-white p-0">
          <div className="p-6 border-b-4 border-foreground bg-accent/10">
            <h3 className="text-xl font-black text-foreground uppercase tracking-wider">Portfolio Volatility Index</h3>
          </div>
          <div className="p-8 flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  strokeWidth={0}
                  paddingAngle={8}
                  label={({ name, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const entry = riskDistribution.find(r => r.name === name);
                    
                    return (
                      <text
                        x={x}
                        y={y}
                        fill={entry?.color || "#000"}
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-xs font-black uppercase"
                        style={{ fontSize: '11px', fontWeight: '900' }}
                      >
                        {`${name}: ${value}`}
                      </text>
                    );
                  }}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: '2px solid hsl(var(--foreground))', 
                    borderRadius: '0.5rem',
                    boxShadow: "1px 1px 0px 0px hsl(var(--foreground))"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
