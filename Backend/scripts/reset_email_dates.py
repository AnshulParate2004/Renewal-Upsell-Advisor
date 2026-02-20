"""
Reset last_contact_date in accounts table to allow email sending.
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


def reset_email_dates():
    """Reset last_contact_date in accounts table."""
    print("\n" + "="*70)
    print("RESET LAST_CONTACT_DATE IN ACCOUNTS TABLE")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("[ERROR] Supabase not configured")
        return False
    
    try:
        # Get all active accounts
        accounts_result = client.table("accounts").select("id, name, last_contact_date").eq("status", "active").execute()
        accounts = accounts_result.data if accounts_result.data else []
        
        print(f"\n[INFO] Found {len(accounts)} active accounts")
        
        if not accounts:
            print("[INFO] No accounts found")
            return True
        
        # Reset last_contact_date to None for all accounts
        print("\n[INFO] Resetting last_contact_date...")
        updated_count = 0
        
        for account in accounts:
            account_id = account.get("id")
            account_name = account.get("name", "Unknown")
            last_contact = account.get("last_contact_date")
            
            try:
                # Set last_contact_date to None
                client.table("accounts").update({
                    "last_contact_date": None
                }).eq("id", account_id).execute()
                updated_count += 1
                print(f"  [OK] Reset {account_name}")
            except Exception as e:
                print(f"  [ERROR] Failed to reset {account_name}: {e}")
        
        print(f"\n[SUCCESS] Reset last_contact_date for {updated_count} accounts")
        
        # Verify
        verify_result = client.table("accounts").select("id, last_contact_date").eq("status", "active").limit(5).execute()
        accounts_check = verify_result.data if verify_result.data else []
        
        print("\n[VERIFY] Sample accounts:")
        for acc in accounts_check[:5]:
            print(f"  {acc.get('name', 'Unknown')}: last_contact_date = {acc.get('last_contact_date')}")
        
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to reset dates: {e}")
        import traceback
        print(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = reset_email_dates()
    if success:
        print("\n" + "="*70)
        print("[SUCCESS] Dates reset. Ready to test email sending!")
        print("="*70)
    else:
        print("\n" + "="*70)
        print("[ERROR] Failed to reset dates")
        print("="*70)
