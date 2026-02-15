"""
Contract management API endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.get("/")
async def get_contracts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get list of contracts."""
    # TODO: Implement contract model and CRUD operations
    return {"message": "Contract endpoints - to be implemented"}


@router.get("/{contract_id}")
async def get_contract(contract_id: str, db: Session = Depends(get_db)):
    """Get a specific contract by ID."""
    # TODO: Implement
    return {"message": f"Contract {contract_id} - to be implemented"}
