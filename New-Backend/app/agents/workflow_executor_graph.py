"""LangGraph workflow executor for quarterly pipelines."""
from __future__ import annotations

from typing import TypedDict
from uuid import UUID

from langgraph.graph import END, StateGraph

from app.services.llm.router import ainvoke


class WorkflowExecutorState(TypedDict, total=False):
    account_id: str
    tenant_id: str
    template_id: str
    step_id: str
    action_type: str
    topic: str
    within_send_window: bool
    channel_ref: str
    generated_content: str
    status: str


def build_workflow_executor_graph():
    g = StateGraph(WorkflowExecutorState)

    def load_state(state: WorkflowExecutorState) -> WorkflowExecutorState:
        return state

    def check_send_window(state: WorkflowExecutorState) -> WorkflowExecutorState:
        state["within_send_window"] = state.get("within_send_window", True)
        return state

    async def generate_content(state: WorkflowExecutorState) -> WorkflowExecutorState:
        action = (state.get("action_type") or "").lower()
        topic = state.get("topic", "")
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        task = "email_personalization" if action == "email" else "workflow_content"
        state["generated_content"] = await ainvoke(
            [
                {
                    "role": "user",
                    "content": (
                        f"Generate outreach content for action '{action}'. "
                        f"Topic/purpose: {topic}. Keep it professional and concise."
                    ),
                }
            ],
            task=task,
            tenant_id=tenant_id,
        )
        return state

    def dispatch_channel(state: WorkflowExecutorState) -> WorkflowExecutorState:
        state["status"] = "sent"
        return state

    def advance_or_retry(state: WorkflowExecutorState) -> WorkflowExecutorState:
        return state

    def persist(state: WorkflowExecutorState) -> WorkflowExecutorState:
        return state

    for name, fn in [
        ("load_state", load_state),
        ("check_send_window", check_send_window),
        ("generate_content", generate_content),
        ("dispatch_channel", dispatch_channel),
        ("advance_or_retry", advance_or_retry),
        ("persist", persist),
    ]:
        g.add_node(name, fn)

    g.set_entry_point("load_state")
    g.add_edge("load_state", "check_send_window")
    g.add_edge("check_send_window", "generate_content")
    g.add_edge("generate_content", "dispatch_channel")
    g.add_edge("dispatch_channel", "advance_or_retry")
    g.add_edge("advance_or_retry", "persist")
    g.add_edge("persist", END)
    return g.compile()
