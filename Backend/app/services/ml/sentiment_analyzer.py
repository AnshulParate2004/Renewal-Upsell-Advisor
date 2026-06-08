"""
Sentiment Analysis Service — powered by Azure OpenAI (GPT-4o) via LangChain.

Replaces the old joblib / keyword-based approach.
Public interface is unchanged: SentimentAnalyzer().predict(text) -> Dict
"""
import json
import os
import re
from typing import Any, Dict, List, Union

from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_openai import AzureChatOpenAI

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# ── System prompt ─────────────────────────────────────────────────────────────
_SYSTEM_PROMPT = """\
You are an expert sentiment analyser for B2B customer-success interactions.
Analyse ONLY the customer's words and return a JSON object.

Rules:
- sentiment_score  : float from -1.0 (very negative) to 1.0 (very positive)
- label            : MUST be one of: very_negative | negative | neutral | positive | very_positive
- confidence       : float 0.0–1.0 reflecting how certain you are
- keywords         : list of 3-5 short phrases that reveal the customer's attitude

Examples of negative signals: "don't like", "no money", "not interested", "cancel", "too expensive"
Examples of positive signals:  "sounds good", "interested", "yes", "happy", "let's renew"

Return ONLY valid JSON — no markdown, no explanation:
{{"sentiment_score": -0.8, "label": "very_negative", "confidence": 0.9, "keywords": ["not interested", "cancel"]}}\
"""

_HUMAN_PROMPT = "Customer text:\n\n{text}\n\nReturn JSON sentiment analysis:"


def _build_llm() -> AzureChatOpenAI | None:
    """Create an AzureChatOpenAI instance; returns None if credentials are missing."""
    api_key = os.getenv("AZURE_OPENAI_API_KEY") or settings.AZURE_OPENAI_API_KEY
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT") or settings.AZURE_OPENAI_ENDPOINT
    api_version = os.getenv("OPENAI_API_VERSION") or settings.OPENAI_API_VERSION
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT") or settings.AZURE_OPENAI_DEPLOYMENT

    if not all([api_key, endpoint, deployment]):
        logger.warning("[SENTIMENT] Azure OpenAI credentials missing — LLM unavailable.")
        return None

    try:
        return AzureChatOpenAI(
            azure_endpoint=endpoint,
            api_key=api_key,
            api_version=api_version,
            azure_deployment=deployment,
            temperature=0.0,   # deterministic for analysis
            max_tokens=200,
        )
    except Exception as exc:
        logger.error(f"[SENTIMENT] Failed to initialise AzureChatOpenAI: {exc}")
        return None


class SentimentAnalyzer:
    """
    LLM-based sentiment analysis service (Azure OpenAI / GPT-4o).

    Public interface
    ----------------
    predict(text: str | list[str]) -> Dict  |  list[Dict]
        Each result dict contains:
            sentiment_score : float  -1.0 … 1.0
            label           : str    very_negative | negative | neutral | positive | very_positive
            confidence      : float  0.0 … 1.0
            keywords        : list[str]
    """

    def __init__(self) -> None:
        self._prompt = ChatPromptTemplate.from_messages(
            [
                SystemMessagePromptTemplate.from_template(_SYSTEM_PROMPT),
                HumanMessagePromptTemplate.from_template(_HUMAN_PROMPT),
            ]
        )

    # ── Public API ────────────────────────────────────────────────────────────

    def predict(self, text: Union[str, List[str]]) -> Union[Dict[str, Any], List[Dict[str, Any]]]:
        """Analyse sentiment of one string or a list of strings."""
        if isinstance(text, list):
            return [self._process_single(t) for t in text]
        return self._process_single(str(text))

    # ── Internal ──────────────────────────────────────────────────────────────

    def _process_single(self, text: str) -> Dict[str, Any]:
        text = text.strip()
        if len(text) < 5:
            return self._neutral()

        llm = _build_llm()
        if llm is None:
            logger.warning("[SENTIMENT] LLM not available — using keyword fallback.")
            return self._keyword_fallback(text)

        try:
            chain = self._prompt | llm | StrOutputParser()
            raw = chain.invoke({"text": text})
            logger.debug(f"[SENTIMENT] LLM raw response: {raw}")
            return self._parse_llm_response(raw)
        except Exception as exc:
            logger.error(f"[SENTIMENT] LLM call failed: {exc} — using fallback.")
            return self._keyword_fallback(text)

    def _parse_llm_response(self, raw: str) -> Dict[str, Any]:
        """Parse the JSON the LLM returns."""
        # Strip markdown code fences if present
        clean = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        json_match = re.search(r"\{.*\}", clean, re.DOTALL)
        if not json_match:
            logger.warning("[SENTIMENT] No JSON found in LLM response — using fallback.")
            return self._keyword_fallback(raw)

        try:
            data = json.loads(json_match.group())
        except json.JSONDecodeError:
            logger.warning("[SENTIMENT] JSON decode error — using fallback.")
            return self._keyword_fallback(raw)

        score = max(-1.0, min(1.0, float(data.get("sentiment_score", 0.0))))
        label = self._coerce_label(str(data.get("label", "neutral")), score)
        confidence = max(0.0, min(1.0, float(data.get("confidence", abs(score)))))
        keywords = data.get("keywords", [])
        if not isinstance(keywords, list):
            keywords = []

        return {
            "sentiment_score": score,
            "label": label,
            "confidence": confidence,
            "keywords": keywords[:5],
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _coerce_label(label: str, score: float) -> str:
        valid = {"very_negative", "negative", "neutral", "positive", "very_positive"}
        label = label.lower().replace(" ", "_")
        if label in valid:
            return label
        # Derive from score if label is unrecognised
        if score <= -0.6:
            return "very_negative"
        if score <= -0.2:
            return "negative"
        if score <= 0.2:
            return "neutral"
        if score <= 0.6:
            return "positive"
        return "very_positive"

    @staticmethod
    def _neutral() -> Dict[str, Any]:
        return {"sentiment_score": 0.0, "label": "neutral", "confidence": 0.5, "keywords": []}

    def _keyword_fallback(self, text: str) -> Dict[str, Any]:
        """Minimal keyword-based fallback when the LLM is unavailable."""
        text_lower = text.lower()
        pos = {"good", "great", "excellent", "happy", "yes", "renew", "satisfied", "interested", "positive"}
        neg = {"bad", "poor", "unhappy", "angry", "cancel", "no", "expensive", "churn", "negative", "not interested"}

        score = 0.0
        for word in text_lower.split():
            for p in pos:
                if p in word:
                    score += 0.3
            for n in neg:
                if n in word:
                    score -= 0.3

        score = max(-1.0, min(1.0, score))
        label = self._coerce_label("", score)
        return {"sentiment_score": score, "label": label, "confidence": 0.4, "keywords": []}
