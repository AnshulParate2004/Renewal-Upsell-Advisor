"""Portfolio-level analytics aggregation and trend backfill."""
from __future__ import annotations

import uuid
from calendar import month_abbr
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from app.services.lifecycle.bucket_config import LifecycleBucketsConfig
from app.services.lifecycle.constants import STAGE_LABELS
from app.services.lifecycle.lifecycle_engine import build_consumption, classify_stage

QUARTER_BANDS = [
    ("q1", "Q1", "271+ days to renewal", lambda d: d is not None and d >= 271),
    ("q2", "Q2", "181–270 days", lambda d: d is not None and 181 <= d <= 270),
    ("q3", "Q3", "91–180 days", lambda d: d is not None and 91 <= d <= 180),
    ("q4", "Q4", "0–90 days + overdue", lambda d: d is not None and d <= 90),
]

LIFECYCLE_STAGE_ORDER = ["protect", "renew", "adopt", "expand", "activate"]

SCORE_BUCKETS = [
    ("0–39", 0, 39),
    ("40–69", 40, 69),
    ("70–100", 70, 100),
]


def _arr(acc: dict) -> float:
    try:
        return float(acc.get("arr") or 0)
    except (TypeError, ValueError):
        return 0.0


def _mrr(acc: dict) -> float:
    for key in ("mrr", "monthly_wise_instalment"):
        val = acc.get(key)
        if val is not None and val != "":
            try:
                return float(val)
            except (TypeError, ValueError):
                continue
    return 0.0


def account_revenue(acc: dict, billing_interval: Optional[str]) -> float:
    if billing_interval and billing_interval.lower() == "monthly":
        return _mrr(acc)
    return _arr(acc)


def filter_accounts_by_billing(
    accounts: List[dict], billing_interval: Optional[str]
) -> List[dict]:
    if billing_interval and billing_interval.lower() == "monthly":
        return [a for a in accounts if _mrr(a) > 0 and _arr(a) <= 0]
    if billing_interval and billing_interval.lower() == "annual":
        return [a for a in accounts if _arr(a) > 0]
    return accounts


def _is_renewed(acc: dict) -> bool:
    s = (acc.get("status") or "").strip().lower()
    r = (acc.get("renewal_stage") or "").strip().lower()
    return s in ("renewed", "renewal") or r == "renewed"


def _normalize_util(u: float) -> float:
    if 0 <= u <= 1:
        return u * 100
    return float(u)


