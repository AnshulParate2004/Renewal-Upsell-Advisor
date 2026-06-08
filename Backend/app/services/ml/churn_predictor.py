"""
Churn Prediction Calculation Service.
"""
from typing import Dict, Any
from app.core.logging import get_logger

logger = get_logger(__name__)


class ChurnPredictor:
    """Service for calculating customer churn risk based on fixed formulas."""
    
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate churn probability for given features.
        
        Formula:
        - Base: 1.0 - (Health Score / 100)
        - Urgency Penalty: +0.2 if renewal is within 30 days and health is low (<50)
        - Critical Override: If account status is at_risk, min 0.80
        """
        try:
            health_score = float(features.get("health_score", 50.0))
            days_until_renewal = float(features.get("days_until_renewal", 90.0))
            account_status = features.get("account_status", "")
            
            # Base probability is inverse of health
            churn_probability = 1.0 - (health_score / 100.0)
            
            # Add urgency penalty for near renewal with low health
            if days_until_renewal < 30 and health_score < 50:
                churn_probability += 0.2
                
            # Critical Override
            if account_status == "at_risk":
                churn_probability = max(churn_probability, 0.80)
            
            # Clamp to 0-1 range
            churn_probability = max(0.0, min(1.0, churn_probability))
            
            # Determine risk level
            if churn_probability >= 0.7:
                risk_level = "critical"
            elif churn_probability >= 0.4:
                risk_level = "high"
            else:
                risk_level = "low"
            
            return {
                "churn_probability": churn_probability,
                "risk_level": risk_level,
                "confidence": 1.0  # Formula is 100% deterministic
            }
        except Exception as e:
            logger.error(f"Churn calculation failed: {e}")
            return {
                "churn_probability": 0.5,
                "risk_level": "medium",
                "confidence": 0.5
            }
