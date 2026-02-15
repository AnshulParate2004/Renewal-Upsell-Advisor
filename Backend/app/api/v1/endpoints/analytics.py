"""
Analytics API endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.account import Account
from app.models.opportunity import Opportunity
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard analytics."""
    # Total accounts
    total_accounts = db.query(func.count(Account.id)).scalar()
    
    # Churn risk count (accounts with churn probability >= 0.7)
    churn_risk_count = db.query(func.count(Account.id)).filter(
        Account.churn_probability >= 0.7
    ).scalar() or 0
    
    # Average metrics
    avg_health = db.query(func.avg(Account.health_score)).scalar() or 0
    avg_relationship = db.query(func.avg(Account.relationship_score)).scalar() or 0
    avg_sentiment = db.query(func.avg(Account.sentiment_score)).scalar() or 0
    
    # Total ARR
    total_arr = db.query(func.sum(Account.arr)).scalar() or 0
    
    # Upsell pipeline value
    upsell_pipeline = db.query(func.sum(Opportunity.value)).filter(
        Opportunity.type.in_(["upsell", "cross_sell"])
    ).scalar() or 0
    
    return {
        "total_accounts": total_accounts,
        "churn_risk_count": churn_risk_count,
        "avg_health_score": float(avg_health),
        "avg_relationship_score": float(avg_relationship),
        "avg_sentiment_score": float(avg_sentiment),
        "total_arr": float(total_arr),
        "upsell_pipeline": float(upsell_pipeline)
    }
