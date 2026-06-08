"""
Sentiment analysis for voice call transcripts using LangChain + Azure OpenAI.
Debug logging is enabled so you can see exactly what the LLM receives and returns.
"""
from typing import Dict, Any, Optional
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
import json
import re
from app.core.config import settings
from app.core.logging import get_logger
import os

logger = get_logger(__name__)


def get_langchain_llm():
    """Initialize LangChain Azure OpenAI LLM for sentiment analysis."""
    try:
        api_key      = os.getenv("AZURE_OPENAI_API_KEY")      or settings.AZURE_OPENAI_API_KEY
        azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")   or settings.AZURE_OPENAI_ENDPOINT
        api_version  = os.getenv("OPENAI_API_VERSION")        or settings.OPENAI_API_VERSION
        deployment   = os.getenv("AZURE_OPENAI_DEPLOYMENT")   or settings.AZURE_OPENAI_DEPLOYMENT

        logger.info("=== [SENTIMENT] LLM INIT ===")
        logger.info(f"[SENTIMENT] api_key      : {'SET (' + api_key[:8] + '...)' if api_key else 'MISSING '}")
        logger.info(f"[SENTIMENT] azure_endpoint: {azure_endpoint or 'MISSING '}")
        logger.info(f"[SENTIMENT] api_version  : {api_version or 'MISSING '}")
        logger.info(f"[SENTIMENT] deployment   : {deployment or 'MISSING '}")


        if not all([api_key, azure_endpoint, deployment]):
            logger.error("[SENTIMENT]  One or more Azure OpenAI credentials are missing — cannot init LLM.")
            return None

        llm = AzureChatOpenAI(
            azure_endpoint=azure_endpoint,
            api_key=api_key,
            api_version=api_version,
            azure_deployment=deployment,
            temperature=0.1,
            max_tokens=300,
        )

        logger.info("[SENTIMENT]  LangChain AzureChatOpenAI initialised successfully.")
        return llm

    except Exception as e:
        logger.error(f"[SENTIMENT]  Failed to initialise LangChain LLM: {e}", exc_info=True)
        return None


