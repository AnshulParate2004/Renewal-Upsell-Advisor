import { useState } from "react";
import {
  Search, Grid3X3, List, Filter, X, Eye, Phone, Mail,
  ChevronRight, ArrowUpDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  accounts, formatCurrency, getRiskColor, getHealthColor,
  getSentimentEmoji, getDaysUntil, type Account,
} from "@/data/mockData";

const timeline = [
  { id: 1, time: "2 hours ago", icon: "📧", title: "Email Sent: Renewal Quote", desc: "Your contract renews in 30 days" },
  { id: 2, time: "Yesterday", icon: "📞", title: "Voice Call: Picked Up", desc: "Duration: 8m 34s — Sentiment: Positive" },
  { id: 3, time: "3 days ago", icon: "🎫", title: "Support Ticket Resolved", desc: "Integration issue — resolved in 4 hours" },
  { id: 4, time: "1 week ago", icon: "🤖", title: "AI Analysis Complete", desc: "Risk score updated: 45 → 85" },
  { id: 5, time: "2 weeks ago", icon: "💰", title: "Payment Received", desc: "Monthly invoice $10,000 — paid on time" },
];

function RiskBadge({ score }: { score: number }) {
  const color = getRiskColor(score);
  const label = score >= 70 ? "High Risk" : score >= 40 ? "Medium" : "Low";
  return (
    <Badge variant={color === "destructive" ? "destructive" : color === "warning" ? "secondary" : "default"}
      className={color === "success" ? "bg-success text-success-foreground" : color === "warning" ? "bg-warning text-warning-foreground" : ""}>
      {label}
    </Badge>
  );
}

