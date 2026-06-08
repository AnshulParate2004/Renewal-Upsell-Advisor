"""
Upsell Detection Service.
Identifies accounts with high expansion potential based on usage, health, and contract data via fixed rules.
"""
from typing import Dict, Any, List
from app.core.logging import get_logger

logger = get_logger(__name__)


class UpsellDetector:
    """Rule-based detector for account expansion opportunities."""
    
    def predict(self, account_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate upsell probability for a given account using heuristics.
        """
        try:
            health_score = float(account_data.get("health_score") or 0)
            utilization = float(account_data.get("calculated_utilization") or account_data.get("utilization_percentage") or 0)
            arr = float(account_data.get("arr") or 0)
            company_size = str(account_data.get("company_size") or "Medium").lower()
            
            # Probability base
            probability = 0.0
            
            if health_score > 80:
                probability += 0.4
            elif health_score > 60:
                probability += 0.2
                
            if utilization > 85:
                probability += 0.4
            elif utilization > 70:
                probability += 0.2
                
            # Adjusted by company size
            if "large" in company_size or "enterprise" in company_size:
                probability += 0.1
            
            # Clamp probability
            probability = min(0.95, probability)
            
            # Determination
            is_opportunity = probability >= 0.5
            
            reasoning = []
            if utilization > 80:
                reasoning.append(f"High license utilization ({utilization:.1f}%) indicates need for more seats.")
            if health_score > 80:
                reasoning.append(f"Strong account health ({health_score}/100) suggests openness to expansion.")
            if arr > 50000:
                reasoning.append("Large account size with significant existing investment.")
                
            if not reasoning:
                reasoning.append("Standard growth patterns observed for similar account profiles.")
                
            recommended_products = []
            if utilization > 85:
                recommended_products.append("Additional License Professional Pack")
            if health_score > 85:
                recommended_products.append("Premium Support Tier")
            
            if not recommended_products:
                recommended_products = ["Standard Expansion Pack", "Advanced Analytics Module"]
            
            return {
                "probability": float(probability),
                "is_opportunity": is_opportunity,
                "reasoning": ". ".join(reasoning),
                "recommended_products": recommended_products,
                "predicted_value": float(arr * 0.2) if is_opportunity else 0.0
            }
            
        except Exception as e:
            logger.error(f"Error in upsell calculation: {e}")
            return {
                "probability": 0.0,
                "is_opportunity": False,
                "reasoning": f"Error calculating potential: {str(e)}",
                "recommended_products": [],
                "predicted_value": 0.0
            }
