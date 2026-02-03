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
    # Top 20 accounts within 90 days renewal window, sorted by ARR desc
    # Removed risk filter to show full picture
    results = db.query(Account)\
        .filter(Account.days_to_renewal <= 90)\
        .order_by(Account.arr.desc())\
        .limit(20)\
        .all()
    
    return results

@router.get("/clients")
def get_all_clients(db: Session = Depends(get_db)):
    # Return all clients, limit 100 for now, sorted by ARR
    results = db.query(Account)\
        .order_by(Account.arr.desc())\
        .limit(100)\
        .all()
    return results

@router.get("/history")
def get_dashboard_history(time_range: str = "12m", db: Session = Depends(get_db)):
    """
    Returns historical data for the dashboard graph from the DB.
    Auto-seeds if empty.
    time_range: '3m', '6m', '12m', '5y', 'all'
    """
    from app.db.connection import MonthlyStats, engine, Base
    from datetime import date, timedelta
    from dateutil.relativedelta import relativedelta
    import random

    # Ensure table exists (Quick fix for demo)
    Base.metadata.create_all(bind=engine)

    # 1. Seed Check
    if db.query(MonthlyStats).count() == 0:
        # Seed 5 years of data
        today = date.today()
        # Start from 5 years ago
        start_date = today - relativedelta(years=5)
        
        objects = []
        current = start_date.replace(day=1)
        while current <= today.replace(day=1):
            stats = MonthlyStats(
                month_date=current,
                renewals_count=random.randint(5, 35),
                churned_count=random.randint(0, 5),
                upsell_revenue=random.randint(5000, 55000) * 1.0
            )
            objects.append(stats)
            current += relativedelta(months=1)
        
        db.add_all(objects)
        db.commit()

    # 2. Filter Logic
    query = db.query(MonthlyStats).order_by(MonthlyStats.month_date.asc())
    
    today = date.today()
    if time_range == "3m":
        cutoff = today - relativedelta(months=3)
        query = query.filter(MonthlyStats.month_date >= cutoff)
    elif time_range == "6m":
        cutoff = today - relativedelta(months=6)
        query = query.filter(MonthlyStats.month_date >= cutoff)
    elif time_range == "12m":
        cutoff = today - relativedelta(months=12)
        query = query.filter(MonthlyStats.month_date >= cutoff)
    elif time_range == "5y":
        cutoff = today - relativedelta(years=5)
        query = query.filter(MonthlyStats.month_date >= cutoff)
    # 'all' returns everything

    results = query.all()
    
    # 3. Format for Frontend
    formatted_data = []
    for row in results:
        formatted_data.append({
            "month": row.month_date.strftime("%b %Y"), # e.g. "Feb 2024"
            "renewals": row.renewals_count,
            "churned": row.churned_count,
            "upsell_revenue": row.upsell_revenue
        })
        
    return formatted_data
