"""
Remove records from Excel file that were NOT successfully imported to Supabase
Compares Excel data with database and keeps only successfully imported records
"""

import pandas as pd
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'New_Backend', '.env')
load_dotenv(env_path)

# Get Supabase credentials
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Fallback to known credentials
if not SUPABASE_URL:
    SUPABASE_URL = "https://qrfhjwyrpqdardofwayj.supabase.co"
if not SUPABASE_SERVICE_ROLE_KEY:
    SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyZmhqd3lycHFkYXJkb2Z3YXlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM1ODI4OCwiZXhwIjoyMDg0OTM0Mjg4fQ.tCrPkvz-3jfKOfBiPUWBei9Ownz23TuyxQf14OReZx8"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("Connecting to Supabase...")
print(f"Fetching imported account names from database...")

# Fetch all account names from database (in batches)
all_imported_names = set()
offset = 0
batch_size = 1000

while True:
    try:
        response = supabase.table('accounts').select('name').range(offset, offset + batch_size - 1).execute()
        
        if not response.data or len(response.data) == 0:
            break
            
        for record in response.data:
            all_imported_names.add(record['name'])
        
        offset += batch_size
        print(f"  Fetched {len(all_imported_names)} account names so far...")
        
        if len(response.data) < batch_size:
            break
            
    except Exception as e:
        print(f"Error fetching data: {e}")
        break

print(f"\nFound {len(all_imported_names)} accounts in database")

# Read Excel file
excel_file = "customer_data_25000.xlsx"
print(f"\nReading Excel file: {excel_file}")

df = pd.read_excel(excel_file, sheet_name="Accounts")
print(f"Original records in Excel: {len(df)}")

# Filter to keep only records that exist in database
df_cleaned = df[df['name'].isin(all_imported_names)].copy()

print(f"Records that exist in database: {len(df_cleaned)}")
print(f"Records to remove: {len(df) - len(df_cleaned)}")

# Save cleaned Excel file (overwrite original)
output_file = excel_file
df_cleaned.to_excel(output_file, index=False, sheet_name="Accounts", engine='openpyxl')

print(f"\n{'='*60}")
print(f"Cleaning Complete!")
print(f"{'='*60}")
print(f"Original Records: {len(df)}")
print(f"Successfully Imported: {len(df_cleaned)}")
print(f"Removed: {len(df) - len(df_cleaned)}")
print(f"{'='*60}")
print(f"\nCleaned file saved as: {output_file}")
print(f"The Excel file now contains only records that are in your database.")
