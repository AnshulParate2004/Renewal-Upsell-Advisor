"""LangGraph NBA agent with human review gate."""
from __future__ import annotations

from typing import TypedDict
from uuid import UUID

from langgraph.graph import END, StateGraph

from app.services.llm.router import ainvoke


class NBAState(TypedDict, total=False):
    account_id: str
    tenant_id: str
    stage: str
    action: str
    human_review_gate: str
    auto_enqueue: bool
    recommendation: str


def build_nba_graph():
    g = StateGraph(NBAState)

    async def recommend(state: NBAState) -> NBAState:
        stage = state.get("stage", "")
        action = state.get("action", "")
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        state["recommendation"] = await ainvoke(
            [
                {
                    "role": "user",
                    "content": (
                        f"Suggest the next best action for a customer in lifecycle stage '{stage}' "
                        f"with current action context '{action}'. Reply in one short paragraph."
                    ),
                }
            ],
            task="nba_recommendation",
            tenant_id=tenant_id,
        )
        return state

    def gate(state: NBAState) -> NBAState:
        stage = (state.get("stage") or "").lower()
        action = (state.get("action") or "").lower()
        if stage == "protect" or "churn" in action:
            state["auto_enqueue"] = state.get("human_review_gate") == "approved"
        else:
            state["auto_enqueue"] = True
        return state

    g.add_node("recommend", recommend)
    g.add_node("human_review_gate", gate)
    g.set_entry_point("recommend")
    g.add_edge("recommend", "human_review_gate")
    g.add_edge("human_review_gate", END)
    return g.compile()
