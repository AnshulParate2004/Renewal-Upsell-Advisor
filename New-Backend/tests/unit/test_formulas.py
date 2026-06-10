"""Unit tests for scoring formulas."""
from datetime import date, timedelta

from app.services.scoring.config import DEFAULT_LIFECYCLE_BUCKETS, DEFAULT_SCORING_CONFIG
from app.services.scoring.formulas import run_formula_pipeline


def test_formula_pipeline_produces_scores():
    features = {
        "licenses_total": 100,
        "licenses_used": 80,
        "utilization_percentage": 80,
        "last_contact_date": date.today() - timedelta(days=15),
        "days_until_renewal": 60,
        "status": "active",
        "arr": 100000,
    }
    sentiment = {"sentiment_score": 0.5, "sentiment_category": "positive"}
    result = run_formula_pipeline(features, sentiment, DEFAULT_SCORING_CONFIG, DEFAULT_LIFECYCLE_BUCKETS)
    assert 0 <= result["health_score"] <= 100
    assert 0 <= result["relationship_score"] <= 100
    assert 0 <= result["risk_score"] <= 100
    assert 0 <= result["churn_probability"] <= 1


def test_at_risk_account_higher_churn():
    features = {
        "licenses_total": 50,
        "licenses_used": 10,
        "utilization_percentage": 20,
        "last_contact_date": date.today() - timedelta(days=120),
        "days_until_renewal": 15,
        "status": "at_risk",
        "arr": 50000,
    }
    sentiment = {"sentiment_score": -0.5, "sentiment_category": "negative"}
    result = run_formula_pipeline(features, sentiment, DEFAULT_SCORING_CONFIG, DEFAULT_LIFECYCLE_BUCKETS)
    assert result["churn_probability"] >= 0.5
    assert result["risk_score"] >= 70
