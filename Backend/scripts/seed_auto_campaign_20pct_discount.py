"""
Seed one auto campaign: 20% discount email for accounts with Churn % 50–99,
from 2026-03-08 to 2026-03-10. Sends email with message about 20% discount.

Run from Backend with:
  python scripts/seed_auto_campaign_20pct_discount.py
Requires SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.
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

from app.services.email.scheduler import get_supabase_client

CAMPAIGN = {
    "name": "20% discount for high-churn accounts",
    "description": "Give 20 percentage discount to them in the mail",
    "target_audience_filter": "multi",
    "filter_config": {"churn": {"min": 50, "max": 99}},
    "recurring_frequency": "daily",
    "action_type": "email_sequence",
    "is_active": True,
    "start_date": "2026-03-08",
    "end_date": "2026-03-10",
    "schedule_start_time": "08:22",
    "follow_up_offset_days": 3,
}


def main():
    client = get_supabase_client()
    if not client:
        print("Supabase not configured. Set SUPABASE_URL and SUPABASE_KEY in .env")
        sys.exit(1)
    try:
        result = client.table("auto_campaigns").insert(CAMPAIGN).execute()
        if result.data:
            print("Inserted campaign:", result.data[0].get("id"), "-", CAMPAIGN["name"])
        else:
            print("Insert returned no data.")
    except Exception as e:
        print("Error inserting campaign:", e)
        sys.exit(1)


if __name__ == "__main__":
    main()
