"""
Relationship Score Prediction Service.
"""
from typing import Dict, Any
from app.core.logging import get_logger

logger = get_logger(__name__)


class RelationshipScorePredictor:
    """Service for calculating relationship score based on a fixed formula."""
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate relationship score for given features.
        
        Formula:
        - Recency (60%): Based on days since last contact
        - Sentiment (40%): Based on sentiment score
        """
        try:
            dsbc = float(features.get("days_since_last_contact", 30))
            ss = float(features.get("sentiment_score", 0.5))
            
            # 1. Recency Bonus (max 60)
            if dsbc <= 14:
                recency_score = 60
            elif dsbc <= 30:
                recency_score = 40
            elif dsbc <= 60:
                recency_score = 20
            else:
                recency_score = 0
            
            # 2. Sentiment Bonus (max 40)
            sentiment_score = ss * 40
            
            relationship_score = float(recency_score + sentiment_score)
            relationship_score = max(0.0, min(100.0, relationship_score))
            
            return {
                "relationship_score": relationship_score
            }
        except Exception as e:
            logger.error(f"Relationship score calculation failed: {e}")
            # Fallback
            return {"relationship_score": 50.0}
