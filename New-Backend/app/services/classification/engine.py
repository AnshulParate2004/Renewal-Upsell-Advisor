"""Lifecycle bucket classification — fit-ratio priority cascade."""
from __future__ import annotations

from datetime import date
from typing import Any

from app.services.scoring.config import LifecycleBucketsConfig

STAGE_PRIORITY = {
    "protect": 1,
    "renew": 2,
    "activate": 3,
    "expand": 4,
    "adopt": 5,
}


def days_until_renewal(account: dict[str, Any], today: date | None = None) -> int:
    today = today or date.today()
    renewal = account.get("renewal_date") or account.get("contract_end_date")
    if renewal is None:
        return 90
    if hasattr(renewal, "date"):
        renewal = renewal.date()
    return max(0, (renewal - today).days)


def days_since_start(account: dict[str, Any], today: date | None = None) -> int:
    today = today or date.today()
    start = account.get("contract_start_date")
    if start is None:
        return 365
    if hasattr(start, "date"):
        start = start.date()
    return max(0, (today - start).days)


def classify_lifecycle_bucket(account: dict[str, Any], cfg: LifecycleBucketsConfig) -> str:
    status = (account.get("status") or "").lower()
    risk = int(account.get("risk_score") or 0)
    health = int(account.get("health_score") or 0)
    util = float(account.get("utilization_percentage") or account.get("util_pct") or 0)
    if util <= 1:
        util *= 100
    days_renew = days_until_renewal(account)
    days_start = days_since_start(account)

    if risk >= cfg.protect_min_risk_score or (
        cfg.protect_include_at_risk_status and status == "at_risk"
    ):
        return "protect"
    if cfg.renew_window_min_days <= days_renew <= cfg.renew_window_max_days:
        return "renew"
    if days_start <= cfg.activate_max_days_since_start and util < cfg.activate_max_utilization_percent:
        return "activate"
    if (
        health >= cfg.expand_min_health_score
        and util >= cfg.expand_min_utilization_percent
        and risk < cfg.expand_max_risk_score
    ):
        return "expand"
    return "adopt"


def compute_quarter(account: dict[str, Any], today: date | None = None) -> str:
    days = days_until_renewal(account, today)
    if days >= 271:
        return "q1"
    if days >= 181:
        return "q2"
    if days >= 91:
        return "q3"
    return "q4"