def _days_until(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    try:
        target = datetime.fromisoformat(str(date_str)[:10])
        return (target.date() - datetime.now().date()).days
    except (ValueError, TypeError):
        return None


def _renewal_days(acc: dict) -> Optional[int]:
    status = (acc.get("status") or "").lower()
    renewal = acc.get("renewal_date")
    contract_end = acc.get("contract_end_date")
    if status in ("renewed", "renewal") and contract_end:
        return _days_until(contract_end)
    if renewal:
        return _days_until(renewal)
    if contract_end:
        return _days_until(contract_end)
    return None


def _resolve_quarter(days: Optional[int]) -> str:
    if days is None:
        return "q4"
    if days >= 271:
        return "q1"
    if days >= 181:
        return "q2"
    if days >= 91:
        return "q3"
    return "q4"


def _bucket_scores(values: List[float]) -> List[dict]:
    buckets = {label: 0 for label, _, _ in SCORE_BUCKETS}
    for val in values:
        for label, lo, hi in SCORE_BUCKETS:
            if lo <= val <= hi:
                buckets[label] += 1
                break
    return [{"bucket": k, "count": v} for k, v in buckets.items()]


def _stage_from_opportunity(opp: dict) -> str:
    status = (opp.get("status") or "").strip().lower()
    stages = (
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "identified",
        "closed_won",
        "closed_lost",
    )
    if status and status not in ("identified",) and status in stages:
        return status
    prob = float(opp.get("probability") or opp.get("predicted_probability") or 0)
    if prob < 0.25:
        return "prospecting"
    if prob < 0.45:
        return "qualification"
    if prob < 0.65:
        return "proposal"
    if prob < 0.85:
        return "negotiation"
    return "identified"


def _churn_risk(acc: dict, threshold: float = 70.0) -> bool:
    if _is_renewed(acc):
        return False
    risk = float(acc.get("risk_score") or 0)
    churn = float(acc.get("churn_probability") or 0)
    return risk >= threshold or churn >= 0.7


def build_portfolio_summary(
    accounts: List[dict],
    opportunities: List[dict],
    bucket_cfg: LifecycleBucketsConfig,
    billing_interval: Optional[str] = None,
    goals: Optional[dict] = None,
    vendor: str = "default",
) -> dict:
    goals = goals or {}
    high_risk_threshold = float(goals.get("high_risk_threshold_percent", 70))

    lifecycle_counts: Dict[str, int] = {s: 0 for s in LIFECYCLE_STAGE_ORDER}
    lifecycle_revenue: Dict[str, float] = {s: 0.0 for s in LIFECYCLE_STAGE_ORDER}
    quarter_counts: Dict[str, int] = {q[0]: 0 for q in QUARTER_BANDS}
    quarter_revenue: Dict[str, float] = {q[0]: 0.0 for q in QUARTER_BANDS}

    health_vals: List[float] = []
    risk_vals: List[float] = []
    util_vals: List[float] = []
    rel_vals: List[float] = []
    sent_vals: List[float] = []

    at_risk_rows: List[dict] = []
    purchased_products: List[dict] = []
    accounts_needing_action = 0

    total_revenue = 0.0
    churn_risk_count = 0
    accounts_on_track = 0
    renewed_count = 0

    visible_ids = {str(a.get("id")) for a in accounts}

    for acc in accounts:
        rev = account_revenue(acc, billing_interval)
        total_revenue += rev

        if _is_renewed(acc):
            renewed_count += 1

        stage = classify_stage(acc, bucket_cfg)
        lifecycle_counts[stage] = lifecycle_counts.get(stage, 0) + 1
        lifecycle_revenue[stage] = lifecycle_revenue.get(stage, 0.0) + rev

        qid = _resolve_quarter(_renewal_days(acc))
        quarter_counts[qid] = quarter_counts.get(qid, 0) + 1
        quarter_revenue[qid] = quarter_revenue.get(qid, 0.0) + rev

        risk = float(acc.get("risk_score") or 0)
        health = float(acc.get("health_score") or 0)
        util = _normalize_util(float(acc.get("utilization_percentage") or 0))

        health_vals.append(health)
        risk_vals.append(risk)
        util_vals.append(util)
        if acc.get("relationship_score") is not None:
            rel_vals.append(float(acc.get("relationship_score")))
        if acc.get("sentiment_score") is not None:
            sent_vals.append(float(acc.get("sentiment_score")))

        if _churn_risk(acc, high_risk_threshold):
            churn_risk_count += 1
            at_risk_rows.append(
                {
                    "account_id": str(acc.get("id") or ""),
                    "account_name": acc.get("name") or acc.get("account_name") or "Unknown",
                    "stage": stage,
                    "stage_label": STAGE_LABELS.get(stage, stage.title()),
                    "risk_score": risk,
                    "renewal_days": _renewal_days(acc),
                    "revenue": rev,
                }
            )

        if risk < 40 or _is_renewed(acc):
            accounts_on_track += 1

        consumption = build_consumption(acc, vendor)
        purchased_products.extend([p for p in consumption if p.get("purchased")])
        if stage != "expand" or health < 70:
            accounts_needing_action += 1

    risk_distribution = [
        {"name": "Renewed", "value": renewed_count},
        {
            "name": "Low Risk",
            "value": sum(
                1
                for a in accounts
                if not _is_renewed(a) and float(a.get("risk_score") or 0) < 40
            ),
        },
        {
            "name": "Medium Risk",
            "value": sum(
                1
                for a in accounts
                if not _is_renewed(a)
                and 40 <= float(a.get("risk_score") or 0) < high_risk_threshold
            ),
        },
        {
            "name": "High Risk",
            "value": sum(
                1
                for a in accounts
                if not _is_renewed(a) and float(a.get("risk_score") or 0) >= high_risk_threshold
            ),
        },
    ]

    upsell_map: Dict[str, dict] = defaultdict(lambda: {"count": 0, "value": 0.0})
    upsell_pipeline = 0.0
    upsell_account_ids: set = set()

    for opp in opportunities:
        acc_id = str(opp.get("account_id") or "")
        if acc_id and acc_id not in visible_ids:
            continue
        status = (opp.get("status") or "").lower()
        if status in ("lost", "closed", "closed_lost"):
            continue
        val = float(opp.get("predicted_value") or opp.get("value") or 0)
        upsell_pipeline += val
        if acc_id:
            upsell_account_ids.add(acc_id)
        stage = _stage_from_opportunity(opp)
        upsell_map[stage]["count"] += 1
        upsell_map[stage]["value"] += val

    avg_deployment = (
        round(sum(p["current_pct"] for p in purchased_products) / len(purchased_products))
        if purchased_products
        else 0
    )

    total_accounts = len(accounts)
    renewal_rate = round((renewed_count / total_accounts) * 100, 1) if total_accounts else 0.0

    at_risk_rows.sort(key=lambda r: r["risk_score"], reverse=True)

    return {
        "kpis": {
            "total_accounts": total_accounts,
            "churn_risk_count": churn_risk_count,
            "avg_health_score": round(sum(health_vals) / len(health_vals), 2) if health_vals else 0.0,
            "avg_relationship_score": round(sum(rel_vals) / len(rel_vals), 2) if rel_vals else 0.0,
            "avg_sentiment_score": round(sum(sent_vals) / len(sent_vals), 2) if sent_vals else 0.0,
            "total_revenue": round(total_revenue, 2),
            "upsell_pipeline": round(upsell_pipeline, 2),
            "avg_utilization_percent": round(sum(util_vals) / len(util_vals), 1) if util_vals else 0.0,
            "accounts_on_track": accounts_on_track,
            "upsell_account_count": len(upsell_account_ids),
            "renewed_count": renewed_count,
        },
        "lifecycle_stages": [
            {
                "stage": sid,
                "label": STAGE_LABELS.get(sid, sid.title()),
                "count": lifecycle_counts.get(sid, 0),
                "revenue": round(lifecycle_revenue.get(sid, 0.0), 2),
            }
            for sid in LIFECYCLE_STAGE_ORDER
        ],
        "renewal_quarters": [
            {
                "quarter": qid,
                "label": label,
                "count": quarter_counts.get(qid, 0),
                "revenue": round(quarter_revenue.get(qid, 0.0), 2),
                "days_range": days_range,
            }
            for qid, label, days_range, _ in QUARTER_BANDS
        ],
        "risk_distribution": risk_distribution,
        "upsell_by_stage": [
            {"stage": stage, "count": data["count"], "value": round(data["value"], 2)}
            for stage, data in sorted(upsell_map.items())
        ],
        "portfolio_consumption": {
            "avg_deployment_pct": avg_deployment,
            "products_at_risk": sum(
                1 for p in purchased_products if p["current_pct"] < p["target_pct"] * 0.6
            ),
            "unused_entitlements": sum(1 for p in purchased_products if not p.get("deployed")),
            "accounts_needing_action": accounts_needing_action,
        },
        "score_distributions": [
            {"metric": "health", "buckets": _bucket_scores(health_vals)},
            {"metric": "risk", "buckets": _bucket_scores(risk_vals)},
            {"metric": "utilization", "buckets": _bucket_scores(util_vals)},
        ],
        "top_at_risk_accounts": at_risk_rows[:10],
        "goals": {
            "upsell_pipeline_target": float(goals.get("upsell_pipeline_target", 100_000)),
            "renewal_target_percent": float(goals.get("renewal_target_percent", 90)),
            "high_risk_threshold_percent": high_risk_threshold,
            "upsell_pipeline_actual": round(upsell_pipeline, 2),
            "renewal_rate_percent": renewal_rate,
            "high_risk_count": churn_risk_count,
        },
    }


def _month_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m")


def _month_label(dt: datetime) -> str:
    return month_abbr[dt.month]


def _seed_from_id(account_id: str, salt: int) -> int:
    h = salt
    for ch in account_id:
        h = (h * 31 + ord(ch)) % 100
    return h


def _generate_account_history_rows(
    acc: dict, months: int, billing_interval: Optional[str]
) -> List[dict]:
    """Deterministic monthly snapshots from current account scores."""
    account_id = str(acc.get("id") or "")
    health = float(acc.get("health_score") or 50)
    risk = float(acc.get("risk_score") or 50)
    rel = float(acc.get("relationship_score") or 50)
    churn = float(acc.get("churn_probability") or 0.3)
    util = _normalize_util(float(acc.get("utilization_percentage") or 0))
    sent = float(acc.get("sentiment_score") or 0)

    trend = "improving" if health >= 70 else "declining" if health < 40 else "stable"
    rows = []
    today = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    for i in range(months, -1, -1):
        dt = today - timedelta(days=30 * i)
        factor = (months - i) / months if months else 0.5
        if trend == "improving":
            tf = factor
        elif trend == "declining":
            tf = 1 - factor
        else:
            tf = 0.5
        variance = (_seed_from_id(account_id, i + 3) - 50) / 10

        rows.append(
            {
                "id": str(uuid.uuid4()),
                "account_id": account_id,
                "date": dt.isoformat(),
                "health_score": int(max(0, min(100, health + (tf - 0.5) * 30 + variance))),
                "risk_score": int(max(0, min(100, risk - (tf - 0.5) * 30 + variance))),
                "relationship_score": int(max(0, min(100, rel + (tf - 0.5) * 25 + variance))),
                "churn_probability": float(max(0, min(1, churn - (tf - 0.5) * 0.4 + variance / 100))),
                "utilization": float(max(0, min(100, util + (tf - 0.5) * 20 + variance))),
                "sentiment_score": float(sent + (tf - 0.5) * 0.3),
            }
        )
    return rows


def _aggregate_trends(
    history_rows: List[dict],
    accounts_by_id: Dict[str, dict],
    billing_interval: Optional[str],
    months: int,
) -> List[dict]:
    today = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    month_starts = [today - timedelta(days=30 * i) for i in range(months - 1, -1, -1)]
    keys = [_month_key(d) for d in month_starts]

    by_month: Dict[str, List[dict]] = defaultdict(list)
    for row in history_rows:
        try:
            dt = datetime.fromisoformat(str(row["date"]).replace("Z", "+00:00")[:19])
        except (ValueError, TypeError):
            continue
        by_month[_month_key(dt)].append(row)

    series = []
    for dt, key in zip(month_starts, keys):
        rows = by_month.get(key, [])
        if not rows:
            series.append(
                {
                    "month": _month_label(dt),
                    "total_revenue": 0.0,
                    "churn_risk_count": 0,
                    "renewed_count": 0,
                    "at_risk_count": 0,
                    "avg_health_score": 0.0,
                }
            )
            continue

        total_rev = 0.0
        churn_count = 0
        renewed = 0
        at_risk = 0
        health_sum = 0.0

        seen_accounts: set = set()
        for row in rows:
            acc_id = str(row.get("account_id") or "")
            if acc_id in seen_accounts:
                continue
            seen_accounts.add(acc_id)
            acc = accounts_by_id.get(acc_id, {})
            total_rev += account_revenue(acc, billing_interval)
            if _is_renewed(acc):
                renewed += 1
            risk = float(row.get("risk_score") or 0)
            churn = float(row.get("churn_probability") or 0)
            if not _is_renewed(acc) and (risk >= 70 or churn >= 0.7):
                churn_count += 1
                at_risk += 1
            health_sum += float(row.get("health_score") or 0)

        count = len(seen_accounts) or 1
        series.append(
            {
                "month": _month_label(dt),
                "total_revenue": round(total_rev, 2),
                "churn_risk_count": churn_count,
                "renewed_count": renewed,
                "at_risk_count": at_risk,
                "avg_health_score": round(health_sum / count, 2),
            }
        )
    return series


def build_portfolio_trends(
    client: Any,
    accounts: List[dict],
    billing_interval: Optional[str] = None,
    months: int = 12,
) -> dict:
    account_ids = [str(a.get("id")) for a in accounts if a.get("id")]
    accounts_by_id = {str(a.get("id")): a for a in accounts if a.get("id")}

    history_rows: List[dict] = []
    if client and account_ids:
        try:
            result = (
                client.table("metrics_history")
                .select("*")
                .in_("account_id", account_ids)
                .order("date")
                .execute()
            )
            history_rows = result.data or []
        except Exception:
            history_rows = []

    if not history_rows and accounts:
        generated: List[dict] = []
        for acc in accounts:
            generated.extend(_generate_account_history_rows(acc, months, billing_interval))
        history_rows = generated
        if client and generated:
            try:
                batch_size = 100
                for i in range(0, len(generated), batch_size):
                    client.table("metrics_history").upsert(
                        generated[i : i + batch_size], on_conflict="id"
                    ).execute()
            except Exception:
                pass

    series = _aggregate_trends(history_rows, accounts_by_id, billing_interval, months)
    return {"months": months, "series": series}
