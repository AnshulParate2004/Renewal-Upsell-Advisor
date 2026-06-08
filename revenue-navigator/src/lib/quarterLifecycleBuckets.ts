import { getDaysUntil, getRenewalStageFromPlan } from "@/data/mockData";
import type { Account } from "@/data/mockData";
import type { LifecycleAlert, LifecycleStageId } from "@/types/lifecycle";
import { accountRevenue } from "@/lib/revenueUtils";
import type { RevenueType } from "@/contexts/RevenueContext";

export type QuarterId = "q1" | "q2" | "q3" | "q4";

export const QUARTERS: {
  id: QuarterId;
  label: string;
  subtitle: string;
  accentClass: string;
  borderClass: string;
  headerBg: string;
}[] = [
  {
    id: "q1",
    label: "Q1",
    subtitle: "271+ days to renewal",
    accentClass: "text-blue-600",
    borderClass: "border-blue-500/40",
    headerBg: "bg-blue-500/10",
  },
  {
    id: "q2",
    label: "Q2",
    subtitle: "181–270 days",
    accentClass: "text-emerald-600",
    borderClass: "border-emerald-500/40",
    headerBg: "bg-emerald-500/10",
  },
  {
    id: "q3",
    label: "Q3",
    subtitle: "91–180 days",
    accentClass: "text-indigo-600",
    borderClass: "border-indigo-500/40",
    headerBg: "bg-indigo-500/10",
  },
  {
    id: "q4",
    label: "Q4",
    subtitle: "0–90 days",
    accentClass: "text-amber-600",
    borderClass: "border-amber-500/40",
    headerBg: "bg-amber-500/10",
  },
];

const STAGE_IDS: LifecycleStageId[] = ["protect", "renew", "adopt", "expand", "activate"];

export type BucketStats = { count: number; revenue: number };

function emptyBucket(): BucketStats {
  return { count: 0, revenue: 0 };
}

function emptyStageMap(): Record<LifecycleStageId, BucketStats> {
  return {
    protect: emptyBucket(),
    renew: emptyBucket(),
    adopt: emptyBucket(),
    expand: emptyBucket(),
    activate: emptyBucket(),
  };
}

function addToBucket(bucket: BucketStats, revenue: number): void {
  bucket.count += 1;
  bucket.revenue += revenue;
}

export function resolveAccountQuarter(account: Account): QuarterId | null {
  const stage = getRenewalStageFromPlan(
    account.contractStart,
    account.renewalDate,
    account.status,
    undefined,
    account.contractEnd,
    account.renewalStage
  );
  if (stage === "q1" || stage === "q2" || stage === "q3" || stage === "q4") return stage;
  return null;
}

/** Maps every account to Q1–Q4; overdue / not-renewed accounts fall into Q4. */
export function resolveAccountQuarterIncludingOverdue(account: Account): QuarterId {
  const quarter = resolveAccountQuarter(account);
  if (quarter) return quarter;

  const s = (account.status ?? "").toString().trim().toLowerCase();
  const isRenewed = s === "renewed" || s === "renewal";
  const end =
    isRenewed && account.contractEnd
      ? account.contractEnd
      : account.renewalDate || account.contractEnd || new Date().toISOString();
  const daysToRenewal = getDaysUntil(end);

  if (daysToRenewal > 270) return "q1";
  if (daysToRenewal > 180) return "q2";
  if (daysToRenewal > 90) return "q3";
  return "q4";
}

export type RiskColumnId = "risk_critical" | "no_renewed";

export const RISK_COLUMNS: {
  id: RiskColumnId;
  label: string;
  subtitle: string;
  accentClass: string;
  borderClass: string;
  headerBg: string;
}[] = [
  {
    id: "risk_critical",
    label: "Critical",
    subtitle: "High risk · score ≥ 70 or at-risk status",
    accentClass: "text-red-600",
    borderClass: "border-red-500/40",
    headerBg: "bg-red-500/10",
  },
  {
    id: "no_renewed",
    label: "Not Renewed",
    subtitle: "Past renewal date · not renewed",
    accentClass: "text-slate-600",
    borderClass: "border-slate-400/40",
    headerBg: "bg-slate-500/10",
  },
];

