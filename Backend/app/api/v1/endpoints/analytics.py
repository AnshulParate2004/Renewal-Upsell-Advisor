"""
Analytics API endpoints using Supabase.
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
from pathlib import Path
from dotenv import load_dotenv
from app.core.config import settings
from app.core.logging import get_logger
from supabase import create_client, Client
import os

# Load .env file explicitly
env_path = Path(__file__).parent.parent.parent.parent / ".env"
if not env_path.exists():
    env_path = Path(".env")
if env_path.exists():
    load_dotenv(env_path, override=True)

logger = get_logger(__name__)
router = APIRouter()


def get_supabase_client() -> Optional[Client]:
    """Get or create Supabase client."""
    supabase_url = os.getenv("SUPABASE_URL") or settings.SUPABASE_URL
    supabase_key = (
        os.getenv("SUPABASE_SERVICE_ROLE_SECRET") or 
        os.getenv("SUPABASE_SERVICE_ROLE_KEY") or 
        os.getenv("SUPABASE_KEY") or
        os.getenv("SUPABASE_ANON_KEY") or
        settings.SUPABASE_KEY
    )
    
    if not supabase_url or not supabase_key:
        return None
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None


@router.get("/dashboard")
async def get_dashboard_stats():
    """Get dashboard analytics from Supabase."""
    client = get_supabase_client()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    try:
        # Get all accounts
        accounts_result = client.table("accounts").select("*").execute()
        accounts = accounts_result.data if accounts_result.data else []
        
        if not accounts:
            return {
                "total_accounts": 0,
                "churn_risk_count": 0,
                "avg_health_score": 0.0,
                "avg_relationship_score": 0.0,
                "avg_sentiment_score": 0.0,
                "total_arr": 0.0,
                "upsell_pipeline": 0.0
            }
        
        # Calculate metrics
        total_accounts = len(accounts)
        
        # Churn risk count (accounts with churn_probability >= 0.7 or risk_score >= 70)
        churn_risk_count = sum(
            1 for acc in accounts 
            if (acc.get("churn_probability") and float(acc.get("churn_probability", 0)) >= 0.7) or
               (acc.get("risk_score") and float(acc.get("risk_score", 0)) >= 70)
        )
        
        # Total ARR
        total_arr = sum(float(acc.get("arr", 0)) for acc in accounts)
        
        # Average health score
        health_scores = [float(acc.get("health_score", 0)) for acc in accounts if acc.get("health_score") is not None]
        avg_health_score = sum(health_scores) / len(health_scores) if health_scores else 0.0
        
        # Average relationship score
        relationship_scores = [float(acc.get("relationship_score", 0)) for acc in accounts if acc.get("relationship_score") is not None]
        avg_relationship_score = sum(relationship_scores) / len(relationship_scores) if relationship_scores else 0.0
        
        # Average sentiment score
        sentiment_scores = [float(acc.get("sentiment_score", 0)) for acc in accounts if acc.get("sentiment_score") is not None]
        avg_sentiment_score = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
        
        # Upsell pipeline - get from upsell_opportunities table
        try:
            opportunities_result = client.table("upsell_opportunities").select("predicted_value, status").execute()
            opportunities = opportunities_result.data if opportunities_result.data else []
            # Sum predicted_value for opportunities that are not lost/closed
            upsell_pipeline = sum(
                float(opp.get("predicted_value", 0)) 
                for opp in opportunities 
                if opp.get("status") not in ["lost", "closed"]
            )
        except Exception as e:
            logger.warning(f"Could not fetch upsell opportunities: {e}")
            upsell_pipeline = 0.0
        
        return {
            "total_accounts": total_accounts,
            "churn_risk_count": churn_risk_count,
            "avg_health_score": round(avg_health_score, 2),
            "avg_relationship_score": round(avg_relationship_score, 2),
            "avg_sentiment_score": round(avg_sentiment_score, 2),
            "total_arr": round(total_arr, 2),
            "upsell_pipeline": round(upsell_pipeline, 2)
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")
