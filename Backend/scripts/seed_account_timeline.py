"""
Seed account timeline events into activity_logs for the Timeline tab.
Each account gets the same set of events (with fixed past dates) so the Timeline
page shows consistent data loaded from the database.

Run from Backend with:
  python scripts/seed_account_timeline.py
  or: uv run python scripts/seed_account_timeline.py

Requires SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure app is importable and load .env
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from dotenv import load_dotenv
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
    load_dotenv(env_path)
except Exception:
    pass

from supabase import create_client

# Fixed timeline events (same for every account). event_date_offset = days before today.
TIMELINE_EVENTS = [
    {"type": "email", "title": "Product Update Announcement", "description": "Sent information about new features.", "sentiment": "neutral", "event_date_offset": 21},
    {"type": "call", "title": "Quarterly Business Review", "description": "Discussed Q4 performance and renewal terms.", "sentiment": "positive", "event_date_offset": 59},
    {"type": "support_ticket", "title": "Technical Issue Resolved", "description": "Integration bug fixed within SLA.", "sentiment": "neutral", "event_date_offset": 119},
    {"type": "meeting", "title": "Executive Stakeholder Meeting", "description": "Met with CTO to discuss strategic alignment.", "sentiment": "positive", "event_date_offset": 141},
    {"type": "usage_drop", "title": "Usage Declined", "description": "Notable decrease in active users.", "sentiment": "negative", "event_date_offset": 166},
    {"type": "email", "title": "Product Update Announcement", "description": "Sent information about new features.", "sentiment": "neutral", "event_date_offset": 185},
    {"type": "usage_drop", "title": "Usage Declined", "description": "Notable decrease in active users.", "sentiment": "negative", "event_date_offset": 206},
    {"type": "contract_change", "title": "Contract Amendment", "description": "Added 10 additional licenses.", "sentiment": "positive", "event_date_offset": 217},
    {"type": "payment", "title": "Payment Received", "description": "Invoice paid on time.", "sentiment": "positive", "event_date_offset": 230},
    {"type": "usage_spike", "title": "Usage Increased 40%", "description": "Significant increase in platform adoption.", "sentiment": "positive", "event_date_offset": 255},
]


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
    today = datetime.now(timezone.utc).date()

    # Fetch all account IDs
    result = client.table("accounts").select("id").execute()
    accounts = result.data or []
    if not accounts:
        print("No accounts found. Create accounts first.")
        return

    print(f"Seeding timeline for {len(accounts)} account(s)...")

    inserted = 0
    for acc in accounts:
        account_id = acc["id"]
        # Remove existing seed timeline events so re-run doesn't duplicate
        try:
            existing = (
                client.table("activity_logs")
                .select("id")
                .eq("account_id", account_id)
                .eq("action", "timeline_event")
                .execute()
            )
            for r in (existing.data or []):
                client.table("activity_logs").delete().eq("id", r["id"]).execute()
        except Exception as e:
            print(f"  Note: could not clear old timeline_event rows for {account_id[:8]}...: {e}")
        for ev in TIMELINE_EVENTS:
            event_date = (today - timedelta(days=ev["event_date_offset"])).isoformat()
            row = {
                "account_id": account_id,
                "action": "timeline_event",
                "details": {
                    "type": ev["type"],
                    "title": ev["title"],
                    "description": ev["description"],
                    "sentiment": ev["sentiment"],
                    "event_date": event_date,
                },
            }
            try:
                client.table("activity_logs").insert(row).execute()
                inserted += 1
            except Exception as e:
                print(f"  Skip duplicate or error for account {account_id[:8]}... {ev['title']}: {e}")

    print(f"Done. Inserted {inserted} timeline events.")


if __name__ == "__main__":
    main()
