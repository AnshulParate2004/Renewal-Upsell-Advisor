"""
Health Score Calculation Service.
"""
from typing import Dict, Any
from app.core.logging import get_logger

logger = get_logger(__name__)


class HealthScorePredictor:
    """Service for calculating customer health score based on a fixed formula."""
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate health score for given features.
        
        Formula:
        - Utilization (40%): utilization_percentage (0-100)
        - Sentiment (30%): sentiment_score * 100
        - Recency (30%): Based on days since last contact
        """
        try:
            # Handle both ratio (0-1) and percentage (0-100) for utilization
            util = float(features.get("utilization_percentage", features.get("calculated_utilization", 0.5)))
            util_points = util * 100 if util <= 1.0 else util
            
            # Sentiment points
            sentiment = float(features.get("sentiment_score", 0.5))
            sentiment_points = sentiment * 100
            
            # Recency points
            dsbc = float(features.get("days_since_last_contact", 30))
            if dsbc <= 30:
                recency_points = 100
            elif dsbc <= 60:
                recency_points = 70
            elif dsbc <= 90:
                recency_points = 40
            else:
                recency_points = 10
            
            # Health Score = 40% Util + 30% Sentiment + 30% Recency
            health_score = float((util_points * 0.4) + (sentiment_points * 0.3) + (recency_points * 0.3))
            
            # Clamp to 0-100 range
            health_score = max(0.0, min(100.0, health_score))
            
            # Determine status
            if health_score >= 70:
                status = "healthy"
            elif health_score >= 40:
                status = "at_risk"
            else:
                status = "critical"
            
            return {
                "health_score": health_score,
                "status": status
            }
        except Exception as e:
            logger.error(f"Health score calculation failed: {e}")
            return {
                "health_score": 50.0,
                "status": "at_risk"
            }
