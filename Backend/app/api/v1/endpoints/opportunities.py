"""
Opportunity API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.schemas.opportunity import OpportunityCreate, OpportunityUpdate, OpportunityResponse
from app.models.opportunity import Opportunity
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/", response_model=List[OpportunityResponse])
async def get_opportunities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of opportunities."""
    opportunities = db.query(Opportunity).offset(skip).limit(limit).all()
    return opportunities


@router.get("/{opportunity_id}", response_model=OpportunityResponse)
async def get_opportunity(opportunity_id: str, db: Session = Depends(get_db)):
    """Get a specific opportunity by ID."""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity


@router.post("/", response_model=OpportunityResponse)
async def create_opportunity(opportunity: OpportunityCreate, db: Session = Depends(get_db)):
    """Create a new opportunity."""
    db_opportunity = Opportunity(**opportunity.model_dump())
    db.add(db_opportunity)
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity


@router.put("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(opportunity_id: str, opportunity_update: OpportunityUpdate, db: Session = Depends(get_db)):
    """Update an opportunity."""
    db_opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not db_opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    update_data = opportunity_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_opportunity, field, value)
    
    db.commit()
    db.refresh(db_opportunity)
    return db_opportunity
