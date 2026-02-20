"""
Sentiment Analysis Service.
"""
from typing import Dict, Any, List
from app.services.ml.model_loader import model_loader
from app.core.exceptions import PredictionError, ModelLoadError
from app.core.logging import get_logger

logger = get_logger(__name__)


class SentimentAnalyzer:
    """Service for analyzing sentiment from text."""
    
    def __init__(self):
        self.pipeline = None
        self.config = None
        self._load_model()
    
    def _load_model(self):
        """Load sentiment analysis pipeline."""
        try:
            self.pipeline, self.config = model_loader.load_model("sentiment")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            raise ModelLoadError("sentiment", str(e))
    
    def predict(self, text: str | List[str]) -> Dict[str, Any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Single text string or list of texts
            
        Returns:
            Dictionary with sentiment_score, label, and confidence
        """
        try:
            # Handle single string or list
            if isinstance(text, str):
                texts = [text]
            else:
                texts = text
            
            # Run prediction
            results = self.pipeline(texts)
            
            # Process results
            if isinstance(text, str):
                # Single result
                result = results[0] if isinstance(results, list) else results
                return self._format_result(result)
            else:
                # Multiple results
                return [self._format_result(r) for r in results]
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            raise PredictionError("sentiment", str(e))
    
    def _format_result(self, result: Any) -> Dict[str, Any]:
        """Format prediction result."""
        # Handle different result formats
        if isinstance(result, dict):
            score = result.get('score', 0.0)
            label = result.get('label', 'neutral')
        elif hasattr(result, 'score') and hasattr(result, 'label'):
            score = result.score
            label = result.label
        else:
            # Try to extract from pipeline output
            score = float(result) if isinstance(result, (int, float)) else 0.0
            label = "positive" if score > 0 else "negative" if score < 0 else "neutral"
        
        # Normalize score to -1 to 1 range if needed
        if score > 1:
            score = score / 100.0
        elif score < -1:
            score = score / 100.0
        
        # Determine sentiment label
        if score > 0.1:
            sentiment_label = "positive"
        elif score < -0.1:
            sentiment_label = "negative"
        else:
            sentiment_label = "neutral"
        
        return {
            "sentiment_score": float(score),
            "label": sentiment_label,
            "confidence": abs(float(score))
        }
