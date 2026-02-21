"""
Update data/test_dataset_15_accounts.xlsx so accounts spread across pipeline stages
(T-90, T-60, T-30, Renewed). When you push to Supabase and run the ML pipeline,
accounts will appear in the correct Renewal Pipeline sections.

Uses reference date 2026-02-21 for plan % calculation (matches getRenewalStageFromPlan).
Run from repo root: python Backend/scripts/update_test_dataset_pipeline_stages.py
"""
from pathlib import Path
from datetime import datetime, timedelta

import pandas as pd

# Reference "today" for computing contract/renewal dates (use current date for freshness)
REFERENCE_TODAY = datetime(2026, 2, 21).date()

# Distribution: 4 T-90, 4 T-60, 4 T-30, 3 Renewed (15 accounts)
STAGE_ASSIGNMENTS = (
    ["t90"] * 4 + ["t60"] * 4 + ["t30"] * 4 + ["renewed"] * 3
)

# For each stage, (contract_start_days_ago, renewal_days_from_today) so plan % lands in that bucket
# Plan % = days_elapsed / plan_duration. T-30: <30%, T-60: 30-60%, T-90: 60-100%, Renewed: renewal in past
STAGE_DATE_RULES = {
    "t90": (305, 69),   # ~83% through 1-year plan (renewal in ~69 days)
    "t60": (173, 192),  # ~47% through 1-year plan
    "t30": (76, 289),   # ~21% through 1-year plan
    "renewed": (365, -37),  # renewal 37 days ago; status=renewed
}


def main():
    repo_root = Path(__file__).resolve().parent.parent.parent
    excel_path = repo_root / "data" / "test_dataset_15_accounts.xlsx"
    if not excel_path.exists():
        print(f"ERROR: File not found: {excel_path}")
        return 1

    df = pd.read_excel(excel_path, sheet_name=0)
    if df.empty or len(df) > len(STAGE_ASSIGNMENTS):
        print(f"WARNING: Dataset has {len(df)} rows; stage list has {len(STAGE_ASSIGNMENTS)}. Extra rows keep existing dates.")

    n = min(len(df), len(STAGE_ASSIGNMENTS))
    for i in range(n):
        stage = STAGE_ASSIGNMENTS[i]
        days_ago_start, days_to_renewal = STAGE_DATE_RULES[stage]
        contract_start = REFERENCE_TODAY - timedelta(days=days_ago_start)
        renewal_date = REFERENCE_TODAY + timedelta(days=days_to_renewal)

        df.at[df.index[i], "contract_start_date"] = contract_start
        df.at[df.index[i], "renewal_date"] = renewal_date
        df.at[df.index[i], "renewal_stage"] = stage
        df.at[df.index[i], "status"] = "renewed" if stage == "renewed" else "active"
        # Optional: set contract_end_date to renewal_date if column exists
        if "contract_end_date" in df.columns:
            df.at[df.index[i], "contract_end_date"] = renewal_date

    df.to_excel(excel_path, index=False, sheet_name="Sheet1")
    print(f"Updated {excel_path}")
    print("Stage distribution: " + ", ".join(f"{s}: {STAGE_ASSIGNMENTS.count(s)}" for s in ["t90", "t60", "t30", "renewed"]))
    return 0


if __name__ == "__main__":
    exit(main())
