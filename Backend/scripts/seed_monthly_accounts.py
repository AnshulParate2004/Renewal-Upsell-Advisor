"""
Create 10 new accounts with month-wise subscription (mrr set).
Works even if billing_interval column does not exist yet.
Run from Backend folder: cd Backend && python scripts/seed_monthly_accounts.py
Requires: SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) in .env.
"""
import os
import sys
from datetime import datetime, timedelta, timezone

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


# 10 monthly (month-wise) subscription accounts with full fields
MONTHLY_ACCOUNTS = [
    {"name": "Monthly Tech Solutions Inc", "domain": "monthlytech.io", "mrr": 4200, "salesforce_id": "SF-MTH-001"},
    {"name": "CloudFlow Monthly", "domain": "cloudflow-monthly.com", "mrr": 3100, "salesforce_id": "SF-MTH-002"},
    {"name": "DataDrive Labs", "domain": "datadrivelabs.com", "mrr": 5800, "salesforce_id": "SF-MTH-003"},
    {"name": "NextGen Software Co", "domain": "nextgensoft.co", "mrr": 2500, "salesforce_id": "SF-MTH-004"},
    {"name": "ScaleUp Monthly", "domain": "scaleup-monthly.net", "mrr": 6700, "salesforce_id": "SF-MTH-005"},
    {"name": "Agile Works Inc", "domain": "agileworks.io", "mrr": 3900, "salesforce_id": "SF-MTH-006"},
    {"name": "StreamLine Services", "domain": "streamline-svc.com", "mrr": 5100, "salesforce_id": "SF-MTH-007"},
    {"name": "Peak Performance Ltd", "domain": "peakperf.io", "mrr": 4400, "salesforce_id": "SF-MTH-008"},
    {"name": "Vertex Monthly", "domain": "vertex-monthly.com", "mrr": 3600, "salesforce_id": "SF-MTH-009"},
    {"name": "Nova Digital", "domain": "novadigital.co", "mrr": 2900, "salesforce_id": "SF-MTH-010"},
]

# CSM and primary contact (same for all monthly accounts)
CSM_EMAIL = "cocanshulnprate@gmail.com"
CSM_NAME = "Consultnate"
PRIMARY_CONTACT_NAME = "Consultnate Primary Contact"
PRIMARY_CONTACT_EMAIL = "cocanshulnpurate@gmail.com"
PRIMARY_CONTACT_PHONE = "+91 8208170566"
PRIMARY_CONTACT_CITY = "Mumbai"
PRIMARY_CONTACT_STATE = "Maharashtra"
PARTNER_NAME = "Consultnate Partner"

# Sentiment options for variety
SENTIMENT_OPTIONS = [
    {"sentiment_score": 0.6, "sentiment_category": "positive"},
    {"sentiment_score": 0.2, "sentiment_category": "neutral"},
    {"sentiment_score": -0.1, "sentiment_category": "neutral"},
    {"sentiment_score": 0.8, "sentiment_category": "positive"},
]


def main():
    client = get_supabase_client()
    today = datetime.now(timezone.utc).date()
    renewal = (today + timedelta(days=30)).isoformat()
    contract_start = (today - timedelta(days=90)).isoformat()
    contract_end = (today + timedelta(days=275)).isoformat()

    inserted = 0
    for i, acc in enumerate(MONTHLY_ACCOUNTS):
        last_contact = (today - timedelta(days=2 + i)).isoformat()
        sent = SENTIMENT_OPTIONS[i % len(SENTIMENT_OPTIONS)]
        row = {
            "name": acc["name"],
            "domain": acc.get("domain", ""),
            "industry": "Technology",
            "company_size": "Medium",
            "salesforce_id": acc.get("salesforce_id", f"SF-MTH-{i+1:03d}"),
            "contract_start_date": contract_start,
            "contract_end_date": contract_end,
            "renewal_date": renewal,
            "last_contact_date": last_contact,
            "mrr": acc["mrr"],
            "monthly_wise_instalment": acc["mrr"],
            "status": "active",
            "renewal_stage": "m1",
            "health_score": 70 + (i % 25),
            "risk_score": 20 + (i % 30),
            "relationship_score": 65 + (i % 25),
            "churn_probability": round(0.1 + (i % 5) * 0.05, 2),
            "sentiment_score": sent["sentiment_score"],
            "sentiment_category": sent["sentiment_category"],
            "licenses_total": 50 + (i * 5),
            "licenses_used": 35 + (i * 3),
            "utilization_percentage": 0.7 + (i % 3) * 0.1,
            "csm_name": CSM_NAME,
            "csm_email": CSM_EMAIL,
            "primary_contact_name": PRIMARY_CONTACT_NAME,
            "primary_contact_email": PRIMARY_CONTACT_EMAIL,
            "primary_contact_phone": PRIMARY_CONTACT_PHONE,
            "primary_contact_city": PRIMARY_CONTACT_CITY,
            "primary_contact_state": PRIMARY_CONTACT_STATE,
            "partner_name": PARTNER_NAME,
        }
        try:
            client.table("accounts").insert(row).execute()
            inserted += 1
            print(f"  Created: {acc['name']} (mrr={acc['mrr']})")
        except Exception as e:
            err_str = str(e).lower()
            if "monthly_wise_instalment" in err_str or "pgrst204" in err_str:
                row.pop("monthly_wise_instalment", None)
                try:
                    client.table("accounts").insert(row).execute()
                    inserted += 1
                    print(f"  Created: {acc['name']} (mrr={acc['mrr']})")
                except Exception as e2:
                    print(f"  Skip {acc['name']}: {e2}")
            else:
                print(f"  Skip {acc['name']}: {e}")

    print(f"\nDone. Inserted {inserted} monthly (month-wise) subscription accounts.")
    if inserted > 0:
        print("\nTo show them under the Monthly toggle, run in Supabase SQL Editor:")
        print("  1. Backend/app/db/sql/add_billing_interval_to_accounts.sql")
        print("  2. Then: UPDATE accounts SET billing_interval = 'monthly' WHERE mrr IS NOT NULL AND mrr > 0;")


if __name__ == "__main__":
    main()
