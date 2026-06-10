#!/usr/bin/env python3
"""Score New-Backend alignment against Document/tech-plan."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TECH_PLAN = ROOT.parent / "Document" / "tech-plan"

DDL_TABLES = [
    "tenants", "users", "roles", "user_roles", "accounts", "contacts", "contracts",
    "usage_metrics", "support_tickets", "account_comments", "ml_score_history",
    "churn_predictions", "upsell_opportunities", "sentiment_snapshots",
    "lifecycle_stage_snapshots", "workflow_templates", "workflow_steps",
    "account_workflow_states", "workflow_executions", "auto_campaigns",
    "campaign_enrollments", "email_campaigns", "voice_calls", "whatsapp_messages",
    "activity_logs", "app_settings", "integration_credentials", "webhook_events",
    "transactions",
]

API_PREFIXES = [
    "/accounts", "/lifecycle", "/pipeline", "/analytics", "/opportunities",
    "/campaigns", "/email", "/voice", "/whatsapp", "/ml", "/predictions",
    "/settings", "/workflows", "/voicebot", "/webhooks", "/auth",
]

SERVICE_PACKAGES = [
    "account", "scoring", "classification", "lifecycle", "workflow",
    "campaign", "email", "voice", "whatsapp", "analytics", "integration", "settings",
]

AGENT_MODULES = [
    "scoring_graph", "voice_graph", "email_intent_graph", "nba_graph", "workflow_executor_graph",
]

CELERY_JOBS = [
    "scoring_daily", "scoring_incremental", "lifecycle_reclassify",
    "workflow_step_evaluator", "workflow_enrollment_sync", "campaign_evaluator",
    "email_inbound_poll", "voice_retry_sweep", "analytics_rollup",
    "integration_sf_sync", "mongo_ttl_cleanup", "redis_cache_warm",
]

FORMULA_FUNCTIONS = [
    "compute_utilization", "compute_relationship_score", "compute_health_score",
    "compute_churn_probability", "compute_risk_score", "compute_upsell_score",
    "resolve_upsell_gates", "recency_points",
]

LLM_TASK_KEYS = [
    "sentiment", "email_intent", "email_personalization",
    "voice_classify", "voice_respond", "voice_summary",
    "whatsapp_message", "workflow_content", "nba_recommendation",
]


def score_schema() -> tuple[float, list[str]]:
    entities = (ROOT / "app" / "models" / "entities.py").read_text(encoding="utf-8")
    missing = [t for t in DDL_TABLES if f'__tablename__ = "{t}"' not in entities]
    pct = (len(DDL_TABLES) - len(missing)) / len(DDL_TABLES) * 100
    return pct, [f"missing table model: {m}" for m in missing]


def score_api() -> tuple[float, list[str]]:
    api_py = (ROOT / "app" / "api" / "v1" / "api.py").read_text(encoding="utf-8")
    endpoints_dir = ROOT / "app" / "api" / "v1" / "endpoints"
    combined = api_py + "".join(f.read_text(encoding="utf-8") for f in endpoints_dir.glob("*.py"))
    missing = []
    for prefix in API_PREFIXES:
        key = prefix.strip("/").split("/")[0]
        if key not in combined and f'prefix="{prefix}"' not in combined and f"prefix='{prefix}'" not in combined:
            missing.append(prefix)
    pct = (len(API_PREFIXES) - len(missing)) / len(API_PREFIXES) * 100
    return pct, [f"missing API prefix: {m}" for m in missing]


def score_formulas() -> tuple[float, list[str]]:
    formulas = (ROOT / "app" / "services" / "scoring" / "formulas.py").read_text(encoding="utf-8")
    config = (ROOT / "app" / "services" / "scoring" / "config.py").read_text(encoding="utf-8")
    missing = [fn for fn in FORMULA_FUNCTIONS if f"def {fn}" not in formulas]
    if "class ScoringConfig" not in config:
        missing.append("ScoringConfig")
    pct = (len(FORMULA_FUNCTIONS) + 1 - len(missing)) / (len(FORMULA_FUNCTIONS) + 1) * 100
    return pct, [f"missing formula/config: {m}" for m in missing]


def score_lifecycle() -> tuple[float, list[str]]:
    engine = (ROOT / "app" / "services" / "classification" / "engine.py").read_text(encoding="utf-8")
    checks = ["classify_lifecycle_bucket", "compute_quarter", "protect", "renew", "expand", "adopt"]
    missing = [c for c in checks if c not in engine]
    pct = (len(checks) - len(missing)) / len(checks) * 100
    return pct, missing


def score_agents() -> tuple[float, list[str]]:
    agents_dir = ROOT / "app" / "agents"
    missing = [m for m in AGENT_MODULES if not (agents_dir / f"{m}.py").exists()]
    pct = (len(AGENT_MODULES) - len(missing)) / len(AGENT_MODULES) * 100
    return pct, [f"missing agent: {m}" for m in missing]


def score_celery() -> tuple[float, list[str]]:
    celery = (ROOT / "app" / "workers" / "celery_app.py").read_text(encoding="utf-8")
    tasks = (ROOT / "app" / "workers" / "tasks.py").read_text(encoding="utf-8")
    combined = celery + tasks
    missing = [j for j in CELERY_JOBS if j not in combined]
    pct = (len(CELERY_JOBS) - len(missing)) / len(CELERY_JOBS) * 100
    return pct, [f"missing celery job: {m}" for m in missing]


def score_services() -> tuple[float, list[str]]:
    services = ROOT / "app" / "services"
    missing = [s for s in SERVICE_PACKAGES if not (services / s).is_dir()]
    pct = (len(SERVICE_PACKAGES) - len(missing)) / len(SERVICE_PACKAGES) * 100
    return pct, [f"missing service package: {m}" for m in missing]


def score_infra() -> tuple[float, list[str]]:
    gaps = []
    checks = {
        "docker-compose.yml": ROOT / "docker-compose.yml",
        "Dockerfile": ROOT / "Dockerfile",
        "health endpoint": ROOT / "app" / "api" / "v1" / "endpoints" / "health.py",
        "redis client": ROOT / "app" / "db" / "redis_client.py",
        "mongo client": ROOT / "app" / "db" / "mongo.py",
    }
    for name, path in checks.items():
        if not path.exists():
            gaps.append(name)
    pct = (len(checks) - len(gaps)) / len(checks) * 100
    return pct, gaps


def score_llm_layer() -> tuple[float, list[str]]:
    """Behavioral checks for langchain-litellm + JSON routing."""
    gaps: list[str] = []
    checks_passed = 0
    total = 11

    router_path = ROOT / "app" / "services" / "llm" / "router.py"
    config_path = ROOT / "app" / "services" / "llm" / "config.py"
    settings_path = ROOT / "app" / "api" / "v1" / "endpoints" / "settings.py"
    pyproject = (ROOT / "pyproject.toml").read_text(encoding="utf-8")
    llm_schema = TECH_PLAN / "schemas" / "llm_config.example.json"
    local_schema = ROOT / "schemas" / "llm_config.example.json"

    if "langchain-litellm" in pyproject:
        checks_passed += 1
    else:
        gaps.append("pyproject missing langchain-litellm")

    if router_path.exists():
        router = router_path.read_text(encoding="utf-8")
        if "ChatLiteLLM" in router:
            checks_passed += 1
        else:
            gaps.append("router missing ChatLiteLLM")
        if "load_llm_routing" in router or "get_resolved_task" in router:
            checks_passed += 1
        else:
            gaps.append("router not tenant-aware")
        if "apply_provider_env" in router:
            checks_passed += 1
        else:
            gaps.append("router missing apply_provider_env")
    else:
        gaps.append("missing router.py")

    if config_path.exists() and "class LLMRoutingConfig" in config_path.read_text(encoding="utf-8"):
        checks_passed += 1
    else:
        gaps.append("missing LLMRoutingConfig")

    if llm_schema.exists() or local_schema.exists():
        checks_passed += 1
    else:
        gaps.append("missing llm_config.example.json")

    settings_txt = settings_path.read_text(encoding="utf-8") if settings_path.exists() else ""
    if '/llm-config"' in settings_txt or "/llm-config" in settings_txt:
        checks_passed += 1
    else:
        gaps.append("missing GET/PATCH /settings/llm-config")

    sentiment = (ROOT / "app" / "services" / "scoring" / "sentiment.py").read_text(encoding="utf-8")
    if "sentiment_analyze" in sentiment:
        checks_passed += 1
    else:
        gaps.append("sentiment.py not wired to LLM")

    scoring_graph = (ROOT / "app" / "agents" / "scoring_graph.py").read_text(encoding="utf-8")
    if "sentiment_enrich" in scoring_graph and "sentiment_enrich_node" in scoring_graph:
        checks_passed += 1
    else:
        gaps.append("scoring_graph missing sentiment_enrich node")

    agent_files = {
        "voice_graph": 'task="voice_classify"',
        "email_intent_graph": 'task="email_intent"',
        "workflow_executor_graph": "workflow_content",
        "nba_graph": "nba_recommendation",
    }
    wired = 0
    for agent, needle in agent_files.items():
        path = ROOT / "app" / "agents" / f"{agent}.py"
        if path.exists() and needle in path.read_text(encoding="utf-8"):
            wired += 1
    if wired >= 3:
        checks_passed += 1
    else:
        gaps.append(f"agents LLM wiring incomplete ({wired}/4)")

    config_txt = config_path.read_text(encoding="utf-8") if config_path.exists() else ""
    if all(k in config_txt for k in ("sentiment", "voice_classify", "email_intent")):
        checks_passed += 1
    else:
        gaps.append("LLM task registry incomplete")

    pct = checks_passed / total * 100
    return pct, gaps


def main() -> int:
    weights = {
        "schema": (0.12, score_schema),
        "api_routes": (0.15, score_api),
        "scoring_formulas": (0.12, score_formulas),
        "lifecycle_buckets": (0.08, score_lifecycle),
        "langgraph_agents": (0.08, score_agents),
        "celery_jobs": (0.08, score_celery),
        "services": (0.08, score_services),
        "infra": (0.08, score_infra),
        "llm_layer": (0.21, score_llm_layer),
    }

    report: dict = {"categories": {}, "gaps": [], "overall_score": 0.0}
    total = 0.0
    for name, (weight, fn) in weights.items():
        pct, gaps = fn()
        report["categories"][name] = {"score": round(pct, 1), "weight": weight}
        report["gaps"].extend(gaps)
        total += pct * weight

    report["overall_score"] = round(total, 1)
    out_path = ROOT / "alignment_report.json"
    out_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Tech Plan Alignment Score: {report['overall_score']}%")
    for name, data in report["categories"].items():
        print(f"  {name}: {data['score']}% (weight {data['weight']})")
    if report["gaps"]:
        print("Gaps:")
        for g in report["gaps"][:25]:
            print(f"  - {g}")
    print(f"Report written to {out_path}")
    return 0 if report["overall_score"] >= 95 else 1


if __name__ == "__main__":
    sys.exit(main())
