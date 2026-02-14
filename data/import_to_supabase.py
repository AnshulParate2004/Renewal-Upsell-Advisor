"""
Import customer data from Excel to Supabase database
Reads customer_data_25000.xlsx and inserts into accounts table
"""

import pandas as pd
import os
from dotenv import load_dotenv
from supabase import create_client, Client
import time

# Load environment variables from .env file
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'New_Backend', '.env')
load_dotenv(env_path)

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Fallback to known credentials if .env not found
if not SUPABASE_URL:
    SUPABASE_URL = "https://qrfhjwyrpqdardofwayj.supabase.co"
if not SUPABASE_SERVICE_ROLE_KEY:
    SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZmhqd3lycHFkYXJkb2Z3YXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1ODI4OCwiZXhwIjoyMDg0OTM0Mjg4fQ.tCrPkvz-3jfKOfBiPUWBei9Ownz23TuyxQf14OReZx8"

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("Connecting to Supabase...")
print(f"URL: {SUPABASE_URL}")

# Read Excel file
excel_file = "customer_data_25000.xlsx"
print(f"\nReading Excel file: {excel_file}")

df = pd.read_excel(excel_file, sheet_name="Accounts")
print(f"Loaded {len(df)} records from Excel")

# Prepare data for insertion
# Convert DataFrame to list of dictionaries, handling None values
records = []
for _, row in df.iterrows():
    record = {
        "name": str(row['name']) if pd.notna(row['name']) else None,
        "domain": str(row['domain']) if pd.notna(row['domain']) else None,
        "industry": str(row['industry']) if pd.notna(row['industry']) else None,
        "company_size": str(row['company_size']) if pd.notna(row['company_size']) else None,
        "arr": float(row['arr']) if pd.notna(row['arr']) else 0,
        "mrr": float(row['mrr']) if pd.notna(row['mrr']) else 0,
        "contract_start_date": str(row['contract_start_date']) if pd.notna(row['contract_start_date']) else None,
        "contract_end_date": str(row['contract_end_date']) if pd.notna(row['contract_end_date']) else None,
        "renewal_date": str(row['renewal_date']) if pd.notna(row['renewal_date']) else None,
        "last_contact_date": str(row['last_contact_date']) if pd.notna(row['last_contact_date']) else None,
        "status": str(row['status']) if pd.notna(row['status']) else 'active',
        "renewal_stage": str(row['renewal_stage']) if pd.notna(row['renewal_stage']) else None,
        "health_score": int(row['health_score']) if pd.notna(row['health_score']) else None,
        "risk_score": int(row['risk_score']) if pd.notna(row['risk_score']) else None,
        "relationship_score": int(row['relationship_score']) if pd.notna(row['relationship_score']) else None,
        "churn_probability": float(row['churn_probability']) if pd.notna(row['churn_probability']) else None,
        "sentiment_score": float(row['sentiment_score']) if pd.notna(row['sentiment_score']) else None,
        "sentiment_category": str(row['sentiment_category']) if pd.notna(row['sentiment_category']) else None,
        "licenses_total": int(row['licenses_total']) if pd.notna(row['licenses_total']) else 0,
        "licenses_used": int(row['licenses_used']) if pd.notna(row['licenses_used']) else 0,
        "utilization_percentage": float(row['utilization_percentage']) if pd.notna(row['utilization_percentage']) else None,
        "csm_name": str(row['csm_name']) if pd.notna(row['csm_name']) else None,
        "csm_email": str(row['csm_email']) if pd.notna(row['csm_email']) else None,
        "primary_contact_name": str(row['primary_contact_name']) if pd.notna(row['primary_contact_name']) else None,
        "primary_contact_email": str(row['primary_contact_email']) if pd.notna(row['primary_contact_email']) else None,
        "primary_contact_phone": str(row['primary_contact_phone']) if pd.notna(row['primary_contact_phone']) else None,
        "salesforce_id": str(row['salesforce_id']) if pd.notna(row['salesforce_id']) else None,
    }
    records.append(record)

print(f"\nPrepared {len(records)} records for insertion")
print("\nStarting data import...")

# Insert in batches of 1000 (Supabase has limits on batch size)
batch_size = 1000
total_batches = (len(records) + batch_size - 1) // batch_size
inserted_count = 0
failed_count = 0

for i in range(0, len(records), batch_size):
    batch = records[i:i + batch_size]
    batch_num = (i // batch_size) + 1
    
    try:
        # Insert batch
        response = supabase.table('accounts').insert(batch).execute()
        inserted_count += len(batch)
        print(f"Batch {batch_num}/{total_batches}: Inserted {len(batch)} records (Total: {inserted_count}/{len(records)})")
        
        # Small delay to avoid rate limiting
        if batch_num < total_batches:
            time.sleep(0.5)
            
    except Exception as e:
        print(f"Error inserting batch {batch_num}: {str(e)}")
        failed_count += len(batch)
        # Try inserting one by one to find problematic records
        for record in batch:
            try:
                supabase.table('accounts').insert(record).execute()
                inserted_count += 1
            except Exception as err:
                failed_count += 1
                print(f"  Failed to insert: {record.get('name', 'Unknown')} - {str(err)}")

print(f"\n{'='*60}")
print(f"Import Complete!")
print(f"{'='*60}")
print(f"Total Records: {len(records)}")
print(f"Successfully Inserted: {inserted_count}")
print(f"Failed: {failed_count}")
print(f"{'='*60}")

if inserted_count > 0:
    print(f"\nSuccessfully imported {inserted_count} customer records to Supabase!")
    print("You can now view them in the Supabase Table Editor.")