function HealthBar({ score }: { score: number }) {
  const color = getHealthColor(score);
  return (
    <div className="w-full">
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color === "success" ? "bg-success" : color === "warning" ? "bg-warning" : "bg-destructive"}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function AccountDetailSheet({ account, open, onClose }: { account: Account | null; open: boolean; onClose: () => void }) {
  if (!account) return null;
  const days = getDaysUntil(account.renewalDate);
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">{account.name}</SheetTitle>
          <p className="text-sm text-muted-foreground font-mono">{formatCurrency(account.arr)} ARR</p>
        </SheetHeader>
        <Tabs defaultValue="overview" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="timeline" className="flex-1">Timeline</TabsTrigger>
            <TabsTrigger value="insights" className="flex-1">Insights</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold font-mono">{account.healthScore}</div>
                <p className="text-xs text-muted-foreground mt-1">Health</p>
                <HealthBar score={account.healthScore} />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold font-mono text-destructive">{account.riskScore}</div>
                <p className="text-xs text-muted-foreground mt-1">Risk</p>
              </div>
              <div className="text-center">
                <div className="text-3xl">{getSentimentEmoji(account.sentiment)}</div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{account.sentiment}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Contract Start</span><span>{account.contractStart}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Renewal Date</span><span>{account.renewalDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Days to Renewal</span><span className="font-mono">{days} days</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span>{account.industry}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">CSM</span><span>{account.csm}</span></div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Utilization ({account.utilization}%)</p>
              <Progress value={account.utilization} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{account.licensesUsed} / {account.licensesTotal} licenses</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm"><Mail className="h-3 w-3 mr-1" /> Send Quote</Button>
              <Button size="sm" variant="outline"><Phone className="h-3 w-3 mr-1" /> Call</Button>
              <Button size="sm" variant="outline">Mark Renewed</Button>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <div className="relative space-y-4 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-border">
              {timeline.map((t) => (
                <div key={t.id} className="relative">
                  <div className="absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px]">●</div>
                  <p className="text-xs text-muted-foreground">{t.time}</p>
                  <p className="text-sm font-medium mt-0.5">{t.icon} {t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="mt-4 space-y-4">
            <Card className="border-destructive/30">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-destructive">🔴 High Churn Risk Detected</p>
                <p className="text-xs text-muted-foreground mt-2">Score: {account.riskScore}/100</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>✗ Usage declined 40% in last 14 days</li>
                  <li>✗ 3 support tickets opened</li>
                  <li>✓ Payment history clean</li>
                </ul>
                <p className="text-xs text-primary mt-2">Recommendation: Schedule urgent call</p>
              </CardContent>
            </Card>
            <Card className="border-accent/30">
              <CardContent className="pt-4">
                <p className="text-sm font-semibold text-accent">💰 Upsell Potential</p>
                <p className="text-xs text-muted-foreground mt-2">Score: 72/100</p>
                <ul className="text-xs mt-2 space-y-1">
                  <li>✓ License utilization at {account.utilization}%</li>
                  <li>✓ Using advanced features</li>
                  <li>✓ Team size grew 25% this quarter</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="text-xs">Feb 12</TableCell><TableCell className="text-xs">Quote Sent</TableCell><TableCell><Badge variant="outline" className="text-xs">Pending</Badge></TableCell></TableRow>
                <TableRow><TableCell className="text-xs">Feb 11</TableCell><TableCell className="text-xs">Voice Call</TableCell><TableCell><Badge className="text-xs bg-success text-success-foreground">Success</Badge></TableCell></TableRow>
                <TableRow><TableCell className="text-xs">Feb 5</TableCell><TableCell className="text-xs">Email Campaign</TableCell><TableCell><Badge className="text-xs bg-success text-success-foreground">Opened</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default function Accounts() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [sortKey, setSortKey] = useState<"arr" | "healthScore" | "riskScore">("arr");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = accounts
    .filter((a) => a.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === "desc" ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]);

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search accounts..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button variant={view === "grid" ? "default" : "outline"} size="icon" onClick={() => setView("grid")}>
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button variant={view === "list" ? "default" : "outline"} size="icon" onClick={() => setView("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((account) => {
            const days = getDaysUntil(account.renewalDate);
            return (
              <Card
                key={account.id}
                className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
                onClick={() => setSelectedAccount(account)}
              >
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge className={`text-xs ${getHealthColor(account.healthScore) === "success" ? "bg-success text-success-foreground" : getHealthColor(account.healthScore) === "warning" ? "bg-warning text-warning-foreground" : "bg-destructive text-destructive-foreground"}`}>
                      {account.healthScore}/100
                    </Badge>
                    <RiskBadge score={account.riskScore} />
                  </div>
                  <h3 className="font-semibold text-sm">{account.name}</h3>
                  <p className="text-lg font-mono font-bold mt-1">{formatCurrency(account.arr)}</p>
                  <HealthBar score={account.healthScore} />
                  <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
                    <div>📅 {days}d</div>
                    <div>{getSentimentEmoji(account.sentiment)} {account.sentiment}</div>
                    <div>📈 {account.utilization}%</div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedAccount(account); }}>
                      <Eye className="h-3 w-3 mr-1" /> Details
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => e.stopPropagation()}>
                      <Phone className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={(e) => e.stopPropagation()}>
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("arr")}>
                  <span className="flex items-center gap-1">ARR <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("healthScore")}>
                  <span className="flex items-center gap-1">Health <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => toggleSort("riskScore")}>
                  <span className="flex items-center gap-1">Risk <ArrowUpDown className="h-3 w-3" /></span>
                </TableHead>
                <TableHead>Sentiment</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((account) => (
                <TableRow key={account.id} className="cursor-pointer" onClick={() => setSelectedAccount(account)}>
                  <TableCell className="font-medium text-sm">{account.name}</TableCell>
                  <TableCell className="font-mono text-sm">{formatCurrency(account.arr)}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><HealthBar score={account.healthScore} /><span className="text-xs font-mono">{account.healthScore}</span></div></TableCell>
                  <TableCell><RiskBadge score={account.riskScore} /></TableCell>
                  <TableCell className="text-sm">{getSentimentEmoji(account.sentiment)} {account.sentiment}</TableCell>
                  <TableCell className="text-sm font-mono">{getDaysUntil(account.renewalDate)}d</TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AccountDetailSheet account={selectedAccount} open={!!selectedAccount} onClose={() => setSelectedAccount(null)} />
    </div>
  );
}
