"""
Generate test dataset CSV/Excel file with 15 accounts.
All accounts will have the same email and phone number as specified.
ML-predicted fields will be empty initially (to be filled by ML models).
"""
import pandas as pd
from datetime import datetime, timedelta
import random
import uuid

# Constants for all accounts
UNIVERSAL_EMAIL = "anshulnparatecoc@gmail.com"
UNIVERSAL_PHONE = "+91 8208170566"

# Sample data pools
COMPANY_NAMES = [
    "TechCorp Solutions", "DataFlow Analytics", "CloudNine Systems", 
    "InnovateHub Inc", "Digital Dynamics", "SmartTech Ventures",
    "NextGen Solutions", "Apex Technologies", "PrimeSoft Corp",
    "Elite Systems", "Quantum Analytics", "Nexus Innovations",
    "Stellar Solutions", "Velocity Tech", "Catalyst Enterprises"
]

DOMAINS = [
    "techcorp.com", "dataflow.io", "cloudnine.com", "innovatehub.net",
    "digitaldynamics.com", "smarttech.io", "nextgen.com", "apextech.net",
    "primesoft.com", "elitesys.io", "quantumanalytics.com", "nexusinnov.com",
    "stellarsolutions.com", "velocitytech.io", "catalystent.com"
]

INDUSTRIES = [
    "Technology", "Healthcare", "Finance", "Retail", "Manufacturing",
    "Education", "Consulting", "SaaS", "E-commerce", "Telecommunications",
    "Energy", "Real Estate", "Media", "Transportation", "Hospitality"
]

COMPANY_SIZES = ["Small", "Medium", "Large"]

CSM_NAMES = [
    "Sarah Chen", "Maria Lopez", "Emily Rodriguez", "James Wilson",
    "David Kim", "Lisa Anderson", "Michael Brown", "Jennifer Lee"
]

CSM_EMAILS = [
    "sarah.chen@company.com", "maria.lopez@company.com", 
    "emily.rodriguez@company.com", "james.wilson@company.com",
    "david.kim@company.com", "lisa.anderson@company.com",
    "michael.brown@company.com", "jennifer.lee@company.com"
]

CONTACT_NAMES = [
    "John Smith", "Jane Doe", "Robert Johnson", "Emily Davis",
    "Michael Chen", "Sarah Williams", "David Martinez", "Lisa Brown",
    "James Wilson", "Maria Garcia", "Christopher Lee", "Jennifer Taylor",
    "Daniel Anderson", "Amanda White", "Matthew Harris"
]

RENEWAL_STAGES = ["t90", "t60", "t30", "renewed"]


