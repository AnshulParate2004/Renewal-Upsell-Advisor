"""
Generate 25000 customer records for database import.
Creates an Excel file with all account fields matching the database schema.
Data is realistic (scores by ARR tier); EDA notebooks use only flowchart factors per model.
"""

import pandas as pd
import random
from datetime import datetime, timedelta
from faker import Faker

# Initialize Faker for realistic data
fake = Faker()
Faker.seed(42)  # For reproducible results
random.seed(42)

# Industries and company sizes
industries = [
    "Technology", "SaaS", "Enterprise", "Analytics", "Cloud", "Finance",
    "Healthcare", "Media", "Manufacturing", "Research", "CleanTech",
    "E-commerce", "Education", "Real Estate", "Consulting", "Retail"
]

company_sizes = ["Small", "Medium", "Large", "Enterprise"]

renewal_stages = ["t90", "t60", "t30", "renewed", "lost"]
statuses = ["active", "churned", "at_risk", "renewed"]
sentiment_categories = ["very_negative", "negative", "neutral", "positive", "very_positive"]

# Generate 25000 customer records
records = []

for i in range(1, 25001):
    # Calculate renewal date (between 30 and 120 days from now)
    days_until_renewal = random.randint(30, 120)
    renewal_date = datetime.now() + timedelta(days=days_until_renewal)
    contract_start = renewal_date - timedelta(days=365)
    
    # Determine renewal stage based on days until renewal
    if days_until_renewal <= 30:
        renewal_stage = "t30"
    elif days_until_renewal <= 60:
        renewal_stage = "t60"
    elif days_until_renewal <= 90:
        renewal_stage = "t90"
    else:
        renewal_stage = random.choice(["t90", "renewed"])
    
    # Generate realistic metrics
    industry = random.choice(industries)
    
    # ARR based on industry and company size
    base_arr = random.choice([25000, 50000, 75000, 100000, 150000, 200000, 250000, 350000, 500000])
    arr = base_arr + random.randint(-10000, 50000)
    mrr = round(arr / 12, 2)
    
    # Raw inputs (flowchart columns): last_contact, sentiment, licenses, utilization
    last_contact_days = random.randint(0, 30)
    last_contact_date = datetime.now() - timedelta(days=last_contact_days)
    sentiment_category = random.choice(sentiment_categories)
    if sentiment_category == "very_positive":
        sentiment_score = round(random.uniform(0.75, 1.0), 4)
    elif sentiment_category == "positive":
        sentiment_score = round(random.uniform(0.35, 0.75), 4)
    elif sentiment_category == "neutral":
        sentiment_score = round(random.uniform(-0.25, 0.35), 4)
    elif sentiment_category == "negative":
        sentiment_score = round(random.uniform(-0.75, -0.25), 4)
    else:
        sentiment_score = round(random.uniform(-1.0, -0.75), 4)
    licenses_total = random.choice([10, 20, 30, 50, 75, 100, 150, 200])
    utilization_pct = random.randint(25, 95)
    licenses_used = max(1, int(licenses_total * (utilization_pct / 100)))

    # Scores: realistic by ARR tier (no deriving from features; EDA uses flowchart factors only)
    if arr > 200000:
        health_score = random.randint(70, 100)
        risk_score = random.randint(5, 40)
        relationship_score = round(random.uniform(70, 100), 2)
        churn_probability = round(random.uniform(0.05, 0.35), 4)
    elif arr > 100000:
        health_score = random.randint(55, 85)
        risk_score = random.randint(20, 60)
        relationship_score = round(random.uniform(50, 85), 2)
        churn_probability = round(random.uniform(0.25, 0.55), 4)
    else:
        health_score = random.randint(30, 70)
        risk_score = random.randint(40, 90)
        relationship_score = round(random.uniform(25, 70), 2)
        churn_probability = round(random.uniform(0.45, 0.85), 4)
    
    # CSM assignment (distribute across 5 CSMs)
    csms = ["Sarah Chen", "James Wilson", "Maria Lopez", "David Kim", "Emily Rodriguez"]
    csm_name = random.choice(csms)
    csm_email = csm_name.lower().replace(" ", ".") + "@company.com"
    
    # Primary contact
    contact_first = fake.first_name()
    contact_last = fake.last_name()
    contact_name = f"{contact_first} {contact_last}"
    contact_email = fake.email()
    contact_phone = fake.phone_number()
    
    # Company name
    company_name = fake.company()
    domain = company_name.lower().replace(" ", "").replace(",", "").replace(".", "") + ".com"
    
    # Status based on metrics
    if risk_score >= 70 or churn_probability >= 0.7:
        status = random.choice(["at_risk", "churned"])
    elif renewal_stage == "renewed":
        status = "renewed"
    else:
        status = "active"
    
    record = {
        # Basic Info
        "name": company_name,
        "domain": domain,
        "industry": industry,
        "company_size": random.choice(company_sizes),
        
        # Financial
        "arr": arr,
        "mrr": mrr,
        
        # Dates
        "contract_start_date": contract_start.strftime("%Y-%m-%d"),
        "contract_end_date": renewal_date.strftime("%Y-%m-%d"),
        "renewal_date": renewal_date.strftime("%Y-%m-%d"),
        "last_contact_date": last_contact_date.strftime("%Y-%m-%d %H:%M:%S"),
        
        # Status
        "status": status,
        "renewal_stage": renewal_stage,
        
        # Scores
        "health_score": health_score,
        "risk_score": risk_score,
        "relationship_score": relationship_score,
        "churn_probability": churn_probability,
        "sentiment_score": sentiment_score,
        "sentiment_category": sentiment_category,
        
        # Licenses
        "licenses_total": licenses_total,
        "licenses_used": licenses_used,
        "utilization_percentage": round(utilization_pct, 2),
        
        # CSM
        "csm_name": csm_name,
        "csm_email": csm_email,
        
        # Primary Contact
        "primary_contact_name": contact_name,
        "primary_contact_email": contact_email,
        "primary_contact_phone": contact_phone,
        
        # Optional Salesforce ID
        "salesforce_id": f"SF-{random.randint(100000, 999999)}" if random.random() > 0.3 else None,
    }
    
    records.append(record)

