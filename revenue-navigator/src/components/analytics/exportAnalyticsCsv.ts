import type { PortfolioAnalyticsResponse } from "@/lib/api/analytics";

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportAnalyticsCsv(data: PortfolioAnalyticsResponse, revenueLabel: string): void {
  const lines: string[] = [];

  lines.push("Portfolio Analytics Export");
  lines.push(`Generated,${new Date().toISOString()}`);
  lines.push("");

  lines.push("KPI,Value");
  lines.push(`Total Accounts,${data.kpis.total_accounts}`);
  lines.push(`${revenueLabel},${data.kpis.total_revenue}`);
  lines.push(`Churn Risk Count,${data.kpis.churn_risk_count}`);
  lines.push(`Upsell Pipeline,${data.kpis.upsell_pipeline}`);
  lines.push(`Avg Health Score,${data.kpis.avg_health_score}`);
  lines.push(`Avg Utilization %,${data.kpis.avg_utilization_percent}`);
  lines.push("");

  lines.push("Lifecycle Stage,Count,Revenue");
  data.lifecycle_stages.forEach((s) => {
    lines.push(`${escapeCsv(s.label)},${s.count},${s.revenue}`);
  });
  lines.push("");

  lines.push("Renewal Quarter,Count,Revenue,Days Range");
  data.renewal_quarters.forEach((q) => {
    lines.push(`${q.label},${q.count},${q.revenue},${escapeCsv(q.days_range)}`);
  });
  lines.push("");

  lines.push("Account,Stage,Risk Score,Renewal Days,Revenue");
  data.top_at_risk_accounts.forEach((a) => {
    lines.push(
      `${escapeCsv(a.account_name)},${escapeCsv(a.stage_label)},${a.risk_score},${a.renewal_days ?? ""},${a.revenue}`
    );
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portfolio-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