def generate_test_dataset():
    """Generate 15 test accounts dataset."""
    accounts_data = []
    
    for i in range(15):
        # Calculate dates
        contract_start = datetime.now() - timedelta(days=random.randint(180, 730))
        contract_end = contract_start + timedelta(days=365)
        renewal_date = contract_end
        last_contact = datetime.now() - timedelta(days=random.randint(1, 30))
        
        # Calculate ARR and MRR
        arr = round(random.uniform(10000, 500000), 2)
        mrr = round(arr / 12, 2)
        
        # Calculate licenses and utilization
        licenses_total = random.randint(10, 200)
        utilization_pct = random.randint(30, 95)
        licenses_used = int(licenses_total * (utilization_pct / 100))
        
        # Select random values
        company_name = COMPANY_NAMES[i]
        domain = DOMAINS[i]
        industry = INDUSTRIES[i]
        company_size = random.choice(COMPANY_SIZES)
        renewal_stage = random.choice(RENEWAL_STAGES)
        csm_name = random.choice(CSM_NAMES)
        csm_email = CSM_EMAILS[CSM_NAMES.index(csm_name) % len(CSM_EMAILS)]
        contact_name = CONTACT_NAMES[i]
        
        # Generate Salesforce ID
        salesforce_id = f"SF-{random.randint(100000, 999999)}"
        
        account_data = {
            "name": company_name,
            "domain": domain,
            "industry": industry,
            "company_size": company_size,
            "arr": arr,
            "mrr": mrr,
            "contract_start_date": contract_start.strftime("%Y-%m-%d"),
            "contract_end_date": contract_end.strftime("%Y-%m-%d"),
            "renewal_date": renewal_date.strftime("%Y-%m-%d"),
            "last_contact_date": last_contact.strftime("%Y-%m-%d %H:%M:%S"),
            "status": "active",
            "renewal_stage": renewal_stage,
            "licenses_used": licenses_used,
            "licenses_total": licenses_total,
            "utilization_percentage": utilization_pct,
            "csm_name": csm_name,
            "csm_email": csm_email,
            "primary_contact_name": contact_name,
            "primary_contact_email": UNIVERSAL_EMAIL,
            "primary_contact_phone": UNIVERSAL_PHONE,
            "salesforce_id": salesforce_id,
            # ML-predicted fields - empty initially
            "health_score": "",
            "risk_score": "",
            "relationship_score": "",
            "churn_probability": "",
            "sentiment_score": "",
            "sentiment_category": "",
        }
        
        accounts_data.append(account_data)
    
    # Create DataFrame
    df = pd.DataFrame(accounts_data)
    
    # Reorder columns to match the requested format
    column_order = [
        "name", "domain", "industry", "company_size", "arr", "mrr",
        "contract_start_date", "contract_end_date", "renewal_date", "last_contact_date",
        "status", "renewal_stage",
        "licenses_used", "licenses_total", "utilization_percentage",
        "csm_name", "csm_email",
        "primary_contact_name", "primary_contact_email", "primary_contact_phone",
        "salesforce_id",
        "health_score", "risk_score", "relationship_score", "churn_probability",
        "sentiment_score", "sentiment_category"
    ]
    
    df = df[column_order]
    
    # Save as CSV
    csv_path = "D:/Projects_Main/Renewal-Upsell-Advisor/data/test_dataset_15_accounts.csv"
    df.to_csv(csv_path, index=False)
    print(f"[SUCCESS] CSV file saved: {csv_path}")
    
    # Save as Excel
    excel_path = "D:/Projects_Main/Renewal-Upsell-Advisor/data/test_dataset_15_accounts.xlsx"
    df.to_excel(excel_path, index=False, engine='openpyxl')
    print(f"[SUCCESS] Excel file saved: {excel_path}")
    
    # Print summary
    print("\n" + "=" * 150)
    print(f"{'Name':<25} {'Domain':<20} {'Industry':<15} {'Size':<12} {'ARR':<12} {'MRR':<12} {'Stage':<8} {'Util%':<8} {'CSM':<20} {'SF ID':<10}")
    print("=" * 150)
    
    for _, row in df.iterrows():
        print(f"{row['name']:<25} {row['domain']:<20} {row['industry']:<15} {row['company_size']:<12} "
              f"${row['arr']:<11,.2f} ${row['mrr']:<11,.2f} {row['renewal_stage']:<8} "
              f"{row['utilization_percentage']:<7.1f}% {row['csm_name']:<20} {row['salesforce_id']:<10}")
    
    print("=" * 150)
    print(f"\nUniversal Email: {UNIVERSAL_EMAIL}")
    print(f"Universal Phone: {UNIVERSAL_PHONE}\n")
    print("Note: ML-predicted fields (health_score, risk_score, relationship_score,")
    print("      churn_probability, sentiment_score, sentiment_category) are empty")
    print("      and will be populated by ML models when predictions are run.\n")
    
    return df


if __name__ == "__main__":
    print("Generating test dataset with 15 accounts...")
    print(f"Universal Email: {UNIVERSAL_EMAIL}")
    print(f"Universal Phone: {UNIVERSAL_PHONE}\n")
    
    try:
        df = generate_test_dataset()
        print(f"\n[SUCCESS] Successfully generated test dataset with {len(df)} accounts!")
        print(f"Files saved in: D:/Projects_Main/Renewal-Upsell-Advisor/data/")
    except Exception as e:
        print(f"\n[ERROR] Error generating test dataset: {e}")
        import traceback
        traceback.print_exc()