class SentimentAnalyzer:
    """Analyses sentiment from call transcripts using Azure OpenAI via LangChain."""

    def analyze_sentiment(self, transcript: str) -> Dict[str, Any]:
        """
        Analyse sentiment from a call transcript.

        Returns dict with:
            sentiment_score    : float  -1.0 (very negative) → 1.0 (very positive)
            sentiment_category : str    very_negative | negative | neutral | positive | very_positive
            keywords           : list   up to 5 key phrases
        """
        logger.info("=== [SENTIMENT] analyze_sentiment() CALLED ===")

        if not transcript or len(transcript.strip()) < 10:
            logger.warning("[SENTIMENT]  Transcript too short — returning neutral default.")
            return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}

        # Only send user-turn lines so the LLM focuses on the customer's words
        user_lines = "\n".join(
            line.replace("User:", "").strip()
            for line in transcript.split("\n")
            if line.strip().lower().startswith("user:")
        )
        if not user_lines.strip():
            logger.warning("[SENTIMENT] No 'User:' lines found — using full transcript.")
            user_lines = transcript

        logger.info(f"[SENTIMENT]  User lines extracted ({len(user_lines)} chars):")
        logger.info(f"[SENTIMENT]    {user_lines[:400]}")

        # ── LLM call ──────────────────────────────────────────────────────
        try:
            llm = get_langchain_llm()
            if not llm:
                logger.error("[SENTIMENT]  LLM not available — returning neutral fallback.")
                return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}

            system_template = """You are an expert sentiment analyser for B2B sales calls.
Analyse ONLY the customer's words and return a JSON object.

Rules:
- sentiment_score : float from -1.0 (very negative) to 1.0 (very positive)
- sentiment_category : MUST be one of: very_negative, negative, neutral, positive, very_positive
- keywords : list of 3-5 short phrases that reveal the customer's attitude

Examples of negative signals: "don't like", "no money", "not interested", "cancel", "too expensive"
Examples of positive signals: "sounds good", "interested", "yes", "happy", "let's renew"

Return ONLY valid JSON — no markdown, no explanation:
{{"sentiment_score": -0.8, "sentiment_category": "very_negative", "keywords": ["no money", "not interested", "cancel"]}}"""

            human_template = "Customer's words from the call:\n\n{user_lines}\n\nReturn JSON sentiment analysis:"

            prompt = ChatPromptTemplate.from_messages([
                SystemMessagePromptTemplate.from_template(system_template),
                HumanMessagePromptTemplate.from_template(human_template),
            ])

            chain = prompt | llm | StrOutputParser()

            logger.info("[SENTIMENT]  Sending request to Azure OpenAI LLM...")
            raw_response = chain.invoke({"user_lines": user_lines})
            logger.info(f"[SENTIMENT]  LLM raw response received:")
            logger.info(f"[SENTIMENT]    {raw_response}")

            # ── Parse JSON ────────────────────────────────────────────────
            # Strip markdown fences if model wraps in ```json ... ```
            clean = re.sub(r"^```(?:json)?|```$", "", raw_response.strip(), flags=re.MULTILINE).strip()
            logger.info(f"[SENTIMENT]  Cleaned response for JSON parse: {clean}")

            json_match = re.search(r"\{.*\}", clean, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group())
                    logger.info(f"[SENTIMENT]  JSON parsed successfully: {result}")
                except json.JSONDecodeError as je:
                    logger.error(f"[SENTIMENT]  JSON parse failed: {je} — trying fallback parser")
                    result = self._parse_sentiment_fallback(clean)
            else:
                logger.error(f"[SENTIMENT]  No JSON object found in response — trying fallback parser")
                result = self._parse_sentiment_fallback(clean)

            # ── Validate score ────────────────────────────────────────────
            sentiment_score = float(result.get("sentiment_score", 0.0))
            sentiment_score = max(-1.0, min(1.0, sentiment_score))

            # ── Validate category ─────────────────────────────────────────
            category = str(result.get("sentiment_category", "neutral")).lower()
            valid_categories = {"very_negative", "negative", "neutral", "positive", "very_positive"}
            if category not in valid_categories:
                logger.warning(f"[SENTIMENT] ⚠️  Invalid category '{category}' — mapping from score {sentiment_score}")
                if sentiment_score <= -0.6:   category = "very_negative"
                elif sentiment_score <= -0.2: category = "negative"
                elif sentiment_score <= 0.2:  category = "neutral"
                elif sentiment_score <= 0.6:  category = "positive"
                else:                         category = "very_positive"

            keywords = result.get("keywords", [])
            if not isinstance(keywords, list):
                keywords = []
            keywords = keywords[:5]

            logger.info(
                f"[SENTIMENT] 🎯 FINAL RESULT → score={sentiment_score}, "
                f"category={category}, keywords={keywords}"
            )

            return {
                "sentiment_score": sentiment_score,
                "sentiment_category": category,
                "keywords": keywords,
            }

        except Exception as e:
            logger.error(f"[SENTIMENT] ❌ Exception during sentiment analysis: {e}", exc_info=True)
            logger.error(f"[SENTIMENT] ❌ Returning neutral fallback due to error.")
            return {"sentiment_score": 0.0, "sentiment_category": "neutral", "keywords": []}

    # ── Fallback regex parser ──────────────────────────────────────────────
    def _parse_sentiment_fallback(self, text: str) -> Dict[str, Any]:
        """Last-resort regex parser if JSON parsing fails."""
        logger.warning("[SENTIMENT] ⚠️  Using regex fallback parser.")

        score_match    = re.search(r'sentiment[_\s]*score["\']?\s*[:=]\s*([-]?\d+\.?\d*)', text, re.IGNORECASE)
        category_match = re.search(r'sentiment[_\s]*category["\']?\s*[:=]\s*["\']?(\w+)', text, re.IGNORECASE)
        keywords_match = re.search(r'keywords["\']?\s*[:=]\s*\[(.*?)\]', text, re.IGNORECASE | re.DOTALL)

        score    = float(score_match.group(1)) if score_match else 0.0
        category = category_match.group(1)     if category_match else "neutral"
        keywords = []
        if keywords_match:
            keywords = [k.strip().strip("\"'") for k in keywords_match.group(1).split(",")]

        logger.warning(f"[SENTIMENT] fallback result → score={score}, category={category}, keywords={keywords}")
        return {
            "sentiment_score": max(-1.0, min(1.0, score)),
            "sentiment_category": category,
            "keywords": keywords[:5],
        }

    def update_account_sentiment(self, account_id: str, sentiment_data: Dict[str, Any], source: str = "voice_calls") -> bool:
        return True


# Global instance
sentiment_analyzer = SentimentAnalyzer()
