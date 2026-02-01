from app.db.connection import Base, engine, SessionLocal, Account
from sqlalchemy import text
from datetime import date

def seed_db():
    print("Resetting database...")
    # Drop and recreate tables to ensure schema matches
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Create ACC-001
    account = Account(
        account_id="ACC-001",
        company_name="TechCorp Inc.",
        arr=450000.0,
        renewal_date=date(2024, 3, 15),
        days_to_renewal=28,
        health_score=65,
        login_drop_rate=45.0,
        support_tickets=12,
        resolution_time_hours=24.5,
        payment_failures=2,
        nps_score=7,
        license_utilization=35.0,
        storage_utilization=60.0,
        feature_usage_score=40,
        churn_risk_label=1,
        upsell_opportunity_label=0,
        industry="SaaS",
        tier="Enterprise",
        last_contact_date=date(2024, 2, 1)
    )
    
    db.add(account)
    db.commit()
    print("Database seeded with ACC-001.")
    db.close()

if __name__ == "__main__":
    seed_db()
