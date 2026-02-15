"""
Database seeding script.
Populates the database with initial sample data for development.
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.account import Account
from app.models.opportunity import Opportunity
from datetime import datetime, timedelta
import uuid

# Create tables
Base.metadata.create_all(bind=engine)


def seed_accounts(db: Session):
    """Seed accounts table with sample data."""
    # Check if accounts already exist
    if db.query(Account).count() > 0:
        print("Accounts already exist. Skipping seed.")
        return
    
    sample_accounts = [
        {
            "id": str(uuid.uuid4()),
            "name": "Acme Corporation",
            "arr": 120000.0,
            "health_score": 78.0,
            "risk_score": 85.0,
            "relationship_score": 45.0,
            "churn_probability": 0.72,
            "sentiment_score": -0.35,
            "utilization": 67.0,
            "licenses_used": 34,
            "licenses_total": 50,
            "renewal_date": datetime.now() + timedelta(days=30),
            "renewal_stage": "t30",
            "industry": "Technology",
            "company_size": "Enterprise",
            "csm": "Sarah Chen",
            "last_contact": datetime.now() - timedelta(hours=2),
            "contract_start": datetime.now() - timedelta(days=365),
            "contact_name": "John Smith",
            "contact_email": "john.smith@acme.com",
            "contact_phone": "+1 (555) 123-4567",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "TechStart Inc",
            "arr": 45000.0,
            "health_score": 42.0,
            "risk_score": 72.0,
            "relationship_score": 52.0,
            "churn_probability": 0.68,
            "sentiment_score": 0.05,
            "utilization": 45.0,
            "licenses_used": 9,
            "licenses_total": 20,
            "renewal_date": datetime.now() + timedelta(days=45),
            "renewal_stage": "t30",
            "industry": "SaaS",
            "company_size": "Mid-Market",
            "csm": "James Wilson",
            "last_contact": datetime.now() - timedelta(days=1),
            "contract_start": datetime.now() - timedelta(days=365),
            "contact_name": "Emily Davis",
            "contact_email": "emily@techstart.io",
            "contact_phone": "+1 (555) 234-5678",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Global Systems",
            "arr": 200000.0,
            "health_score": 91.0,
            "risk_score": 15.0,
            "relationship_score": 88.0,
            "churn_probability": 0.12,
            "sentiment_score": 0.78,
            "utilization": 92.0,
            "licenses_used": 92,
            "licenses_total": 100,
            "renewal_date": datetime.now() + timedelta(days=60),
            "renewal_stage": "t60",
            "industry": "Enterprise",
            "company_size": "Enterprise",
            "csm": "Sarah Chen",
            "last_contact": datetime.now() - timedelta(days=3),
            "contract_start": datetime.now() - timedelta(days=365),
            "contact_name": "Michael Chen",
            "contact_email": "m.chen@globalsys.com",
            "contact_phone": "+1 (555) 345-6789",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "DataFlow Analytics",
            "arr": 85000.0,
            "health_score": 65.0,
            "risk_score": 55.0,
            "relationship_score": 62.0,
            "churn_probability": 0.48,
            "sentiment_score": 0.15,
            "utilization": 78.0,
            "licenses_used": 39,
            "licenses_total": 50,
            "renewal_date": datetime.now() + timedelta(days=90),
            "renewal_stage": "t90",
            "industry": "Analytics",
            "company_size": "Mid-Market",
            "csm": "Maria Lopez",
            "last_contact": datetime.now() - timedelta(days=7),
            "contract_start": datetime.now() - timedelta(days=365),
            "contact_name": "Sarah Jenkins",
            "contact_email": "s.jenkins@dataflow.com",
            "contact_phone": "+1 (555) 456-7890",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "CloudNine Solutions",
            "arr": 150000.0,
            "health_score": 88.0,
            "risk_score": 20.0,
            "relationship_score": 85.0,
            "churn_probability": 0.18,
            "sentiment_score": 0.72,
            "utilization": 85.0,
            "licenses_used": 68,
            "licenses_total": 80,
            "renewal_date": datetime.now() + timedelta(days=30),
            "renewal_stage": "t30",
            "industry": "Cloud",
            "company_size": "Enterprise",
            "csm": "James Wilson",
            "last_contact": datetime.now() - timedelta(hours=4),
            "contract_start": datetime.now() - timedelta(days=365),
            "contact_name": "David Martinez",
            "contact_email": "david.m@cloudnine.com",
            "contact_phone": "+1 (555) 567-8901",
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Summit Financial",
            "arr": 250000.0,
            "health_score": 95.0,
            "risk_score": 5.0,
            "relationship_score": 92.0,
            "churn_probability": 0.05,
            "sentiment_score": 0.88,
            "utilization": 88.0,
            "licenses_used": 176,
            "licenses_total": 200,
            "renewal_date": datetime.now() + timedelta(days=60),
            "renewal_stage": "t60",
            "industry": "Finance",
            "company_size": "Enterprise",
            "csm": "Sarah Chen",
            "last_contact": datetime.now() - timedelta(hours=1),
            "contract_start": datetime.now() - timedelta(days=365),
            "contact_name": "Linda White",
            "contact_email": "l.white@summitfin.com",
            "contact_phone": "+1 (555) 012-3456",
        },
    ]
    
    for account_data in sample_accounts:
        db_account = Account(**account_data)
        db.add(db_account)
    
    db.commit()
    print(f"Seeded {len(sample_accounts)} accounts")


def seed_opportunities(db: Session):
    """Seed opportunities table with sample data."""
    # Check if opportunities already exist
    if db.query(Opportunity).count() > 0:
        print("Opportunities already exist. Skipping seed.")
        return
    
    # Get account IDs
    accounts = db.query(Account).all()
    if not accounts:
        print("No accounts found. Create accounts first.")
        return
    
    sample_opportunities = [
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[2].id if len(accounts) > 2 else accounts[0].id,  # Global Systems
            "type": "upsell",
            "value": 48000.0,
            "probability": 85,
            "stage": "quote_sent",
            "created_date": datetime.now() - timedelta(days=30),
        },
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[0].id,  # Acme Corporation
            "type": "renewal",
            "value": 120000.0,
            "probability": 60,
            "stage": "negotiation",
            "created_date": datetime.now() - timedelta(days=20),
        },
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[4].id if len(accounts) > 4 else accounts[0].id,  # CloudNine Solutions
            "type": "upsell",
            "value": 35000.0,
            "probability": 70,
            "stage": "identified",
            "created_date": datetime.now() - timedelta(days=10),
        },
        {
            "id": str(uuid.uuid4()),
            "account_id": accounts[5].id if len(accounts) > 5 else accounts[0].id,  # Summit Financial
            "type": "cross_sell",
            "value": 80000.0,
            "probability": 90,
            "stage": "quote_sent",
            "created_date": datetime.now() - timedelta(days=25),
        },
    ]
    
    for opp_data in sample_opportunities:
        db_opp = Opportunity(**opp_data)
        db.add(db_opp)
    
    db.commit()
    print(f"Seeded {len(sample_opportunities)} opportunities")


def main():
    """Main seeding function."""
    print("Starting database seeding...")
    
    db = SessionLocal()
    try:
        seed_accounts(db)
        seed_opportunities(db)
        print("\nDatabase seeding completed successfully!")
    except Exception as e:
        print(f"\nError seeding database: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
