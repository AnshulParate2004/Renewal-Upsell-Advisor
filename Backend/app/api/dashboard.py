from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.connection import get_db, Account
from typing import List

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Filter: days_to_renewal <= 90
    base_query = db.query(Account).filter(Account.days_to_renewal <= 90)
    
    renewing_count = base_query.count()
    
    # Total ARR at risk: Sum of ARR where churn_risk_label = 1
    total_arr_at_risk = base_query.filter(Account.churn_risk_label == 1).with_entities(func.sum(Account.arr)).scalar() or 0.0
    
    # Upsell Pipeline: We'll define this as Sum of ARR where upsell_opportunity_label = 1
    # (Assuming upsell potential is proportional to current ARR or just using ARR as a proxy for "pipeline value involved")
    upsell_pipeline = base_query.filter(Account.upsell_opportunity_label == 1).with_entities(func.sum(Account.arr)).scalar() or 0.0

    return {
        "renewing_count": renewing_count,
        "total_arr_at_risk": total_arr_at_risk,
        "upsell_pipeline": upsell_pipeline
    }

@router.get("/heatmap")
def get_dashboard_heatmap(db: Session = Depends(get_db)):
    # Top 20 High Risk accounts within 90 days renewal window, sorted by ARR desc
    results = db.query(Account)\
        .filter(Account.days_to_renewal <= 90)\
        .filter(Account.churn_risk_label == 1)\
        .order_by(Account.arr.desc())\
        .limit(20)\
        .all()
    
    return results
