"""
Seed billing_interval and mrr/arr so some accounts are monthly and some annual.
- Monthly accounts: billing_interval='monthly', mrr set (e.g. from existing arr/12 or fixed value).
- Annual accounts: billing_interval='annual', arr set (existing or keep).

Run from Backend with:
  python scripts/seed_billing_interval.py
  or: uv run python scripts/seed_billing_interval.py

Run add_billing_interval_to_accounts.sql and add_mrr_column.sql in Supabase first if needed.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    load_dotenv(env_path)
except Exception:
    pass

from supabase import create_client


def get_supabase_client():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_SERVICE_ROLE_SECRET")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
    )
    if not supabase_url or not supabase_key:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env")
    return create_client(supabase_url, supabase_key)


def main():
    client = get_supabase_client()

    result = client.table("accounts").select("id, name, arr, monthly_wise_instalment, mrr").execute()
    accounts = result.data or []
    if not accounts:
        print("No accounts found. Create accounts first.")
        return

    print(f"Seeding billing_interval and mrr for {len(accounts)} account(s)...")
    updated_monthly = 0
    updated_annual = 0

    for i, acc in enumerate(accounts):
        account_id = acc.get("id")
        if not account_id:
            continue
        arr = acc.get("arr")
        mwi = acc.get("monthly_wise_instalment")
        mrr = acc.get("mrr")
        # Alternate: even index = monthly, odd = annual (so we have both)
        is_monthly = (i % 2) == 0
        try:
            if is_monthly:
                # Monthly: set billing_interval and mrr (use existing mrr or monthly_wise_instalment or arr/12)
                mrr_val = None
                if mrr is not None and mrr != "":
                    mrr_val = float(mrr)
                elif mwi is not None and mwi != "":
                    mrr_val = float(mwi)
                elif arr is not None and arr != "":
                    mrr_val = float(arr) / 12
                else:
                    mrr_val = 5000.0  # default seed for monthly
                payload = {"billing_interval": "monthly", "mrr": mrr_val, "monthly_wise_instalment": mrr_val}
                client.table("accounts").update(payload).eq("id", account_id).execute()
                updated_monthly += 1
            else:
                # Annual: set billing_interval and ensure arr (keep existing or set from mrr*12)
                arr_val = None
                if arr is not None and arr != "":
                    arr_val = float(arr)
                elif mrr is not None and mrr != "":
                    arr_val = float(mrr) * 12
                elif mwi is not None and mwi != "":
                    arr_val = float(mwi) * 12
                else:
                    arr_val = 60000.0  # default seed for annual
                payload = {"billing_interval": "annual", "arr": arr_val}
                client.table("accounts").update(payload).eq("id", account_id).execute()
                updated_annual += 1
        except Exception as e:
            print(f"  Skip account {account_id[:8]}...: {e}")

    print(f"Done. Updated {updated_monthly} as monthly, {updated_annual} as annual.")


if __name__ == "__main__":
    main()
