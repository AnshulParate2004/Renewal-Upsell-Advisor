import pandas as pd
from sqlalchemy import create_engine
from datetime import date, timedelta
import random
import os

# Configuration
csv_path = r"D:\Internship\Renewal-Upsell-Advisor\Research\datamaking\s007_synthetic_data.csv"
db_url = "postgresql://postgres:admin123@localhost:5433/renewal_advisor"

def restore_data():
    if not os.path.exists(csv_path):
        print(f"Error: CSV not found at {csv_path}")
        return

    print("Reading CSV...")
    df = pd.read_csv(csv_path)
    
    # Normalize column names to lowercase
    df.columns = [c.lower() for c in df.columns]

    # Add missing columns required by the backend
    print("Enriching data with missing fields...")
    
    # Company Name
    df['company_name'] = df['account_id'].apply(lambda x: f"Company {x}")
    
    # Health Score (random 0-100)
    df['health_score'] = [random.randint(20, 100) for _ in range(len(df))]
    
    # Last Contact Date (random within last 30 days)
    today = date.today()
    df['last_contact_date'] = [today - timedelta(days=random.randint(1, 30)) for _ in range(len(df))]

    # Connect to DB
    engine = create_engine(db_url)
    
    print(f"Pushing {len(df)} records to database...")
    try:
        df.to_sql("s007_synthetic_data", engine, if_exists='replace', index=False)
        print("Data successfully restored and enriched!")
    except Exception as e:
        print(f"Error pushing data: {e}")

if __name__ == "__main__":
    restore_data()
