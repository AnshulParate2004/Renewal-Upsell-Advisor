/** Canonical demo vendors — single source of truth for pipeline / lifecycle vendor. */
export type PipelineVendor = "zscaler" | "adobe" | "crowdstrike";

const LEGACY_ALIASES: Record<string, PipelineVendor> = {
  zscaler: "zscaler",
  cloudflare: "zscaler",
  aditya_birla: "adobe",
  adobe: "adobe",
  crowdstrike: "crowdstrike",
};

export function normalizePipelineType(raw?: string | null): PipelineVendor {
  if (!raw) return "zscaler";
  return LEGACY_ALIASES[raw.toLowerCase()] ?? "zscaler";
}

export function getPipelineType(): PipelineVendor {
  return normalizePipelineType(
    typeof localStorage !== "undefined" ? localStorage.getItem("pipeline_type") : null
  );
}

export function pipelineStorageValue(vendor: PipelineVendor): string {
  if (vendor === "adobe") return "aditya_birla";
  return vendor;
}

/** Stage ID prefixes per vendor (DB renewal_stage values) */
export const PIPELINE_STAGES: Record<PipelineVendor, string[]> = {
  zscaler: ["cf_q1", "cf_q2", "cf_q3", "cf_q4", "no_renewed"],
  adobe: ["ab_q1", "ab_q2", "ab_q3", "ab_q4", "no_renewed"],
  crowdstrike: ["cs_q1", "cs_q2", "cs_q3", "cs_q4", "no_renewed"],
};

export function renewalStagesForVendor(vendor: PipelineVendor, isMonthly: boolean): string[] {
  const all = PIPELINE_STAGES[vendor];
  if (isMonthly) {
    const last = all[all.length - 2];
    return last ? [last] : [];
  }
  return all.filter((s) => s !== "no_renewed");
}

export function deriveRenewalStage(
  vendor: PipelineVendor,
  daysToRenewal: number,
  isMonthly: boolean
): string {
  const stages = PIPELINE_STAGES[vendor];
  const q4 = stages[3];
  const q3 = stages[2];
  const q2 = stages[1];
  const q1 = stages[0];

  if (isMonthly) return q4;
  if (daysToRenewal <= 90) return q4;
  if (daysToRenewal <= 180) return q3;
  if (daysToRenewal <= 270) return q2;
  return q1;
}

export function vendorDisplayName(vendor: PipelineVendor): string {
  const names: Record<PipelineVendor, string> = {
    zscaler: "Zscaler",
    adobe: "Adobe",
    crowdstrike: "CrowdStrike",
  };
  return names[vendor];
}

/** Workflow template stage_name for Q1–Q4 (e.g. ab_q1, cf_q2). */
export function workflowStageForQuarter(
  vendor: PipelineVendor,
  quarter: "q1" | "q2" | "q3" | "q4"
): string {
  const index = { q1: 0, q2: 1, q3: 2, q4: 3 }[quarter];
  return PIPELINE_STAGES[vendor][index] ?? `${quarter}`;
}
