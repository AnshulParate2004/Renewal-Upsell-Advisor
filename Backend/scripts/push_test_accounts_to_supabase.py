"""
Push test account data from data/test_dataset_15_accounts.xlsx into Supabase accounts table.
Upserts by salesforce_id when present; otherwise inserts new rows.

Requires .env (in Backend or repo root) with SUPABASE_URL and SUPABASE_KEY
(or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE_SECRET).
Run from repo root or Backend: python Backend/scripts/push_test_accounts_to_supabase.py
"""
from pathlib import Path
import sys

# Add Backend to path so app imports work
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Load .env before importing app (Backend or repo root)
from dotenv import load_dotenv
env_path = BACKEND_DIR / ".env"
if not env_path.exists():
    env_path = BACKEND_DIR.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

import pandas as pd
from app.services.email.scheduler import get_supabase_client


# Excel columns -> accounts table columns (must match docs/database_schema.sql accounts table; no contact_email/contact_name)
ACCOUNT_COLUMNS = [
    "name", "domain", "industry", "company_size", "arr", "mrr",
    "contract_start_date", "contract_end_date", "renewal_date", "last_contact_date",
    "status", "renewal_stage", "sentiment_score", "sentiment_category",
    "licenses_used", "licenses_total", "utilization_percentage",
    "csm_name", "csm_email",
    "primary_contact_name", "primary_contact_email", "primary_contact_phone",
    "salesforce_id", "health_score", "risk_score", "relationship_score", "churn_probability",
]


def _serialize_value(val):
    """Convert cell value for Supabase: dates to ISO string, NaN to None, numpy types to native."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if hasattr(val, "isoformat"):  # date/datetime
        return val.isoformat()[:10] if hasattr(val, "day") else val.isoformat()
    # numpy int64/float64 -> native for JSON
    if hasattr(val, "item"):
        try:
            val = val.item()
        except (ValueError, AttributeError):
            pass
    if isinstance(val, (int, float)):
        if isinstance(val, float) and val == int(val):
            return int(val)
        return float(val) if isinstance(val, float) else val
    return str(val).strip() if isinstance(val, str) else val


def build_account_row(row: pd.Series) -> dict:
    """Build one account payload for Supabase from a DataFrame row."""
    out = {}
    for col in ACCOUNT_COLUMNS:
        if col not in row.index:
            continue
        v = _serialize_value(row[col])
        if v is not None:
            out[col] = v
    # Ensure required fields
    if "name" not in out or out["name"] is None:
        out["name"] = "Unknown"
    if "arr" not in out:
        out["arr"] = 0
    if "mrr" not in out:
        out["mrr"] = 0
    return out


def main():
    excel_path = BACKEND_DIR.parent / "data" / "test_dataset_15_accounts.xlsx"
    if not excel_path.exists():
        print(f"ERROR: File not found: {excel_path}")
        sys.exit(1)

    client = get_supabase_client()
    if not client:
        print("ERROR: Supabase client not configured. Set SUPABASE_URL and SUPABASE_KEY in .env")
        sys.exit(1)

    df = pd.read_excel(excel_path, sheet_name=0)
    if df.empty:
        print("No rows in sheet.")
        sys.exit(0)

    rows = [build_account_row(df.iloc[i]) for i in range(len(df))]
    inserted, updated = 0, 0

    for payload in rows:
        try:
            # Upsert on salesforce_id if present; otherwise insert
            sid = payload.get("salesforce_id")
            if sid:
                r = client.table("accounts").upsert(
                    payload,
                    on_conflict="salesforce_id",
                ).execute()
            else:
                r = client.table("accounts").insert(payload).execute()
            if r.data:
                if sid:
                    updated += 1
                else:
                    inserted += 1
        except Exception as e:
            print(f"Row failed ({payload.get('name', '?')}): {e}")

    print(f"Done. Inserted: {inserted}, Updated: {updated}, Total rows: {len(rows)}")


if __name__ == "__main__":
    main()
