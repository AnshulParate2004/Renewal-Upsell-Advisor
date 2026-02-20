"""
Clear all email_campaigns records and reset last_contact_date.
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


def clear_all_emails():
    """Clear all email_campaigns and reset last_contact_date."""
    print("\n" + "="*70)
    print("CLEAR ALL EMAIL DATA")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("[ERROR] Supabase not configured")
        return False
    
    try:
        # Step 1: Clear email_campaigns
        print("\n[STEP 1] Clearing email_campaigns table...")
        email_result = client.table("email_campaigns").select("id").execute()
        email_records = email_result.data if email_result.data else []
        
        if email_records:
            deleted = 0
            for record in email_records:
                try:
                    client.table("email_campaigns").delete().eq("id", record["id"]).execute()
                    deleted += 1
                except Exception as e:
                    print(f"  [WARNING] Failed to delete {record['id']}: {e}")
            print(f"  [SUCCESS] Deleted {deleted} email campaign records")
        else:
            print("  [INFO] No email campaigns to delete")
        
        # Step 2: Reset last_contact_date
        print("\n[STEP 2] Resetting last_contact_date in accounts...")
        accounts_result = client.table("accounts").select("id").eq("status", "active").execute()
        accounts = accounts_result.data if accounts_result.data else []
        
        if accounts:
            updated = 0
            for account in accounts:
                try:
                    client.table("accounts").update({
                        "last_contact_date": None
                    }).eq("id", account["id"]).execute()
                    updated += 1
                except Exception as e:
                    print(f"  [WARNING] Failed to update {account['id']}: {e}")
            print(f"  [SUCCESS] Reset last_contact_date for {updated} accounts")
        else:
            print("  [INFO] No accounts to update")
        
        # Verify
        print("\n[VERIFY] Verification...")
        email_check = client.table("email_campaigns").select("id", count="exact").execute()
        email_count = email_check.count if hasattr(email_check, 'count') else len(email_check.data) if email_check.data else 0
        
        accounts_check = client.table("accounts").select("id, last_contact_date").eq("status", "active").limit(3).execute()
        accounts_sample = accounts_check.data if accounts_check.data else []
        
        print(f"  Email campaigns remaining: {email_count}")
        print(f"  Sample accounts last_contact_date:")
        for acc in accounts_sample[:3]:
            print(f"    {acc.get('id')}: {acc.get('last_contact_date')}")
        
        if email_count == 0:
            print("\n[SUCCESS] All email data cleared!")
            return True
        else:
            print(f"\n[WARNING] {email_count} email campaigns still remain")
            return False
        
    except Exception as e:
        print(f"[ERROR] Failed: {e}")
        import traceback
        print(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = clear_all_emails()
    print("\n" + "="*70)
    if success:
        print("[SUCCESS] Ready to test email sending!")
    else:
        print("[WARNING] Some data may still remain")
    print("="*70)
