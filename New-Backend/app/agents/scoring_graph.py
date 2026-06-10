"""LangGraph scoring pipeline — FormulaNode + LLM sentiment."""
from __future__ import annotations

from typing import Any, TypedDict
from uuid import UUID

from langgraph.graph import END, StateGraph

from app.services.scoring.formulas import run_formula_pipeline


class ScoringState(TypedDict, total=False):
    account_id: str
    tenant_id: str
    raw_features: dict[str, Any]
    sentiment_score: float
    sentiment_category: str
    util_pct: float
    relationship_score: int
    health_score: int
    churn_probability: float
    risk_score: int
    upsell_score: int
    lifecycle_stage: str
    errors: list[str]
    scoring_cfg: Any
    bucket_cfg: Any
    sentiment: dict[str, Any]


def build_scoring_graph():
    graph = StateGraph(ScoringState)

    async def sentiment_enrich_node(state: ScoringState) -> ScoringState:
        from app.services.scoring.sentiment import sentiment_enrich

        account_id = UUID(state["account_id"])
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        sentiment = await sentiment_enrich(account_id, tenant_id=tenant_id)
        state["sentiment"] = sentiment
        state["sentiment_score"] = sentiment.get("sentiment_score", 0.0)
        state["sentiment_category"] = sentiment.get("sentiment_category", "neutral")
        return state

    def compute_utilization(state: ScoringState) -> ScoringState:
        from app.services.scoring.formulas import compute_utilization

        state["util_pct"] = compute_utilization(state["raw_features"])
        return state

    def compute_relationship(state: ScoringState) -> ScoringState:
        from app.services.scoring.formulas import compute_relationship_score

        state["relationship_score"] = compute_relationship_score(
            state["raw_features"], state["sentiment"], state["scoring_cfg"]
        )
        return state

    def compute_health(state: ScoringState) -> ScoringState:
        from app.services.scoring.formulas import compute_health_score

        state["health_score"] = compute_health_score(
            state["raw_features"],
            state["util_pct"],
            state["sentiment"],
            state["relationship_score"],
            state["scoring_cfg"],
        )
        return state

    def compute_churn(state: ScoringState) -> ScoringState:
        from app.services.scoring.formulas import compute_churn_probability

        state["churn_probability"] = compute_churn_probability(
            state["raw_features"], state["health_score"], state["scoring_cfg"]
        )
        return state

    def compute_risk(state: ScoringState) -> ScoringState:
        from app.services.scoring.formulas import compute_risk_score

        state["risk_score"] = compute_risk_score(
            state["raw_features"], state["churn_probability"], state["scoring_cfg"], state["bucket_cfg"]
        )
        return state

    def compute_upsell(state: ScoringState) -> ScoringState:
        from app.services.scoring.formulas import compute_upsell_score

        state["upsell_score"] = compute_upsell_score(
            state["raw_features"],
            state["health_score"],
            state["util_pct"],
            state["risk_score"],
            state["scoring_cfg"],
            state["bucket_cfg"],
        )
        return state

    graph.add_node("sentiment_enrich", sentiment_enrich_node)
    graph.add_node("compute_utilization", compute_utilization)
    graph.add_node("compute_relationship", compute_relationship)
    graph.add_node("compute_health", compute_health)
    graph.add_node("compute_churn", compute_churn)
    graph.add_node("compute_risk", compute_risk)
    graph.add_node("compute_upsell", compute_upsell)

    graph.set_entry_point("sentiment_enrich")
    graph.add_edge("sentiment_enrich", "compute_utilization")
    graph.add_edge("compute_utilization", "compute_relationship")
    graph.add_edge("compute_relationship", "compute_health")
    graph.add_edge("compute_health", "compute_churn")
    graph.add_edge("compute_churn", "compute_risk")
    graph.add_edge("compute_risk", "compute_upsell")
    graph.add_edge("compute_upsell", END)

    return graph.compile()


async def run_scoring_graph(
    account_id: UUID,
    features: dict[str, Any],
    scoring_cfg,
    bucket_cfg,
    *,
    tenant_id: UUID | None = None,
    sentiment: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run scoring via LangGraph (includes LLM sentiment_enrich node)."""
    try:
        g = build_scoring_graph()
        initial: ScoringState = {
            "account_id": str(account_id),
            "tenant_id": str(tenant_id) if tenant_id else None,
            "raw_features": features,
            "scoring_cfg": scoring_cfg,
            "bucket_cfg": bucket_cfg,
            "sentiment": sentiment or {},
            "errors": [],
        }
        out = await g.ainvoke(initial)
        sent = out.get("sentiment") or sentiment or {}
        return {
            "util_pct": out.get("util_pct", 0),
            "relationship_score": out.get("relationship_score", 0),
            "health_score": out.get("health_score", 0),
            "churn_probability": out.get("churn_probability", 0),
            "risk_score": out.get("risk_score", 0),
            "upsell_score": out.get("upsell_score", 0),
            "sentiment_score": sent.get("sentiment_score", 0.0),
            "sentiment_category": sent.get("sentiment_category", "neutral"),
        }
    except Exception:
        if sentiment is None:
            from app.services.scoring.sentiment import sentiment_enrich

            sentiment = await sentiment_enrich(account_id, tenant_id=tenant_id)
        return run_formula_pipeline(features, sentiment, scoring_cfg, bucket_cfg)
