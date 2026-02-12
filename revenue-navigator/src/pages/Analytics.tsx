import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { revenueData, churnData, sentimentData, accounts } from "@/data/mockData";

const riskDistribution = [
  { name: "Low Risk", value: accounts.filter((a) => a.riskScore < 40).length, color: "hsl(160, 84%, 39%)" },
  { name: "Medium Risk", value: accounts.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, color: "hsl(38, 92%, 50%)" },
  { name: "High Risk", value: accounts.filter((a) => a.riskScore >= 70).length, color: "hsl(0, 84%, 60%)" },
];

const topAtRisk = [...accounts]
  .sort((a, b) => b.riskScore - a.riskScore)
  .slice(0, 10)
  .map((a) => ({ name: a.name.length > 15 ? a.name.slice(0, 15) + "…" : a.name, risk: a.riskScore }));

const tooltipStyle = {
  contentStyle: { backgroundColor: "hsl(217, 33%, 17%)", border: "1px solid hsl(215, 25%, 27%)", borderRadius: "8px", fontSize: "12px" },
  labelStyle: { color: "hsl(210, 40%, 96%)" },
};

export default function Analytics() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Download className="h-3 w-3 mr-1" /> PDF</Button>
          <Button variant="outline" size="sm"><FileText className="h-3 w-3 mr-1" /> CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 20%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(217, 91%, 60%)" strokeWidth={2} name="Total ARR ($K)" />
                <Line type="monotone" dataKey="new" stroke="hsl(160, 84%, 39%)" strokeWidth={2} name="New ARR" />
                <Line type="monotone" dataKey="expansion" stroke="hsl(263, 70%, 50%)" strokeWidth={2} name="Expansion" />
                <Line type="monotone" dataKey="churned" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Churned" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Churn Analysis */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Churn Analysis</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 20%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Bar dataKey="renewed" stackId="a" fill="hsl(160, 84%, 39%)" name="Renewed" radius={[0, 0, 0, 0]} />
                <Bar dataKey="atRisk" stackId="a" fill="hsl(38, 92%, 50%)" name="At Risk" />
                <Bar dataKey="churned" stackId="a" fill="hsl(0, 84%, 60%)" name="Churned" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Risk Distribution</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={0}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Over Time */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Sentiment Over Time</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 20%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <YAxis domain={[0, 1]} tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <Tooltip {...tooltipStyle} />
                <defs>
                  <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="score" stroke="hsl(160, 84%, 39%)" fill="url(#sentimentGrad)" strokeWidth={2} name="Sentiment Score" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 At-Risk */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Top 10 At-Risk Accounts</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topAtRisk} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 25%, 20%)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="risk" fill="hsl(0, 70%, 55%)" radius={[0, 4, 4, 0]} name="Risk Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
