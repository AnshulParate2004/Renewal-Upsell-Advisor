"""
Seed upsell_opportunities for monthly (mrr-only) accounts so the Opportunities page shows rows when Monthly is selected.
Run from Backend: python scripts/seed_opportunities_for_monthly.py
"""
import os
import sys
import random

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
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_KEY in .env")
    return create_client(supabase_url, supabase_key)


def main():
    client = get_supabase_client()
    result = client.table("accounts").select("id, name, mrr").execute()
    accounts = result.data or []
    monthly_accounts = [a for a in accounts if (a.get("mrr") or 0) > 0 and (a.get("arr") is None or (a.get("arr") or 0) == 0)]
    if not monthly_accounts:
        monthly_accounts = [a for a in accounts if (a.get("mrr") or 0) > 0]
    if not monthly_accounts:
        print("No monthly accounts (mrr > 0) found. Run seed_monthly_accounts.py first.")
        return

    inserted = 0
    for acc in monthly_accounts:
        account_id = acc.get("id")
        mrr = float(acc.get("mrr") or 0)
        predicted_value = round(mrr * (0.1 + random.random() * 0.25), 2)
        probability = round(0.3 + random.random() * 0.5, 2)
        row = {
            "account_id": account_id,
            "opportunity_type": "upsell",
            "predicted_value": predicted_value,
            "probability": probability,
            "status": "identified",
        }
        try:
            client.table("upsell_opportunities").insert(row).execute()
            inserted += 1
            print(f"  Opportunity for {acc.get('name', account_id)}: ${predicted_value} (prob={probability})")
        except Exception as e:
            print(f"  Skip {acc.get('name', account_id)}: {e}")

    print(f"\nDone. Inserted {inserted} opportunities for monthly accounts.")


if __name__ == "__main__":
    main()
