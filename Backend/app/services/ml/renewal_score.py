"""
Renewal Score Calculation Service.
"""
from typing import Dict, Any
from app.core.logging import get_logger

logger = get_logger(__name__)


class RenewalScorePredictor:
    """Service for calculating renewal probability based on a fixed formula."""
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate renewal probability for given features.
        
        Formula:
        - Based primarily on Health Score (80%) and Relationship Score (20%)
        """
        try:
            health_score = float(features.get("health_score", 50.0))
            # Some callers might not pass relationship_score directly to this predictor
            relationship_score = float(features.get("relationship_score", 50.0))
            
            # Weighted probability
            renewal_probability = (health_score * 0.8 + relationship_score * 0.2) / 100.0
            
            # Clamp to 0-1 range
            renewal_probability = max(0.0, min(1.0, renewal_probability))
            
            # Determine renewal stage based on probability
            if renewal_probability >= 0.8:
                stage = "likely"
            elif renewal_probability >= 0.5:
                stage = "possible"
            else:
                stage = "unlikely"
            
            return {
                "renewal_probability": renewal_probability,
                "stage": stage
            }
        except Exception as e:
            logger.error(f"Renewal calculation failed: {e}")
            return {
                "renewal_probability": 0.5,
                "stage": "possible"
            }
