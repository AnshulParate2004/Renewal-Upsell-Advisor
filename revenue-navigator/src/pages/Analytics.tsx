import { Download, FileText, Loader2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAccounts } from "@/hooks/useAccounts";
import { useDashboardStats } from "@/hooks/useAnalytics";
import { useMemo } from "react";

export default function Analytics() {
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const isLoading = accountsLoading || statsLoading;

  const riskDistribution = useMemo(() => [
    { name: "Low Risk", value: accounts.filter((a) => a.riskScore < 40).length, color: "hsl(142, 71%, 45%)" },
    { name: "Medium Risk", value: accounts.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, color: "hsl(38, 92%, 50%)" },
    { name: "High Risk", value: accounts.filter((a) => a.riskScore >= 70).length, color: "hsl(var(--destructive))" },
  ], [accounts]);

  const revenueData = useMemo(() => {
    const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
    return months.map((month, idx) => ({
      month,
      total: stats?.total_arr ? Math.round(stats.total_arr / 1000) + (idx * 10) : 0,
      churned: 0,
    }));
  }, [stats]);

  const churnData = useMemo(() => {
    const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
    return months.map((month) => ({
      month,
      renewed: accounts.filter(a => a.renewalStage === "renewed").length,
      atRisk: accounts.filter(a => a.riskScore >= 70).length,
    }));
  }, [accounts]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b-2 border-black px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Revenue metrics & predictive intelligence</p>
          </div>
          <div className="flex gap-2">
            <button className="h-9 px-3 bg-card text-foreground border-2 border-black rounded-lg text-xs font-medium hover:bg-muted transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <Download className="h-3.5 w-3.5" /> PDF
            </button>
            <button className="h-9 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none">
              <FileText className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="ml-2.5 text-muted-foreground text-sm">Loading analytics...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Revenue Trend */}
            <div className="lg:col-span-12 bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
                <span className="text-[11px] text-muted-foreground">Last 12 months</span>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: '2px solid #000', borderRadius: '8px', fontSize: '12px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }} />
                    <Legend iconType="circle" verticalAlign="top" height={32} />
                    <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} name="Total ARR" />
                    <Line type="monotone" dataKey="churned" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Churned" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Churn Analysis */}
            <div className="lg:col-span-7 bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black">
                <h3 className="text-sm font-semibold text-foreground">Retention Flow</h3>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={churnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: '2px solid #000', borderRadius: '8px', fontSize: '12px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="renewed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Renewed" />
                    <Bar dataKey="atRisk" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="At Risk" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="lg:col-span-5 bg-card rounded-xl border-2 border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="px-5 py-3.5 border-b-2 border-black">
                <h3 className="text-sm font-semibold text-foreground">Portfolio Risk Distribution</h3>
              </div>
              <div className="p-5 flex justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={riskDistribution} dataKey="value" cx="50%" cy="50%" innerRadius={65} outerRadius={95} strokeWidth={0} paddingAngle={4}>
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: '2px solid #000', borderRadius: '8px', fontSize: '12px', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
