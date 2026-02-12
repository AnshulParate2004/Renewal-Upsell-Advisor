import {
  TrendingUp, TrendingDown, AlertTriangle, Phone, Brain,
  Send, PhoneCall, Eye, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  accounts, voiceCalls, opportunities, formatCurrency,
  getRiskColor, getSentimentEmoji,
} from "@/data/mockData";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ─── Sparkline data (mock)
const arrSparkline = [
  { v: 2100 }, { v: 2180 }, { v: 2220 }, { v: 2280 },
  { v: 2310 }, { v: 2350 }, { v: 2300 }, { v: 2340 },
  { v: 2380 }, { v: 2350 }, { v: 2400 }, { v: 2420 },
];

const riskDistribution = [
  { name: "High", value: accounts.filter((a) => a.riskScore >= 70).length, color: "hsl(0, 84%, 60%)" },
  { name: "Medium", value: accounts.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length, color: "hsl(38, 92%, 50%)" },
  { name: "Low", value: accounts.filter((a) => a.riskScore < 40).length, color: "hsl(160, 84%, 39%)" },
];

const totalArr = accounts.reduce((s, a) => s + a.arr, 0);
const churnRiskCount = accounts.filter((a) => a.riskScore >= 70).length;
const renewalRate = Math.round(
  (accounts.filter((a) => a.renewalStage === "renewed" || a.healthScore >= 70).length / accounts.length) * 100
);
const upsellPipeline = opportunities
  .filter((o) => o.type === "upsell" || o.type === "cross_sell")
  .reduce((s, o) => s + o.value, 0);

const urgentActions = [
  { id: 1, account: "Acme Corporation", arr: 120000, issue: "Contract expires in 12 days — no quote sent", priority: "high" as const, actions: ["Send Quote", "Call Now"] },
  { id: 2, account: "Horizon Media", arr: 110000, issue: "Risk score jumped to 90 — 3 missed calls", priority: "high" as const, actions: ["View Details", "Retry Call"] },
  { id: 3, account: "TechStart Inc", arr: 45000, issue: "Usage declined 40% in last 14 days", priority: "medium" as const, actions: ["View Details", "Email CSM"] },
  { id: 4, account: "Global Systems", arr: 200000, issue: "92% license utilization — upsell opportunity", priority: "info" as const, actions: ["Upsell Quote", "Schedule Demo"] },
];

const aiInsights = [
  { id: 1, icon: "📉", text: "3 accounts showing usage decline — consider proactive outreach", type: "warning" },
  { id: 2, icon: "📧", text: "5 high-value renewals in T-30 window — auto-quotes sent", type: "success" },
  { id: 3, icon: "😟", text: "Sentiment drop detected in 2 accounts — review support tickets", type: "danger" },
  { id: 4, icon: "💰", text: "Global Systems ready for 20-seat expansion ($48K ARR)", type: "opportunity" },
];

const priorityBorder = { high: "border-l-destructive", medium: "border-l-warning", info: "border-l-info" };
const outcomeBadge: Record<string, { label: string; variant: "default" | "destructive" | "secondary" | "outline" }> = {
  picked_up: { label: "✅ Picked Up", variant: "default" },
  missed: { label: "❌ Missed", variant: "destructive" },
  retry: { label: "🔄 Retry", variant: "secondary" },
  voicemail: { label: "⏸️ Voicemail", variant: "outline" },
};

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total ARR */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ARR</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold">{formatCurrency(totalArr)}</div>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3" /> 12% vs last month
            </p>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={arrSparkline}>
                  <Line type="monotone" dataKey="v" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Churn Risk */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Churn Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold text-destructive">{churnRiskCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((churnRiskCount / accounts.length) * 100).toFixed(1)}% of portfolio
            </p>
            <div className="mt-3 h-10 flex justify-center">
              <PieChart width={60} height={40}>
                <Pie data={riskDistribution} dataKey="value" cx={30} cy={20} innerRadius={10} outerRadius={18} strokeWidth={0}>
                  {riskDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </CardContent>
        </Card>

        {/* Renewal Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Renewal Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold">{renewalRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Target: 90%</p>
            <div className="mt-3 h-2 w-full rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all"
                style={{ width: `${renewalRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upsell Pipeline */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Upsell Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-3xl font-bold text-accent">{formatCurrency(upsellPipeline)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {opportunities.filter((o) => o.type !== "renewal").length} opportunities
            </p>
            <p className="text-xs text-muted-foreground">15% conversion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Urgent Actions ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>⚡</span> Requires Immediate Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {urgentActions.map((action) => (
            <div
              key={action.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border-l-4 ${priorityBorder[action.priority]} bg-muted/30 p-4`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{action.account}</span>
                  <span className="font-mono text-xs text-muted-foreground">{formatCurrency(action.arr)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{action.issue}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {action.actions.map((a) => (
                  <Button key={a} size="sm" variant={a.includes("Call") || a.includes("Quote") ? "default" : "outline"}>
                    {a.includes("Call") && <PhoneCall className="h-3 w-3 mr-1" />}
                    {a.includes("Send") && <Send className="h-3 w-3 mr-1" />}
                    {a.includes("View") && <Eye className="h-3 w-3 mr-1" />}
                    {a}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── Bottom Section: Calls + AI Insights ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Voice Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5" /> Recent Voice Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voiceCalls.slice(0, 5).map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-medium text-sm">{call.accountName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{call.date}</TableCell>
                    <TableCell className="font-mono text-xs">{call.duration}</TableCell>
                    <TableCell>
                      <Badge variant={outcomeBadge[call.outcome].variant} className="text-xs">
                        {outcomeBadge[call.outcome].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5" /> AI-Powered Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
              >
                <span className="text-lg">{insight.icon}</span>
                <p className="text-sm text-foreground">{insight.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
