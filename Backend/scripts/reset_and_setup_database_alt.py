"""
Alternative database reset script (without direct SQL execution).
This version clears data via Supabase REST API and provides SQL instructions.
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime

# Add Backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.email.scheduler import get_supabase_client

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)


def clear_all_data():
    """Clear all data from tables using Supabase REST API."""
    print("\n" + "="*70)
    print("STEP 1: CLEARING ALL DATA FROM TABLES")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("[ERROR] Supabase not configured")
        return False
    
    # Tables in order (child tables first)
    tables_to_clear = [
        "webhook_events",
        "ml_training_logs",
        "activity_logs",
        "salesforce_sync_log",
        "transactions",
        "renewal_events",
        "renewal_quotes",
        "voice_calls",
        "email_campaigns",
        "sentiment_analysis",
        "upsell_opportunities",
        "churn_predictions",
        "support_tickets",
        "usage_metrics",
        "contacts",
        "accounts"
    ]
    
    cleared_count = 0
    for table in tables_to_clear:
        try:
            # Delete all records (using a condition that should match all)
            result = client.table(table).delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
            print(f"  [OK] Cleared table: {table}")
            cleared_count += 1
        except Exception as e:
            # Table might not exist or already empty
            error_str = str(e).lower()
            if "does not exist" in error_str or "relation" in error_str:
                print(f"  [INFO] Table {table} does not exist (will be created by schema)")
            else:
                print(f"  [INFO] Table {table}: {str(e)[:80]}")
    
    print(f"\n[SUCCESS] Cleared {cleared_count} tables")
    return True


def show_sql_instructions():
    """Show instructions for running SQL manually."""
    print("\n" + "="*70)
    print("STEP 2: MANUAL SQL EXECUTION REQUIRED")
    print("="*70)
    
    drop_sql_file = Path(__file__).parent.parent.parent / "docs" / "drop_all_tables.sql"
    schema_sql_file = Path(__file__).parent.parent.parent / "docs" / "database_schema.sql"
    
    print("\n[IMPORTANT] You need to run SQL manually in Supabase SQL Editor:")
    print("\n1. Go to Supabase Dashboard > SQL Editor")
    print("\n2. Run DROP script (optional if tables don't exist):")
    print(f"   File: {drop_sql_file}")
    print("\n3. Run SCHEMA script (required):")
    print(f"   File: {schema_sql_file}")
    print("\n4. Copy and paste the SQL content into SQL Editor and execute")
    print("\n[INFO] After running the schema SQL, press Enter to continue...")
    
    try:
        input()
    except EOFError:
        # Non-interactive mode - just continue
        print("[INFO] Continuing automatically (non-interactive mode)")


def push_excel_data():
    """Push data from Excel file to Supabase."""
    print("\n" + "="*70)
    print("STEP 3: PUSHING EXCEL DATA TO SUPABASE")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("[ERROR] Supabase not configured")
        return False
    
    excel_file = Path(__file__).parent.parent.parent / "data" / "test_dataset_15_accounts.xlsx"
    
    if not excel_file.exists():
        print(f"[ERROR] Excel file not found: {excel_file}")
        return False
    
    print(f"[INFO] Reading Excel file: {excel_file}")
    
    try:
        # Read Excel file
        df = pd.read_excel(excel_file)
        print(f"[INFO] Found {len(df)} rows in Excel file")
        print(f"[INFO] Columns: {', '.join(df.columns.tolist())}")
        
        # Convert to list of dictionaries
        accounts_data = []
        
        for idx, row in df.iterrows():
            account = {}
            
            # Map Excel columns to database columns
            if 'name' in df.columns:
                account['name'] = str(row['name']) if pd.notna(row['name']) else None
            if 'domain' in df.columns:
                account['domain'] = str(row['domain']) if pd.notna(row['domain']) else None
            if 'industry' in df.columns:
                account['industry'] = str(row['industry']) if pd.notna(row['industry']) else None
            if 'company_size' in df.columns:
                account['company_size'] = str(row['company_size']) if pd.notna(row['company_size']) else None
            
            # Financial data
            if 'arr' in df.columns:
                account['arr'] = float(row['arr']) if pd.notna(row['arr']) else 0.0
            if 'mrr' in df.columns:
                account['mrr'] = float(row['mrr']) if pd.notna(row['mrr']) else 0.0
            
            # Dates
            date_columns = ['contract_start_date', 'contract_end_date', 'renewal_date', 'last_contact_date']
            for col in date_columns:
                if col in df.columns and pd.notna(row[col]):
                    if isinstance(row[col], datetime):
                        account[col] = row[col].date().isoformat()
                    elif isinstance(row[col], pd.Timestamp):
                        account[col] = row[col].date().isoformat()
                    else:
                        account[col] = str(row[col])
            
            # Status and stage
            if 'status' in df.columns:
                account['status'] = str(row['status']) if pd.notna(row['status']) else 'active'
            if 'renewal_stage' in df.columns:
                account['renewal_stage'] = str(row['renewal_stage']) if pd.notna(row['renewal_stage']) else None
            
            # Scores (handle as float/int)
            score_columns = ['health_score', 'risk_score', 'relationship_score', 'churn_probability', 
                           'sentiment_score', 'utilization_percentage']
            for col in score_columns:
                if col in df.columns and pd.notna(row[col]):
                    account[col] = float(row[col])
            
            # Sentiment category
            if 'sentiment_category' in df.columns:
                account['sentiment_category'] = str(row['sentiment_category']) if pd.notna(row['sentiment_category']) else None
            
            # Licenses
            if 'licenses_total' in df.columns:
                account['licenses_total'] = int(row['licenses_total']) if pd.notna(row['licenses_total']) else 0
            if 'licenses_used' in df.columns:
                account['licenses_used'] = int(row['licenses_used']) if pd.notna(row['licenses_used']) else 0
            
            # CSM info
            if 'csm_name' in df.columns:
                account['csm_name'] = str(row['csm_name']) if pd.notna(row['csm_name']) else None
            if 'csm_email' in df.columns:
                account['csm_email'] = str(row['csm_email']) if pd.notna(row['csm_email']) else None
            
            # Primary contact
            if 'primary_contact_name' in df.columns:
                account['primary_contact_name'] = str(row['primary_contact_name']) if pd.notna(row['primary_contact_name']) else None
            if 'primary_contact_email' in df.columns:
                account['primary_contact_email'] = str(row['primary_contact_email']) if pd.notna(row['primary_contact_email']) else None
            if 'primary_contact_phone' in df.columns:
                account['primary_contact_phone'] = str(row['primary_contact_phone']) if pd.notna(row['primary_contact_phone']) else None
            
            # Salesforce ID
            if 'salesforce_id' in df.columns:
                account['salesforce_id'] = str(row['salesforce_id']) if pd.notna(row['salesforce_id']) else None
            
            accounts_data.append(account)
        
        print(f"\n[INFO] Prepared {len(accounts_data)} accounts for insertion")
        
        # Insert accounts in batches
        batch_size = 5
        inserted_count = 0
        
        for i in range(0, len(accounts_data), batch_size):
            batch = accounts_data[i:i + batch_size]
            try:
                result = client.table("accounts").insert(batch).execute()
                if result.data:
                    inserted_count += len(result.data)
                    print(f"  [OK] Inserted batch {i//batch_size + 1}: {len(result.data)} accounts")
            except Exception as e:
                print(f"  [ERROR] Failed to insert batch {i//batch_size + 1}: {e}")
                # Try inserting one by one
                for account in batch:
                    try:
                        result = client.table("accounts").insert(account).execute()
                        if result.data:
                            inserted_count += 1
                            print(f"    [OK] Inserted: {account.get('name', 'Unknown')}")
                    except Exception as single_error:
                        print(f"    [ERROR] Failed to insert {account.get('name', 'Unknown')}: {single_error}")
        
        print(f"\n[SUCCESS] Inserted {inserted_count} accounts into database")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to process Excel file: {e}")
        import traceback
        print(traceback.format_exc())
        return False


def main():
    """Main execution function."""
    print("\n" + "="*70)
    print("DATABASE RESET AND SETUP (Alternative Method)")
    print("="*70)
    print("\nThis script will:")
    print("  1. Clear all data from tables")
    print("  2. Show instructions for running SQL schema manually")
    print("  3. Push data from test_dataset_15_accounts.xlsx")
    print("\n[WARNING] This will delete all existing data!")
    print("\n[INFO] Starting automated process...")
    
    # Step 1: Clear data
    if not clear_all_data():
        print("[ERROR] Failed to clear data")
        return
    
    # Step 2: Show SQL instructions
    show_sql_instructions()
    
    # Step 3: Push data
    if not push_excel_data():
        print("[ERROR] Failed to push Excel data")
        return
    
    print("\n" + "="*70)
    print("[SUCCESS] Database reset and setup completed!")
    print("="*70)
    print("\n[VERIFICATION] Please verify:")
    print("  1. All tables are created correctly")
    print("  2. Data was inserted successfully")
    print("  3. Check Supabase dashboard for confirmation")


if __name__ == "__main__":
    main()
