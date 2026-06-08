"""
Account database model.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base


class Account(Base):
    """Account model for storing customer account information."""
    __tablename__ = "accounts"
    
    id = Column(String, primary_key=True, index=True)
    salesforce_id = Column(String, unique=True)
    name = Column(String, nullable=False, index=True)
    domain = Column(String)
    industry = Column(String)
    company_size = Column(String)
    
    arr = Column(Float, nullable=False, default=0.0)
    mrr = Column(Float, nullable=False, default=0.0)
    
    contract_start_date = Column(DateTime)
    contract_end_date = Column(DateTime)
    renewal_date = Column(DateTime, index=True)
    status = Column(String, default='active')  # active, churned (contract ended), at_risk (includes intent), renewed
    
    health_score = Column(Integer)
    relationship_score = Column(Integer)
    risk_score = Column(Integer, index=True)
    
    licenses_total = Column(Integer, default=0)
    licenses_used = Column(Integer, default=0)
    renewal_stage = Column(String, index=True)  # q1, q2, q3, q4, renewed, lost
    last_contact_date = Column(DateTime)
    
    churn_probability = Column(Float)
    sentiment_score = Column(Float)
    sentiment_category = Column(String)  # very_negative, negative, neutral, positive, very_positive
    utilization_percentage = Column(Float)
    
    csm_email = Column(String)
    csm_name = Column(String)
    
    primary_contact_id = Column(String, ForeignKey("contacts.id", ondelete="SET NULL"))
    primary_contact_name = Column(String)
    primary_contact_email = Column(String)
    primary_contact_phone = Column(String)
    primary_contact_city = Column(String)
    primary_contact_state = Column(String)
    
    automation_enabled = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    contacts = relationship("Contact", back_populates="account", foreign_keys="[Contact.account_id]")
    primary_contact = relationship("Contact", foreign_keys=[primary_contact_id])
    
    usage_metrics = relationship("UsageMetric", back_populates="account", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="account", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="account", cascade="all, delete-orphan")
    metrics_history = relationship("MetricsHistory", back_populates="account", cascade="all, delete-orphan")
    sentiment_analysis = relationship("SentimentAnalysis", back_populates="account", cascade="all, delete-orphan")
    churn_predictions = relationship("ChurnPrediction", back_populates="account", cascade="all, delete-orphan")
    ml_score_history = relationship("MLScoreHistory", back_populates="account", cascade="all, delete-orphan")
    upsell_opportunities = relationship("UpsellOpportunity", back_populates="account", cascade="all, delete-orphan")
    voice_calls = relationship("VoiceCall", back_populates="account", cascade="all, delete-orphan")
    email_campaigns = relationship("EmailCampaign", back_populates="account", cascade="all, delete-orphan")
    renewal_quotes = relationship("RenewalQuote", back_populates="account", cascade="all, delete-orphan")
    renewal_events = relationship("RenewalEvent", back_populates="account", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
