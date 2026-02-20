"""
Complete database reset and setup script.
1. Drops all tables
2. Creates schema from database_schema.sql
3. Pushes test data from Excel file
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv
import pandas as pd
from datetime import datetime
import psycopg2
from urllib.parse import urlparse

# Add Backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.email.scheduler import get_supabase_client

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)


def get_postgres_connection():
    """Get PostgreSQL connection using Supabase credentials."""
    # First, try DATABASE_URL (full connection string)
    database_url = os.getenv("DATABASE_URL")
    if database_url and database_url.startswith("postgresql://"):
        try:
            conn = psycopg2.connect(database_url)
            return conn
        except Exception as e:
            print(f"[WARN] Failed to connect using DATABASE_URL: {e}")
    
    # Otherwise, try building from Supabase URL and password
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_db_password = os.getenv("SUPABASE_DB_PASSWORD")
    
    if not supabase_url or not supabase_db_password:
        print("[ERROR] Need either DATABASE_URL or both SUPABASE_URL and SUPABASE_DB_PASSWORD")
        print("\n[INFO] To get SUPABASE_DB_PASSWORD:")
        print("  1. Go to Supabase Dashboard > Settings > Database")
        print("  2. Find 'Connection string' section")
        print("  3. Copy the password from the connection string")
        print("  4. Add SUPABASE_DB_PASSWORD=<password> to your .env file")
        print("\n[INFO] Or set DATABASE_URL with full PostgreSQL connection string:")
        print("  DATABASE_URL=postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres")
        return None
    
    try:
        # Parse Supabase URL to get project ref
        parsed = urlparse(supabase_url)
        project_ref = parsed.netloc.split('.')[0]
        
        # Build PostgreSQL connection string
        postgres_url = f"postgresql://postgres:{supabase_db_password}@db.{project_ref}.supabase.co:5432/postgres"
        
        conn = psycopg2.connect(postgres_url)
        return conn
    except Exception as e:
        print(f"[ERROR] Failed to connect to PostgreSQL: {e}")
        return None


def drop_all_tables():
    """Drop all tables using SQL."""
    print("\n" + "="*70)
    print("STEP 1: DROPPING ALL TABLES")
    print("="*70)
    
    conn = get_postgres_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Read drop_all_tables.sql
        drop_sql_file = Path(__file__).parent.parent.parent / "docs" / "drop_all_tables.sql"
        if not drop_sql_file.exists():
            print(f"[ERROR] SQL file not found: {drop_sql_file}")
            return False
        
        with open(drop_sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Execute SQL - split by semicolons but preserve multi-line structure
        # Remove comment-only lines but keep inline comments
        lines = []
        for line in sql_content.split('\n'):
            stripped = line.strip()
            # Skip standalone comment lines
            if stripped.startswith('--') and not any(keyword in stripped.upper() for keyword in ['CREATE', 'ALTER', 'DROP', 'INSERT', 'SELECT']):
                continue
            lines.append(line)
        
        # Join lines and split by semicolons
        full_sql = '\n'.join(lines)
        # Split by semicolon, but keep the semicolon with the statement
        statements = [s.strip() + ';' for s in full_sql.split(';') if s.strip()]
        
        # Execute each statement
        executed = 0
        for statement in statements:
            try:
                cursor.execute(statement)
                executed += 1
                # Show first few words of statement
                first_words = ' '.join(statement.split()[:3])
                print(f"  [OK] Executed: {first_words}...")
            except Exception as e:
                # Some statements might fail if tables don't exist, that's OK
                error_str = str(e).lower()
                if "does not exist" not in error_str and "already exists" not in error_str:
                    first_words = ' '.join(statement.split()[:3])
                    print(f"  [WARN] {first_words}... - {str(e)[:80]}")
        
        conn.commit()
        print(f"\n[SUCCESS] Dropped all tables")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to drop tables: {e}")
        import traceback
        print(traceback.format_exc())
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()


def create_schema():
    """Create schema from database_schema.sql file."""
    print("\n" + "="*70)
    print("STEP 2: CREATING SCHEMA FROM database_schema.sql")
    print("="*70)
    
    schema_file = Path(__file__).parent.parent.parent / "docs" / "database_schema.sql"
    
    if not schema_file.exists():
        print(f"[ERROR] Schema file not found: {schema_file}")
        return False
    
    print(f"[INFO] Reading schema from: {schema_file}")
    
    conn = get_postgres_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Read schema SQL file
        with open(schema_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Process SQL - remove comment-only lines but keep inline comments
        lines = []
        for line in sql_content.split('\n'):
            stripped = line.strip()
            # Skip standalone comment lines (but keep lines with SQL + comments)
            if stripped.startswith('--') and not any(keyword in stripped.upper() for keyword in ['CREATE', 'ALTER', 'DROP', 'INSERT', 'SELECT', 'UPDATE', 'DELETE', 'GRANT', 'REVOKE']):
                continue
            lines.append(line)
        
        # Join lines and split by semicolons
        full_sql = '\n'.join(lines)
        # Split by semicolon, but keep the semicolon with the statement
        statements = [s.strip() + ';' for s in full_sql.split(';') if s.strip()]
        
        # Execute each statement
        executed_count = 0
        for statement in statements:
            try:
                cursor.execute(statement)
                executed_count += 1
                if executed_count % 5 == 0:
                    first_words = ' '.join(statement.split()[:3])
                    print(f"  [INFO] Executed {executed_count} statements... ({first_words}...)")
            except Exception as e:
                # Some statements might fail (e.g., if extensions already exist)
                error_msg = str(e).lower()
                if "already exists" not in error_msg and "does not exist" not in error_msg:
                    first_words = ' '.join(statement.split()[:3])
                    print(f"  [WARN] {first_words}... - {str(e)[:100]}")
        
        conn.commit()
        print(f"\n[SUCCESS] Created schema ({executed_count} statements executed)")
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to create schema: {e}")
        import traceback
        print(traceback.format_exc())
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()


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
    print("DATABASE RESET AND SETUP")
    print("="*70)
    print("\nThis script will:")
    print("  1. Drop all existing tables")
    print("  2. Create schema from database_schema.sql")
    print("  3. Push data from test_dataset_15_accounts.xlsx")
    print("\n[WARNING] This will delete all existing data!")
    print("\n[INFO] Starting automated process...")
    
    # Step 1: Drop tables
    if not drop_all_tables():
        print("[ERROR] Failed to drop tables")
        return
    
    # Step 2: Create schema
    if not create_schema():
        print("[ERROR] Failed to create schema")
        return
    
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
