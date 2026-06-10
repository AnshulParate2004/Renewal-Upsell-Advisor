"""LangGraph email intent branching."""
from __future__ import annotations

import json
from typing import TypedDict
from uuid import UUID

from langgraph.graph import END, StateGraph

from app.services.llm.router import ainvoke

INTENT_TASKS = {
    "renewed": "tasks.mark_renewed",
    "churned": "tasks.mark_churned",
    "objection": "tasks.schedule_followup",
    "needs_followup": "tasks.schedule_followup",
    "completed": "tasks.log_only",
}


class EmailIntentState(TypedDict, total=False):
    message_id: str
    account_id: str
    tenant_id: str
    body: str
    intent: str
    celery_task: str


def build_email_intent_graph():
    g = StateGraph(EmailIntentState)

    async def classify(state: EmailIntentState) -> EmailIntentState:
        body = state.get("body", "")
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        if body.strip():
            raw = await ainvoke(
                [
                    {
                        "role": "user",
                        "content": (
                            "Classify this customer email intent. Return JSON only with key "
                            '"intent" one of: renewed, churned, objection, needs_followup, completed.\n\n'
                            f"Email:\n{body[:8000]}"
                        ),
                    }
                ],
                task="email_intent",
                tenant_id=tenant_id,
                json_mode=True,
            )
            if "```" in raw:
                raw = raw.split("```")[1].replace("json", "").strip()
            try:
                parsed = json.loads(raw)
                state["intent"] = parsed.get("intent", "completed")
            except json.JSONDecodeError:
                state["intent"] = state.get("intent", "completed")
        else:
            state["intent"] = state.get("intent", "completed")
        state["celery_task"] = INTENT_TASKS.get(state["intent"], "tasks.log_only")
        return state

    def dispatch(state: EmailIntentState) -> EmailIntentState:
        return state

    g.add_node("classify", classify)
    g.add_node("dispatch", dispatch)
    g.set_entry_point("classify")
    g.add_edge("classify", "dispatch")
    g.add_edge("dispatch", END)
    return g.compile()
