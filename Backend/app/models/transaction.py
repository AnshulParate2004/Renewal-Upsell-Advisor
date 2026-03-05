"""
Transaction database model.
"""
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Transaction(Base):
    """Transaction model for storing financial payments/invoices."""
    __tablename__ = "transactions"
    
    id = Column(String, primary_key=True, index=True)
    account_id = Column(String, ForeignKey("accounts.id", ondelete="CASCADE"), index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    transaction_date = Column(DateTime, nullable=False)
    type = Column(String)  # payment, refund, invoice_issued
    status = Column(String)  # completed, pending, failed
    stripe_invoice_id = Column(String)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    account = relationship("Account", back_populates="transactions")
