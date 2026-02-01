from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.connection import get_db, Account
from app.services.llm_engine import generate_insight

router = APIRouter()

@router.get("/{account_id}")
def get_advisor_insight(account_id: str, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.account_id == account_id).first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    if account.days_to_renewal > 90:
        return {"message": "Not in renewal window."}
        
    insight = generate_insight(account)
    return insight
