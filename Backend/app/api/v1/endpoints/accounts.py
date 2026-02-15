"""
Account API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.account import AccountCreate, AccountUpdate, AccountResponse
from app.models.account import Account
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[AccountResponse])
async def get_accounts(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    """Get list of accounts."""
    accounts = db.query(Account).offset(skip).limit(limit).all()
    logger.info(f"Returning {len(accounts)} accounts (skip={skip}, limit={limit})")
    return accounts


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: str, db: Session = Depends(get_db)):
    """Get a specific account by ID."""
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.post("/", response_model=AccountResponse)
async def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    """Create a new account."""
    db_account = Account(**account.model_dump())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(account_id: str, account_update: AccountUpdate, db: Session = Depends(get_db)):
    """Update an account."""
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = account_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)
    
    db.commit()
    db.refresh(db_account)
    return db_account


@router.delete("/{account_id}")
async def delete_account(account_id: str, db: Session = Depends(get_db)):
    """Delete an account."""
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    db.delete(db_account)
    db.commit()
    return {"message": "Account deleted successfully"}
