"""Lifecycle and NBA recommendation API endpoints."""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.api.deps import get_supabase_client
from app.core.logging import get_logger
from app.schemas.lifecycle import (
    ActionRecommendationResponse,
    AgentRecommendationResponse,
    LifecycleDashboardResponse,
)
from app.services.lifecycle.bucket_config import load_lifecycle_buckets_config
from app.services.lifecycle.lifecycle_engine import (
    build_account_alert,
    build_agent_recommendation,
    build_dashboard,
    get_action_recommendation,
)

logger = get_logger(__name__)
router = APIRouter()

ACCOUNT_COLS = (
    "id, name, industry, arr, mrr, monthly_wise_instalment, status, renewal_date, "
    "contract_start_date, contract_end_date, renewal_stage, health_score, risk_score, "
    "relationship_score, churn_probability, sentiment_category, utilization_percentage"
)


def _account_arr(account: dict) -> float:
    try:
        return float(account.get("arr") or 0)
    except (TypeError, ValueError):
        return 0.0


def _account_mrr(account: dict) -> float:
    for key in ("mrr", "monthly_wise_instalment"):
        val = account.get(key)
        if val is not None and val != "":
            try:
                return float(val)
            except (TypeError, ValueError):
                continue
    return 0.0


def _is_annual_account(account: dict) -> bool:
    """Match frontend: ARR view => accounts with arr > 0."""
    return _account_arr(account) > 0


def _is_monthly_account(account: dict) -> bool:
    """Match frontend: MRR view => mrr present and no arr."""
    return _account_mrr(account) > 0 and _account_arr(account) <= 0


def _filter_by_billing_interval(accounts: list, billing_interval: Optional[str]) -> list:
    if not billing_interval:
        return accounts
    bi = billing_interval.lower()
    if bi == "monthly":
        return [a for a in accounts if _is_monthly_account(a)]
    if bi == "annual":
        return [a for a in accounts if _is_annual_account(a)]
    return accounts


def _missing_column_error(err: Exception) -> bool:
    msg = str(err)
    return "42703" in msg or "does not exist" in msg or "billing_interval" in msg


def _normalize_vendor(vendor: Optional[str]) -> str:
    v = (vendor or "zscaler").lower().strip()
    if v in ("aditya_birla", "adobe"):
        return "adobe"
    if v == "crowdstrike":
        return "crowdstrike"
    if v == "zscaler":
        return "zscaler"
    return "default"


def _fetch_accounts(client, billing_interval: Optional[str]) -> list:
    accounts: list = []
    try:
        query = client.table("accounts").select(ACCOUNT_COLS)
        if billing_interval and billing_interval.lower() in ("monthly", "annual"):
            bi = billing_interval.lower()
            if bi == "monthly":
                query = query.eq("billing_interval", "monthly")
            else:
                query = query.or_("billing_interval.eq.annual,billing_interval.is.null")
        result = query.limit(1000).execute()
        accounts = result.data or []
    except Exception as err:
        if not _missing_column_error(err):
            raise
        logger.warning(f"Lifecycle accounts fetch fallback (no billing_interval column): {err}")
        result = client.table("accounts").select(ACCOUNT_COLS).limit(1000).execute()
        accounts = result.data or []

    if billing_interval and billing_interval.lower() in ("monthly", "annual"):
        filtered = _filter_by_billing_interval(accounts, billing_interval)
        logger.info(
            f"Lifecycle billing filter {billing_interval}: {len(filtered)}/{len(accounts)} accounts"
        )
        return filtered
    return accounts


def _fetch_account(client, account_id: str) -> dict:
    try:
        result = client.table("accounts").select(ACCOUNT_COLS).eq("id", account_id).limit(1).execute()
    except Exception as err:
        if not _missing_column_error(err):
            raise
        logger.warning(f"Lifecycle account fetch fallback: {err}")
        result = client.table("accounts").select(ACCOUNT_COLS).eq("id", account_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Account not found")
    return result.data[0]


@router.get("/dashboard", response_model=LifecycleDashboardResponse)
async def get_lifecycle_dashboard(
    vendor: Optional[str] = Query("zscaler"),
    billing_interval: Optional[str] = Query(None),
):
    """Portfolio lifecycle dashboard with stage alerts, NBA digest, and consumption KPIs."""
    try:
        client = get_supabase_client()
    except ValueError:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        accounts = _fetch_accounts(client, billing_interval)
        bucket_cfg = load_lifecycle_buckets_config()
        data = build_dashboard(accounts, _normalize_vendor(vendor), client, bucket_cfg=bucket_cfg)
        return data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lifecycle dashboard error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/accounts/{account_id}/agent", response_model=AgentRecommendationResponse)
async def get_account_agent_recommendation(
    account_id: str,
    vendor: Optional[str] = Query("zscaler"),
):
    """Agent panel actions and assets for a single account."""
    try:
        client = get_supabase_client()
    except ValueError:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        account = _fetch_account(client, account_id)
        bucket_cfg = load_lifecycle_buckets_config()
        alert = build_account_alert(
            account, _normalize_vendor(vendor), client, include_history=False, bucket_cfg=bucket_cfg
        )
        return build_agent_recommendation(alert, _normalize_vendor(vendor))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Account agent recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/accounts/{account_id}/recommendation", response_model=ActionRecommendationResponse)
async def get_account_recommendation(
    account_id: str,
    vendor: Optional[str] = Query("zscaler"),
):
    """History-aware action recommendation for a single account (Action Board)."""
    try:
        client = get_supabase_client()
    except ValueError:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        account = _fetch_account(client, account_id)
        bucket_cfg = load_lifecycle_buckets_config()
        return get_action_recommendation(
            account, _normalize_vendor(vendor), client, bucket_cfg=bucket_cfg
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Account recommendation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
