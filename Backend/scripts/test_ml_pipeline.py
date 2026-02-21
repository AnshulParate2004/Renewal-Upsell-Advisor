"""
Test script for the ML pipeline (Relationship -> Health -> Churn -> Upsell).
Run from Backend directory: python scripts/test_ml_pipeline.py
Or from repo root: python Backend/scripts/test_ml_pipeline.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Ensure Backend app is on path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

# Load env
env_path = backend_dir / ".env"
if not env_path.exists():
    env_path = backend_dir.parent / ".env"
if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path, override=True)


def get_sample_account():
    """Sample account dict matching DB schema (raw + optional fields)."""
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    return {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "Test Corp",
        "industry": "Technology",
        "company_size": "Medium",
        "arr": 120000,
        "mrr": 10000,
        "contract_start_date": "2024-01-01",
        "contract_end_date": "2025-12-31",
        "renewal_date": (now.date() + timedelta(days=60)).isoformat(),
        "last_contact_date": (now - timedelta(days=5)).isoformat(),
        "status": "active",
        "renewal_stage": "t60",
        "licenses_total": 100,
        "licenses_used": 75,
        "utilization_percentage": 75.0,
        "sentiment_score": 0.4,
        "sentiment_category": "positive",
        "relationship_score": None,
        "health_score": None,
        "risk_score": None,
        "churn_probability": None,
    }


def test_pipeline_with_sample():
    """Run pipeline with a sample account (no DB)."""
    from app.services.ml.ml_pipeline import run_pipeline_for_account

    print("=" * 60)
    print("ML Pipeline Test (sample account)")
    print("=" * 60)
    account = get_sample_account()
    print("\nInput account (relevant fields):")
    for k in ["id", "industry", "company_size", "arr", "renewal_date", "last_contact_date",
              "licenses_total", "licenses_used", "utilization_percentage", "sentiment_score", "sentiment_category"]:
        print(f"  {k}: {account.get(k)}")

    print("\nRunning pipeline (Relationship -> Health -> Churn -> Upsell)...")
    result = run_pipeline_for_account(account)

    if result.get("error"):
        print(f"\n[FAIL] Error: {result['error']}")
        return False

    print("\n--- Account updates (to be written to DB) ---")
    for k, v in result["account_updates"].items():
        print(f"  {k}: {v}")

    if result.get("churn_prediction_row"):
        print("\n--- Churn prediction row ---")
        for k, v in result["churn_prediction_row"].items():
            print(f"  {k}: {v}")

    if result.get("upsell_opportunity_row"):
        print("\n--- Upsell opportunity row ---")
        for k, v in result["upsell_opportunity_row"].items():
            print(f"  {k}: {v}")

    # Basic asserts
    assert "relationship_score" in result["account_updates"], "Missing relationship_score"
    assert "health_score" in result["account_updates"], "Missing health_score"
    assert 0 <= result["account_updates"]["relationship_score"] <= 100
    assert 0 <= result["account_updates"]["health_score"] <= 100
    print("\n[OK] Pipeline run succeeded and outputs look valid.")
    return True


def test_pipeline_with_supabase_account():
    """Run pipeline with one real account from Supabase (if configured)."""
    try:
        from app.services.email.scheduler import get_supabase_client
    except Exception as e:
        print(f"Could not import Supabase client: {e}")
        return None
    client = get_supabase_client()
    if not client:
        print("Supabase not configured. Skip live-account test.")
        return None
    r = client.table("accounts").select("*").limit(1).execute()
    if not r.data or len(r.data) == 0:
        print("No accounts in DB. Skip live-account test.")
        return None
    account = r.data[0]
    print("\n" + "=" * 60)
    print("ML Pipeline Test (1 account from Supabase)")
    print("=" * 60)
    print(f"Account: {account.get('name')} (id: {account.get('id')})")
    from app.services.ml.ml_pipeline import run_pipeline_for_account
    result = run_pipeline_for_account(account)
    if result.get("error"):
        print(f"[FAIL] {result['error']}")
        return False
    print("Account updates:", result["account_updates"])
    print("[OK] Live account pipeline succeeded.")
    return True


if __name__ == "__main__":
    ok = test_pipeline_with_sample()
    if ok is False:
        sys.exit(1)
    test_pipeline_with_supabase_account()
    sys.exit(0)
