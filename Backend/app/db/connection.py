from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database Connection
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:admin123@localhost:5433/renewal_advisor"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Models
class Account(Base):
    __tablename__ = "s007_synthetic_data"

    # Assuming no explicit primary key in CSV, checking structure. 
    # Usually Account_ID is unique. Using it as primary key.
    # Columns in DB are lowercase per push_data.py: 
    # account_id, arr, renewal_date, days_to_renewal, login_drop_rate, support_tickets, 
    # payment_failures, license_utilization, churn_risk_label, upsell_opportunity_label
    
    account_id = Column(String, primary_key=True, index=True)
    company_name = Column(String) # Added
    arr = Column(Float)
    renewal_date = Column(Date)
    days_to_renewal = Column(Integer)
    health_score = Column(Integer) # Added
    login_drop_rate = Column(Float)
    support_tickets = Column(Integer)
    resolution_time_hours = Column(Float) 
    payment_failures = Column(Integer)
    nps_score = Column(Integer) 
    license_utilization = Column(Float)
    storage_utilization = Column(Float) 
    feature_usage_score = Column(Integer) 
    churn_risk_label = Column(Integer)
    upsell_opportunity_label = Column(Integer)
    industry = Column(String) 
    tier = Column(String) 
    last_contact_date = Column(Date) # Added

