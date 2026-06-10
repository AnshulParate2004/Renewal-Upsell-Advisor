"""LangGraph voice agent state machine."""
from __future__ import annotations

from typing import TypedDict
from uuid import UUID

from langgraph.graph import END, StateGraph

from app.services.llm.router import ainvoke


class VoiceState(TypedDict, total=False):
    account_id: str
    tenant_id: str
    topic: str
    intent: str
    sentiment_score: float
    transcript: str
    response_text: str
    summary: str
    escalate: bool


def build_voice_graph():
    g = StateGraph(VoiceState)

    def greet(state: VoiceState) -> VoiceState:
        return state

    def listen(state: VoiceState) -> VoiceState:
        return state

    async def classify_intent(state: VoiceState) -> VoiceState:
        transcript = state.get("transcript", "")
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        if not transcript.strip():
            state["intent"] = state.get("intent", "general")
            return state
        raw = await ainvoke(
            [
                {
                    "role": "user",
                    "content": (
                        "Classify the caller intent. Reply with one label only: "
                        "general, negotiation, support, renewal, objection.\n\n"
                        f"Transcript:\n{transcript[:4000]}"
                    ),
                }
            ],
            task="voice_classify",
            tenant_id=tenant_id,
        )
        state["intent"] = raw.strip().lower().split()[0][:32]
        return state

    async def respond(state: VoiceState) -> VoiceState:
        topic = state.get("topic", "account review")
        transcript = state.get("transcript", "")
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        state["response_text"] = await ainvoke(
            [
                {
                    "role": "system",
                    "content": f"You are a helpful CSM on a voice call. Call purpose: {topic}.",
                },
                {
                    "role": "user",
                    "content": f"Customer said:\n{transcript[:4000]}\n\nReply concisely for TTS.",
                },
            ],
            task="voice_respond",
            tenant_id=tenant_id,
        )
        return state

    def escalate_or_close(state: VoiceState) -> VoiceState:
        if state.get("intent") == "negotiation" or (state.get("sentiment_score") or 0) < -0.3:
            state["escalate"] = True
        return state

    async def summarize(state: VoiceState) -> VoiceState:
        transcript = state.get("transcript", "")
        tenant_id = UUID(state["tenant_id"]) if state.get("tenant_id") else None
        state["summary"] = await ainvoke(
            [
                {
                    "role": "user",
                    "content": (
                        "Summarize this voice call in 2-3 sentences for the CRM.\n\n"
                        f"Transcript:\n{transcript[:6000]}"
                    ),
                }
            ],
            task="voice_summary",
            tenant_id=tenant_id,
        )
        return state

    def persist(state: VoiceState) -> VoiceState:
        return state

    for name, fn in [
        ("greet", greet),
        ("listen", listen),
        ("classify_intent", classify_intent),
        ("respond", respond),
        ("escalate_or_close", escalate_or_close),
        ("summarize", summarize),
        ("persist", persist),
    ]:
        g.add_node(name, fn)

    g.set_entry_point("greet")
    g.add_edge("greet", "listen")
    g.add_edge("listen", "classify_intent")
    g.add_edge("classify_intent", "respond")
    g.add_edge("respond", "escalate_or_close")
    g.add_edge("escalate_or_close", "summarize")
    g.add_edge("summarize", "persist")
    g.add_edge("persist", END)
    return g.compile()
