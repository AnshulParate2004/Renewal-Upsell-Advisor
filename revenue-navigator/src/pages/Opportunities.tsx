import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { TrendingUp, DollarSign, BarChart3, Target } from "lucide-react";
import { opportunities, formatCurrency, type Opportunity } from "@/data/mockData";

const typeBadge: Record<string, { label: string; class: string }> = {
  renewal: { label: "Renewal", class: "bg-primary/20 text-primary" },
  upsell: { label: "Upsell", class: "bg-accent/20 text-accent" },
  cross_sell: { label: "Cross-sell", class: "bg-info/20 text-info" },
};

const stageLabels: Record<string, string> = {
  identified: "Identified",
  quote_sent: "Quote Sent",
  negotiation: "Negotiation",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

export default function Opportunities() {
  const [data, setData] = useState(opportunities);
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = data.filter((o) => typeFilter === "all" || o.type === typeFilter);

  const totalPipeline = data.reduce((s, o) => s + o.value, 0);
  const weightedValue = data.reduce((s, o) => s + o.value * (o.probability / 100), 0);
  const avgDeal = totalPipeline / data.length;
  const conversionRate = Math.round(
    (data.filter((o) => o.stage === "closed_won").length / data.length) * 100
  ) || 15;

  const updateStage = (id: string, stage: string) => {
    setData((prev) =>
      prev.map((o) => (o.id === id ? { ...o, stage: stage as Opportunity["stage"] } : o))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Opportunities</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Weighted Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">{formatCurrency(weightedValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Deal Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">{formatCurrency(avgDeal)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="renewal">Renewal</SelectItem>
            <SelectItem value="upsell">Upsell</SelectItem>
            <SelectItem value="cross_sell">Cross-sell</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Probability</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium text-sm">{opp.accountName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs ${typeBadge[opp.type].class}`}>
                    {typeBadge[opp.type].label}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{formatCurrency(opp.value)}</TableCell>
                <TableCell className="font-mono text-sm">{opp.probability}%</TableCell>
                <TableCell>
                  <Select value={opp.stage} onValueChange={(v) => updateStage(opp.id, v)}>
                    <SelectTrigger className="h-7 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(stageLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{opp.createdDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
