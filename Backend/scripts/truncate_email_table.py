"""
Script to truncate/clear the email_campaigns table in Supabase.
"""
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add Backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.email.scheduler import get_supabase_client

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)


def truncate_email_table():
    """Truncate email_campaigns table."""
    print("\n" + "="*70)
    print("TRUNCATE EMAIL_CAMPAIGNS TABLE")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("[ERROR] Supabase not configured")
        return False
    
    try:
        # Get current count
        count_result = client.table("email_campaigns").select("id", count="exact").execute()
        current_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data) if count_result.data else 0
        
        print(f"\n[INFO] Current records in email_campaigns: {current_count}")
        
        if current_count == 0:
            print("[INFO] Table is already empty.")
            return True
        
        # Get all IDs and delete them
        print("\n[INFO] Deleting all records...")
        all_records = client.table("email_campaigns").select("id").execute()
        
        if all_records.data:
            deleted_count = 0
            for record in all_records.data:
                try:
                    client.table("email_campaigns").delete().eq("id", record["id"]).execute()
                    deleted_count += 1
                except Exception as e:
                    print(f"[WARNING] Failed to delete record {record['id']}: {e}")
            
            print(f"[SUCCESS] Deleted {deleted_count} records")
        else:
            print("[INFO] No records found")
        
        # Verify
        verify_result = client.table("email_campaigns").select("id", count="exact").execute()
        remaining_count = verify_result.count if hasattr(verify_result, 'count') else len(verify_result.data) if verify_result.data else 0
        
        if remaining_count == 0:
            print("[SUCCESS] email_campaigns table is now empty!")
            return True
        else:
            print(f"[WARNING] {remaining_count} records still remain")
            return False
        
    except Exception as e:
        print(f"[ERROR] Failed to truncate table: {e}")
        import traceback
        print(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = truncate_email_table()
    if success:
        print("\n" + "="*70)
        print("[SUCCESS] Table cleared. Ready to test email sending!")
        print("="*70)
    else:
        print("\n" + "="*70)
        print("[ERROR] Failed to clear table")
        print("="*70)
