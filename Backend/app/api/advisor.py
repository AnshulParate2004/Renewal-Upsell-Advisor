from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.connection import get_db, Account
from app.services.genai import GenAIService

router = APIRouter()
genai_service = GenAIService()

@router.get("/{account_id}")
async def get_advisor_insight(account_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.account_id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    # Convert SQLAlchemy model to dict
    account_data = {
        "account_id": account.account_id,
        "company_name": account.company_name,
        "arr": account.arr,
        "days_to_renewal": account.days_to_renewal,
        "health_score": account.health_score,
        "feature_usage_score": account.feature_usage_score,
        "last_contact_date": account.last_contact_date,
        "industry": account.industry,
        "churn_risk_label": account.churn_risk_label
    }

    # Generate insights
    # In a real app, you might cache this or store it in the DB.
    # For now, we generate on fly.
    churn_analysis = await genai_service.analyze_churn(account_data)
    upsell_analysis = await genai_service.analyze_upsell(account_data)
    
    # Extract risk factors from churn analysis for playbook generation
    risk_factors = churn_analysis.get("reasoning", ["General health check needed"])
    playbook = await genai_service.generate_playbook(risk_factors)

    # Mock interactions for sentiment analysis (since we don't have a interactions table yet)
    # In a real app, fetch this from a CRM or Communications table
    interactions = [
        {"date": account.last_contact_date, "type": "Email", "notes": "discussed renewal, client seemed hesitant"},
        {"date": "2023-12-01", "type": "Support Ticket", "notes": "feature request pending since Q3"}
    ]
    sentiment_analysis = await genai_service.analyze_sentiment(interactions)

    return {
        "account_id": account.account_id,
        "churn_analysis": churn_analysis,
        "upsell_analysis": upsell_analysis,
        "playbook": playbook,
        "sentiment_analysis": sentiment_analysis
    }
