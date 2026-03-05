import os
import asyncio
from supabase import create_client

from app.core.config import settings

async def run_migration():
    supabase_url = os.environ.get("SUPABASE_URL", settings.SUPABASE_URL)
    supabase_secret = os.environ.get("SUPABASE_SERVICE_ROLE_SECRET", settings.SUPABASE_SERVICE_ROLE_SECRET)
    
    if not supabase_url or not supabase_secret:
        print("Missing Supabase credentials")
        return

    client = create_client(supabase_url, supabase_secret)
    
    # Supabase Python client doesn't support raw SQL execution easily.
    # The 'exec_sql' RPC usually needs to be defined in Supabase first to work.
    # Since we can't easily run ALTER statements through the REST API without an RPC wrapper,
    # let's write a small temporary script to see if the RPC exists, or instruct the user to run it.
    
    try:
        response = client.rpc('exec_sql', {'sql_string': '''
            ALTER TABLE ml_score_history ADD COLUMN IF NOT EXISTS model_version VARCHAR(50);
            ALTER TABLE upsell_opportunities ADD COLUMN IF NOT EXISTS reasoning TEXT;
            ALTER TABLE upsell_opportunities ADD COLUMN IF NOT EXISTS recommended_products JSONB;
        '''}).execute()
        print("Migration successful:", response.data)
    except Exception as e:
        print("Migration failed. Please run manually in Supabase SQL editor:")
        print("ALTER TABLE ml_score_history ADD COLUMN model_version VARCHAR(50);")
        print("ALTER TABLE upsell_opportunities ADD COLUMN reasoning TEXT;")
        print("ALTER TABLE upsell_opportunities ADD COLUMN recommended_products JSONB;")
        print("\nError Details:", getattr(e, 'message', str(e)))

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    asyncio.run(run_migration())
