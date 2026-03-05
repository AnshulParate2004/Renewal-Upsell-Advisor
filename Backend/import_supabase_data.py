import os
import json
import pandas as pd
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv("D:/Renewal-Upsell-Advisor/Backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_SECRET") or os.environ.get("SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

excel_file = "D:/Renewal-Upsell-Advisor/Backend/supabase_full_export.xlsx"

insertion_order = [
    'app_settings',
    'accounts',
    'usage_metrics',
    'support_tickets',
    'sentiment_analysis',
    'churn_predictions',
    'ml_score_history',
    'upsell_opportunities',
    'voice_calls',
    'email_campaigns',
    'activity_logs',
    'salesforce_sync_log',
    'transactions',
    'renewal_quotes',
    'renewal_events'
]

xl = pd.ExcelFile(excel_file)
sheets = xl.sheet_names

print("Starting import...")

for table_name in insertion_order:
    if table_name not in sheets:
        continue
    
    print(f"Processing sheet: {table_name}")
    df = xl.parse(table_name)
    if df.empty:
        print(f"  Empty, skipping.")
        continue
        
    records = df.to_dict(orient='records')
    
    cleaned_records = []
    for rec in records:
        clean_rec = {}
        for k, v in rec.items():
            if pd.isna(v):
                continue
            
            if isinstance(v, pd.Timestamp):
                v = v.isoformat()
                
            if isinstance(v, str) and (k.endswith('_date') or k.endswith('_at')) and v == 'NaT':
                continue
                
            if k in ['config', 'details', 'feature_usage', 'contributing_factors', 'recommended_products', 'keywords', 'metadata', 'line_items', 'error_details']:
                if isinstance(v, str):
                    try:
                        v = json.loads(v)
                    except json.JSONDecodeError:
                        pass
            
            # To avoid foreign key constraint violations since contacts wasn't exported
            if k in ['primary_contact_id', 'contact_id']:
                continue 
                
            clean_rec[k] = v
        cleaned_records.append(clean_rec)
        
    # Batch insert into Supabase
    batch_size = 50
    for i in range(0, len(cleaned_records), batch_size):
        batch = cleaned_records[i:i+batch_size]
        try:
            res = supabase.table(table_name).insert(batch).execute()
        except Exception as e:
            print(f"Error inserting batch into {table_name}: {e}")

print("Import finished.")
