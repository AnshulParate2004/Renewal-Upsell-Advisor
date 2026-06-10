from datetime import date, timedelta

from app.services.classification.engine import classify_lifecycle_bucket, compute_quarter
from app.services.scoring.config import DEFAULT_LIFECYCLE_BUCKETS


def test_protect_bucket_high_risk():
    account = {
        "risk_score": 85,
        "health_score": 40,
        "utilization_percentage": 50,
        "status": "active",
        "renewal_date": date.today() + timedelta(days=60),
        "contract_start_date": date.today() - timedelta(days=100),
    }
    assert classify_lifecycle_bucket(account, DEFAULT_LIFECYCLE_BUCKETS) == "protect"


def test_quarter_q4_near_renewal():
    account = {"renewal_date": date.today() + timedelta(days=30)}
    assert compute_quarter(account) == "q4"
