"""
Unified Prediction Orchestrator - Coordinates all ML predictions.
"""
from typing import Dict, Any, List, Optional
from app.services.ml.churn_predictor import ChurnPredictor
from app.services.ml.health_score import HealthScorePredictor
from app.services.ml.relationship_score import RelationshipScorePredictor
from app.services.ml.renewal_score import RenewalScorePredictor
from app.services.ml.sentiment_analyzer import SentimentAnalyzer
from app.services.ml.upsell_detector import UpsellDetector
from app.core.exceptions import PredictionError
from app.core.logging import get_logger

logger = get_logger(__name__)


class UnifiedPredictor:
    """Orchestrates predictions from all ML models."""
    
    def __init__(self):
        """Initialize prediction services (lazy loading)."""
        self._churn_predictor = None
        self._health_predictor = None
        self._relationship_predictor = None
        self._renewal_predictor = None
        self._sentiment_analyzer = None
        self._upsell_detector = None
    
    @property
    def churn_predictor(self):
        """Lazy load churn predictor."""
        if self._churn_predictor is None:
            self._churn_predictor = ChurnPredictor()
        return self._churn_predictor
    
    @property
    def health_predictor(self):
        """Lazy load health score predictor."""
        if self._health_predictor is None:
            self._health_predictor = HealthScorePredictor()
        return self._health_predictor
    
    @property
    def relationship_predictor(self):
        """Lazy load relationship score predictor."""
        if self._relationship_predictor is None:
            self._relationship_predictor = RelationshipScorePredictor()
        return self._relationship_predictor
    
    @property
    def renewal_predictor(self):
        """Lazy load renewal score predictor."""
        if self._renewal_predictor is None:
            self._renewal_predictor = RenewalScorePredictor()
        return self._renewal_predictor
    
    @property
    def sentiment_analyzer(self):
        """Lazy load sentiment analyzer."""
        if self._sentiment_analyzer is None:
            self._sentiment_analyzer = SentimentAnalyzer()
        return self._sentiment_analyzer
    
    @property
    def upsell_detector(self):
        """Lazy load upsell detector."""
        if self._upsell_detector is None:
            self._upsell_detector = UpsellDetector()
        return self._upsell_detector
    
    def predict_all(self, account_data: Dict[str, Any], text_data: Optional[str] = None) -> Dict[str, Any]:
        """
        Run all predictions for an account.
        
        Args:
            account_data: Account features for prediction
            text_data: Optional text for sentiment analysis
            
        Returns:
            Dictionary with all predictions
        """
        results = {}
        
        try:
            # Churn prediction
            results["churn"] = self.churn_predictor.predict(account_data)
        except Exception as e:
            logger.error(f"Churn prediction failed: {e}")
            results["churn"] = {"error": str(e)}
        
        try:
            # Health score prediction
            results["health_score"] = self.health_predictor.predict(account_data)
        except Exception as e:
            logger.error(f"Health score prediction failed: {e}")
            results["health_score"] = {"error": str(e)}
        
        try:
            # Relationship score prediction
            results["relationship_score"] = self.relationship_predictor.predict(account_data)
        except Exception as e:
            logger.error(f"Relationship score prediction failed: {e}")
            results["relationship_score"] = {"error": str(e)}
        
        try:
            # Renewal score prediction
            results["renewal_score"] = self.renewal_predictor.predict(account_data)
        except Exception as e:
            logger.error(f"Renewal score prediction failed: {e}")
            results["renewal_score"] = {"error": str(e)}
        
        try:
            # Upsell detection
            results["upsell"] = self.upsell_detector.predict(account_data)
        except Exception as e:
            logger.error(f"Upsell detection failed: {e}")
            results["upsell"] = {"error": str(e)}
        
        # Sentiment analysis (if text provided)
        if text_data:
            try:
                results["sentiment"] = self.sentiment_analyzer.predict(text_data)
            except Exception as e:
                logger.error(f"Sentiment analysis failed: {e}")
                results["sentiment"] = {"error": str(e)}
        
        return results
    
    def predict_specific(self, model_type: str, account_data: Dict[str, Any], text_data: Optional[str] = None) -> Dict[str, Any]:
        """
        Run prediction for a specific model type.
        
        Args:
            model_type: Type of model (churn, health_score, etc.)
            account_data: Account features
            text_data: Optional text for sentiment analysis
            
        Returns:
            Prediction result
        """
        model_type = model_type.lower()
        
        if model_type == "churn":
            return self.churn_predictor.predict(account_data)
        elif model_type == "health_score":
            return self.health_predictor.predict(account_data)
        elif model_type == "relationship_score":
            return self.relationship_predictor.predict(account_data)
        elif model_type == "renewal_score":
            return self.renewal_predictor.predict(account_data)
        elif model_type == "upsell":
            return self.upsell_detector.predict(account_data)
        elif model_type == "sentiment":
            if not text_data:
                raise ValueError("text_data is required for sentiment analysis")
            return self.sentiment_analyzer.predict(text_data)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