function classifyRiskColumn(account: Account): RiskColumnId | null {
  const s = (account.status ?? "").toString().trim().toLowerCase();
  const isRenewed = s === "renewed" || s === "renewal";
  const end =
    isRenewed && account.contractEnd
      ? account.contractEnd
      : account.renewalDate || account.contractEnd || new Date().toISOString();
  const daysToRenewal = getDaysUntil(end);

  if (!isRenewed && daysToRenewal < 0) return "no_renewed";
  const risk = account.riskScore ?? 0;
  if (!isRenewed && (s === "at_risk" || risk >= 70)) return "risk_critical";
  return null;
}

export function isAtRiskAccount(account: Account): boolean {
  return classifyRiskColumn(account) !== null;
}

export function buildQuarterLifecycleBuckets(
  alerts: LifecycleAlert[] | undefined,
  revenueType: RevenueType
): {
  byQuarter: Record<QuarterId, Record<LifecycleStageId, BucketStats>>;
  quarterTotals: Record<QuarterId, BucketStats>;
} {
  const byQuarter: Record<QuarterId, Record<LifecycleStageId, BucketStats>> = {
    q1: emptyStageMap(),
    q2: emptyStageMap(),
    q3: emptyStageMap(),
    q4: emptyStageMap(),
  };
  const quarterTotals: Record<QuarterId, BucketStats> = {
    q1: emptyBucket(),
    q2: emptyBucket(),
    q3: emptyBucket(),
    q4: emptyBucket(),
  };

  (alerts ?? []).forEach((alert) => {
    const quarter = resolveAccountQuarterIncludingOverdue(alert.account);

    const revenue = accountRevenue(alert.account, revenueType);
    addToBucket(byQuarter[quarter][alert.stage], revenue);
    quarterTotals[quarter].count += 1;
    quarterTotals[quarter].revenue += revenue;
  });

  return { byQuarter, quarterTotals };
}

export function buildRiskColumnLifecycleBuckets(
  alerts: LifecycleAlert[] | undefined,
  revenueType: RevenueType
): {
  byColumn: Record<RiskColumnId, Record<LifecycleStageId, BucketStats>>;
  columnTotals: Record<RiskColumnId, BucketStats>;
} {
  const byColumn: Record<RiskColumnId, Record<LifecycleStageId, BucketStats>> = {
    risk_critical: emptyStageMap(),
    no_renewed: emptyStageMap(),
  };
  const columnTotals: Record<RiskColumnId, BucketStats> = {
    risk_critical: emptyBucket(),
    no_renewed: emptyBucket(),
  };

  (alerts ?? []).forEach((alert) => {
    const column = classifyRiskColumn(alert.account);
    if (!column) return;

    const revenue = accountRevenue(alert.account, revenueType);
    // Risk pipeline: every at-risk account is shown under Protect regardless of lifecycle stage.
    addToBucket(byColumn[column].protect, revenue);
    columnTotals[column].count += 1;
    columnTotals[column].revenue += revenue;
  });

  return { byColumn, columnTotals };
}

export function sumBucketsAcrossRiskColumns(
  byColumn: Record<RiskColumnId, Record<LifecycleStageId, BucketStats>>
): Record<LifecycleStageId, number> {
  const totals: Record<LifecycleStageId, number> = {
    protect: 0,
    renew: 0,
    adopt: 0,
    expand: 0,
    activate: 0,
  };
  RISK_COLUMNS.forEach(({ id }) => {
    STAGE_IDS.forEach((stageId) => {
      totals[stageId] += byColumn[id][stageId].count;
    });
  });
  return totals;
}

export function sumBucketsAcrossQuarters(
  byQuarter: Record<QuarterId, Record<LifecycleStageId, BucketStats>>
): Record<LifecycleStageId, number> {
  const totals: Record<LifecycleStageId, number> = {
    protect: 0,
    renew: 0,
    adopt: 0,
    expand: 0,
    activate: 0,
  };
  QUARTERS.forEach(({ id }) => {
    STAGE_IDS.forEach((stageId) => {
      totals[stageId] += byQuarter[id][stageId].count;
    });
  });
  return totals;
}
