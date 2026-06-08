"""
Analytics API endpoints using Supabase.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.analytics import AnalyticsTrendsResponse, PortfolioAnalyticsResponse
from app.services.analytics.portfolio_analytics import (
    build_portfolio_summary,
    build_portfolio_trends,
    filter_accounts_by_billing,
)
from app.services.lifecycle.bucket_config import load_lifecycle_buckets_config
from supabase import create_client, Client
import os

# Load .env file explicitly
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

logger = get_logger(__name__)
router = APIRouter()


def get_supabase_client() -> Optional[Client]:
    """Get or create Supabase client."""
    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET")
        or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or settings.SUPABASE_KEY
    )

    if not supabase_url or not supabase_key:
        return None

    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


def _fetch_accounts(client: Client, billing_interval: Optional[str]) -> list:
    accounts_result = client.table("accounts").select(
        "id, name, arr, mrr, monthly_wise_instalment, status, renewal_stage, "
        "health_score, relationship_score, sentiment_score, churn_probability, risk_score, "
        "utilization_percentage, contract_start_date, contract_end_date, renewal_date"
    ).execute()
    accounts = accounts_result.data if accounts_result.data else []
    return filter_accounts_by_billing(accounts, billing_interval)


def _fetch_opportunities(client: Client) -> list:
    try:
        result = client.table("upsell_opportunities").select(
            "id, account_id, predicted_value, status, probability"
        ).execute()
        return result.data if result.data else []
    except Exception as e:
        logger.warning(f"Could not fetch upsell opportunities: {e}")
        return []


def _load_goals(client: Client) -> dict:
    try:
        from app.api.v1.endpoints.settings import _load_settings_from_db

        app_settings = _load_settings_from_db()
        metrics = app_settings.metrics
        return {
            "upsell_pipeline_target": float(metrics.upsellPipelineTarget),
            "renewal_target_percent": float(metrics.renewalTarget),
            "high_risk_threshold_percent": float(metrics.highRiskScoreThresholdPercent),
        }
    except Exception as e:
        logger.warning(f"Could not load settings goals: {e}")
        return {}


@router.get("/dashboard")
async def get_dashboard_stats(billing_interval: Optional[str] = None):
    """Get dashboard analytics from Supabase, optionally scoped to monthly/annual accounts."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        accounts = _fetch_accounts(client, billing_interval)

        if not accounts:
            return {
                "total_accounts": 0,
                "churn_risk_count": 0,
                "avg_health_score": 0.0,
                "avg_relationship_score": 0.0,
                "avg_sentiment_score": 0.0,
                "total_arr": 0.0,
                "upsell_pipeline": 0.0,
            }

        bucket_cfg = load_lifecycle_buckets_config()
        goals = _load_goals(client)
        summary = build_portfolio_summary(
            accounts,
            _fetch_opportunities(client),
            bucket_cfg,
            billing_interval,
            goals,
        )
        kpis = summary["kpis"]
        return {
            "total_accounts": kpis["total_accounts"],
            "churn_risk_count": kpis["churn_risk_count"],
            "avg_health_score": kpis["avg_health_score"],
            "avg_relationship_score": kpis["avg_relationship_score"],
            "avg_sentiment_score": kpis["avg_sentiment_score"],
            "total_arr": kpis["total_revenue"],
            "upsell_pipeline": kpis["upsell_pipeline"],
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        import traceback

        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")


@router.get("/portfolio", response_model=PortfolioAnalyticsResponse)
async def get_portfolio_analytics(billing_interval: Optional[str] = None):
    """Full portfolio analytics summary for the Analytics page."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        accounts = _fetch_accounts(client, billing_interval)
        opportunities = _fetch_opportunities(client)
        bucket_cfg = load_lifecycle_buckets_config()
        goals = _load_goals(client)
        payload = build_portfolio_summary(
            accounts,
            opportunities,
            bucket_cfg,
            billing_interval,
            goals,
        )
        return payload
    except Exception as e:
        logger.error(f"Error fetching portfolio analytics: {e}")
        import traceback

        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch portfolio analytics: {str(e)}"
        )


@router.get("/trends", response_model=AnalyticsTrendsResponse)
async def get_analytics_trends(
    billing_interval: Optional[str] = None,
    months: int = 12,
):
    """Monthly portfolio trend series for charts."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    months = max(3, min(months, 24))

    try:
        accounts = _fetch_accounts(client, billing_interval)
        payload = build_portfolio_trends(client, accounts, billing_interval, months)
        return payload
    except Exception as e:
        logger.error(f"Error fetching analytics trends: {e}")
        import traceback

        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch analytics trends: {str(e)}"
        )
