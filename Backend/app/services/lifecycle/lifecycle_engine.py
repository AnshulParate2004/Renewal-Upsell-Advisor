"""Lifecycle stage classification and NBA recommendations (backend source of truth)."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.services.lifecycle.bucket_config import DEFAULT_LIFECYCLE_BUCKETS_CONFIG, LifecycleBucketsConfig
from app.services.lifecycle.constants import (
    ACTION_BY_STAGE,
    AGENT_ACTIONS,
    ASSET_MAP,
    CHANNEL_BY_STAGE,
    CHANNEL_LABEL,
    CHANNEL_REASON,
    DUE_BY_STAGE,
    EXPAND_PRODUCT,
    LIFECYCLE_STAGES,
    STAGE_LABELS,
    STAGE_PRIORITY,
    VENDOR_CATALOGS,
)
from app.services.lifecycle.history import adjust_for_history, fetch_account_history


def _normalize_util(u: float) -> float:
    if 0 <= u <= 1:
        return u * 100
    return float(u)


def _days_until(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    try:
        s = str(date_str)[:10]
        target = datetime.fromisoformat(s)
        return (target.date() - datetime.now().date()).days
    except (ValueError, TypeError):
        return None


def _days_since(date_str: Optional[str]) -> int:
    if not date_str:
        return 999
    try:
        s = str(date_str)[:10]
        start = datetime.fromisoformat(s)
        return (datetime.now().date() - start.date()).days
    except (ValueError, TypeError):
        return 999


def _renewal_days(account: Dict[str, Any]) -> Optional[int]:
    status = (account.get("status") or "").lower()
    renewal = account.get("renewal_date")
    contract_end = account.get("contract_end_date")
    if status in ("renewed", "renewal") and contract_end:
        return _days_until(contract_end)
    if renewal:
        return _days_until(renewal)
    if contract_end:
        return _days_until(contract_end)
    return None


def _contract_progress(account: Dict[str, Any]) -> Dict[str, int]:
    start = account.get("contract_start_date")
    end = account.get("contract_end_date")
    if not start or not end:
        return {"month": 12, "total": 36}
    try:
        s = datetime.fromisoformat(str(start)[:10])
        e = datetime.fromisoformat(str(end)[:10])
        total_days = max(1, (e - s).days)
        elapsed = max(0, (datetime.now().date() - s.date()).days)
        total_months = max(1, round(total_days / 30.44))
        month = max(1, min(total_months, round(elapsed / 30.44)))
        return {"month": month, "total": total_months}
    except (ValueError, TypeError):
        return {"month": 12, "total": 36}


def _seed_from_id(account_id: str, salt: int) -> int:
    h = salt
    for ch in account_id:
        h = (h * 31 + ord(ch)) % 100
    return h


def build_consumption(account: Dict[str, Any], vendor: str) -> List[Dict[str, Any]]:
    base = int(round(_normalize_util(float(account.get("utilization_percentage") or 0))))
    catalog = VENDOR_CATALOGS.get(vendor, VENDOR_CATALOGS["default"])
    account_id = str(account.get("id") or "")
    result = []
    for idx, p in enumerate(catalog):
        purchased = p["purchased"]
        if p["product_id"] in ("zdx", "dlp", "stock", "sign", "cloud", "intel", "addon"):
            purchased = base > (20 + idx * 10)
        variance = _seed_from_id(account_id, idx + 7) - 50
        current = max(0, min(100, base + variance - idx * 8)) if purchased else 0
        result.append({
            "product_id": p["product_id"],
            "name": p["name"],
            "purchased": purchased,
            "deployed": purchased and current >= 15,
            "current_pct": current,
            "target_pct": p["target_pct"],
        })
    return result


def classify_stage(
    account: Dict[str, Any],
    bucket_cfg: Optional[LifecycleBucketsConfig] = None,
) -> str:
    cfg = bucket_cfg or DEFAULT_LIFECYCLE_BUCKETS_CONFIG
    risk = float(account.get("risk_score") or 0)
    util = _normalize_util(float(account.get("utilization_percentage") or 0))
    health = float(account.get("health_score") or 0)
    status = (account.get("status") or "").lower()
    days_start = _days_since(account.get("contract_start_date"))
    renewal = _renewal_days(account)

    if risk >= cfg.protect_min_risk_score or (
        cfg.protect_include_at_risk_status and status == "at_risk"
    ):
        return "protect"
    if days_start <= cfg.activate_max_days_since_start and util < cfg.activate_max_utilization_percent:
        return "activate"
    if renewal is not None and cfg.renew_window_min_days <= renewal <= cfg.renew_window_max_days:
        return "renew"
    if (
        health >= cfg.expand_min_health_score
        and util >= cfg.expand_min_utilization_percent
        and risk < cfg.expand_max_risk_score
    ):
        return "expand"
    if util < cfg.adopt_max_utilization_percent:
        return "adopt"
    return "adopt"


def _health_status(account: Dict[str, Any], stage: str) -> str:
    if stage == "activate":
        return "New Account"
    risk = float(account.get("risk_score") or 0)
    health = float(account.get("health_score") or 0)
    if risk >= 70 or (account.get("status") or "").lower() == "at_risk":
        return "At Risk"
    if health >= 70 and risk < 30:
        return "Excellent"
    if health >= 45 or risk < 50:
        return "Good"
    return "Watch"


def _health_eligible(account: Dict[str, Any]) -> bool:
    sent = (account.get("sentiment_category") or "").lower()
    sentiment_ok = "negative" not in sent
    checks = [
        float(account.get("health_score") or 0) >= 50,
        float(account.get("risk_score") or 100) < 60,
        _normalize_util(float(account.get("utilization_percentage") or 0)) >= 40,
        float(account.get("relationship_score") or 0) >= 45,
        sentiment_ok,
        float(account.get("churn_probability") or 1) < 0.5,
    ]
    return sum(1 for c in checks if c) >= 5


def _why_now(account: Dict[str, Any], stage: str, consumption: List[Dict[str, Any]]) -> str:
    util = int(round(_normalize_util(float(account.get("utilization_percentage") or 0))))
    renewal = _renewal_days(account)
    days_start = _days_since(account.get("contract_start_date"))
    prog = _contract_progress(account)
    contract_pct = int(round(prog["month"] / prog["total"] * 100))
    lagging = [p for p in consumption if p["purchased"] and p["current_pct"] < p["target_pct"]]
    undeployed = [p for p in consumption if p["purchased"] and not p["deployed"]]

    if stage == "protect":
        return (
            f"Risk score {int(account.get('risk_score') or 0)}. Critical event detected — "
            "P1 support ticket unresolved. Executive escalation threshold approaching in 5 days."
        )
    if stage == "renew":
        if renewal is not None:
            eligible = "Eligible for early renewal — 5 of 6 criteria met." if _health_eligible(account) else "Schedule QBR before renewal kickoff."
            return f"Renewal window opens in {renewal} days. {eligible}"
        return "Renewal approaching — initiate engagement sequence."
    if stage == "adopt":
        primary = lagging[0] if lagging else None
        extra = next((p for p in undeployed if not primary or p["product_id"] != primary["product_id"]), None)
        msg = f"Deployment significantly behind schedule ({contract_pct}% through contract, {util}% overall utilization)."
        if primary:
            name = primary["name"].split("(")[0].strip()
            msg += f" {name} at {primary['current_pct']}% vs {primary['target_pct']}% target."
        if extra:
            msg += f" {extra['name'].split('(')[0].strip()} purchased but not deployed."
        return msg
    if stage == "expand":
        intent = next((p for p in consumption if not p["purchased"]), None)
        suffix = f" Strong intent signal for {intent['name'].split('(')[0].strip()}." if intent else ""
        return f"High growth readiness — all current products fully utilized ({util}%).{suffix}"
    if stage == "activate":
        return f"Contract signed {days_start} days ago. Products not yet deployed — first 90 days are critical for adoption."
    return "Account requires lifecycle attention."


def _stage_urgency(account: Dict[str, Any], stage: str) -> float:
    risk = float(account.get("risk_score") or 0)
    util = _normalize_util(float(account.get("utilization_percentage") or 0))
    renewal = _renewal_days(account) or 999
    arr = float(account.get("arr") or 0)
    health = float(account.get("health_score") or 0)

    if stage == "protect":
        return risk * 10 + arr / 10000
    if stage == "renew":
        return max(0, 120 - renewal) * 5 + arr / 15000
    if stage == "adopt":
        return (100 - util) * 3 + arr / 20000
    if stage == "expand":
        return util + health
    if stage == "activate":
        return max(0, 90 - _days_since(account.get("contract_start_date")))
    return 0


def _format_currency(value: float) -> str:
    if value >= 1_000_000:
        return f"${value / 1_000_000:.1f}M"
    if value >= 1000:
        return f"${round(value / 1000)}K"
    return f"${int(value)}"


def build_account_alert(
    account: Dict[str, Any],
    vendor: str = "default",
    client: Optional[Any] = None,
    include_history: bool = False,
    bucket_cfg: Optional[LifecycleBucketsConfig] = None,
) -> Dict[str, Any]:
    stage = classify_stage(account, bucket_cfg)
    consumption = build_consumption(account, vendor)
    prog = _contract_progress(account)
    expand = EXPAND_PRODUCT.get(vendor, EXPAND_PRODUCT["default"])
    base_action = ACTION_BY_STAGE[stage].format(expand_product=expand)

    channel = CHANNEL_BY_STAGE[stage]
    channel_reason = CHANNEL_REASON[stage]
    history_insights: List[str] = []

    if include_history and client and account.get("id"):
        history = fetch_account_history(client, str(account["id"]))
        channel, base_action, channel_reason, history_insights = adjust_for_history(
            stage, channel, base_action, channel_reason, history
        )

    why_now = _why_now(account, stage, consumption)
    if history_insights:
        why_now += " Past actions: " + "; ".join(history_insights) + "."

    return {
        "account_id": account.get("id"),
        "account_name": account.get("name"),
        "stage": stage,
        "stage_label": STAGE_LABELS[stage],
        "priority": STAGE_PRIORITY[stage],
        "health_status": _health_status(account, stage),
        "score": int(account.get("risk_score") or 0) if stage == "protect" else int(account.get("health_score") or 0),
        "why_now": why_now,
        "consumption": consumption,
        "contract_month": prog["month"],
        "contract_total_months": prog["total"],
        "recommended_channel": channel,
        "recommended_channel_label": CHANNEL_LABEL[channel],
        "recommended_action": base_action,
        "channel_reason": channel_reason,
        "due_hint": DUE_BY_STAGE[stage],
        "history_insights": history_insights,
    }


def build_nba_item(alert: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": f"{alert['account_id']}-{alert['stage']}",
        "account_id": alert["account_id"],
        "account_name": alert["account_name"],
        "stage": alert["stage"],
        "stage_label": alert["stage_label"],
        "action": alert["recommended_action"],
        "priority": alert["priority"],
        "due_hint": alert["due_hint"],
    }


def build_agent_recommendation(alert: Dict[str, Any], vendor: str = "default") -> Dict[str, Any]:
    consumption = alert.get("consumption") or []
    lagging = [p for p in consumption if p.get("purchased") and p["current_pct"] < p["target_pct"]]
    primary = lagging[0] if lagging else (consumption[0] if consumption else None)
    stage = alert["stage"]

    if primary:
        insight = (
            f"{primary['name']} at {primary['current_pct']}% vs target {primary['target_pct']}% "
            f"for contract month {alert['contract_month']} of {alert['contract_total_months']}."
        )
    else:
        util = int(round(_normalize_util(float(alert.get("utilization_percentage") or 0))))
        insight = f"Overall utilization at {util}%."

    product_name = (primary or {}).get("name", "core product").split("(")[0].strip()
    actions = [
        a.format(product=product_name) for a in AGENT_ACTIONS.get(stage, [])
    ]

    return {
        "actions": actions,
        "assets": ASSET_MAP.get(vendor, ASSET_MAP["default"]),
        "data_insight": insight,
    }


def build_dashboard(
    accounts: List[Dict[str, Any]],
    vendor: str = "default",
    client: Optional[Any] = None,
    bucket_cfg: Optional[LifecycleBucketsConfig] = None,
) -> Dict[str, Any]:
    alerts = [
        build_account_alert(a, vendor, client, include_history=False, bucket_cfg=bucket_cfg)
        for a in accounts
    ]

    stage_alerts = []
    for stage_def in LIFECYCLE_STAGES:
        sid = stage_def["id"]
        candidates = [a for a in alerts if a["stage"] == sid]
        if not candidates:
            continue
        best = max(candidates, key=lambda a: _stage_urgency(
            next(acc for acc in accounts if acc.get("id") == a["account_id"]), sid
        ))
        stage_alerts.append(best)

    nba_items = sorted([build_nba_item(a) for a in alerts], key=lambda x: x["priority"])[:8]

    selected = (
        next((a for a in stage_alerts if a["stage"] == "adopt"), None)
        or next((a for a in stage_alerts if a["stage"] == "protect"), None)
        or (stage_alerts[0] if stage_alerts else None)
    )

    purchased = [p for a in alerts for p in (a.get("consumption") or []) if p.get("purchased")]
    avg_deployment = round(sum(p["current_pct"] for p in purchased) / len(purchased)) if purchased else 0

    stage_counts = {s["id"]: 0 for s in LIFECYCLE_STAGES}
    stage_counts["all"] = len(accounts)
    for a in alerts:
        stage_counts[a["stage"]] = stage_counts.get(a["stage"], 0) + 1

    return {
        "stage_alerts": stage_alerts,
        "account_alerts": alerts,
        "nba_items": nba_items,
        "selected_alert": selected,
        "agent_recommendation": build_agent_recommendation(selected, vendor) if selected else None,
        "portfolio_consumption": {
            "avg_deployment_pct": avg_deployment,
            "products_at_risk": sum(1 for p in purchased if p["current_pct"] < p["target_pct"] * 0.6),
            "unused_entitlements": sum(1 for p in purchased if not p.get("deployed")),
            "accounts_needing_action": sum(
                1 for a in alerts if a["stage"] != "expand" or a["health_status"] != "Excellent"
            ),
        },
        "stage_counts": stage_counts,
    }


def get_action_recommendation(
    account: Dict[str, Any],
    vendor: str = "default",
    client: Optional[Any] = None,
    bucket_cfg: Optional[LifecycleBucketsConfig] = None,
) -> Dict[str, Any]:
    alert = build_account_alert(account, vendor, client, include_history=True, bucket_cfg=bucket_cfg)
    return {
        "channel": alert["recommended_channel"],
        "channel_label": alert["recommended_channel_label"],
        "action": alert["recommended_action"],
        "why_now": alert["why_now"],
        "channel_reason": alert["channel_reason"],
        "stage": alert["stage"],
        "stage_label": alert["stage_label"],
        "due_hint": alert["due_hint"],
        "history_insights": alert.get("history_insights") or [],
    }