# Create DataFrame
df = pd.DataFrame(records)

# Reorder columns to match logical grouping
column_order = [
    "name", "domain", "industry", "company_size",
    "arr", "mrr",
    "contract_start_date", "contract_end_date", "renewal_date", "last_contact_date",
    "status", "renewal_stage",
    "health_score", "risk_score", "relationship_score",
    "churn_probability", "sentiment_score", "sentiment_category",
    "licenses_total", "licenses_used", "utilization_percentage",
    "csm_name", "csm_email",
    "primary_contact_name", "primary_contact_email", "primary_contact_phone",
    "salesforce_id"
]

df = df[column_order]

# Save to Excel in Research folder (so EDA notebook finds it without copying)
from pathlib import Path
research_dir = Path(__file__).resolve().parent.parent / "Research"
research_dir.mkdir(parents=True, exist_ok=True)
output_file = research_dir / "customer_data_25000.xlsx"
df.to_excel(output_file, index=False, sheet_name="Accounts", engine='openpyxl')

print(f"Successfully created {output_file} with {len(df)} customer records!")
print(f"\nSummary:")
print(f"   - Total Records: {len(df)}")
print(f"   - Total ARR: ${df['arr'].sum():,.2f}")
print(f"   - Average ARR: ${df['arr'].mean():,.2f}")
print(f"   - High Risk Accounts (risk_score >= 70): {len(df[df['risk_score'] >= 70])}")
print(f"   - Active Accounts: {len(df[df['status'] == 'active'])}")
print(f"   - At Risk Accounts: {len(df[df['status'] == 'at_risk'])}")
print(f"\nFile saved as: {output_file}")
