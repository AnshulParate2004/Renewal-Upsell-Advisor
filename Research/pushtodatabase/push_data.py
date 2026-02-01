import pandas as pd
from sqlalchemy import create_engine, text
import os

# Configuration
csv_path = r"D:\Internship\Renewal-Upsell-Advisor\Research\datamaking\s007_synthetic_data.csv"
db_user = "postgres"
db_password = "admin123"
db_host = "localhost"
db_port = "5433"
db_name = "renewal_advisor" # Default database name
table_name = "s007_synthetic_data"

def create_database_if_not_exists():
    """Creates the database if it doesn't exist."""
    # Connect to default 'postgres' database to check/create the target db
    engine = create_engine(f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/postgres")
    conn = engine.connect()
    try:
        conn.execute(text("commit")) # We need to be outside a transaction to create a DB
        # Check if database exists
        result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'"))
        if not result.fetchone():
            print(f"Creating database: {db_name}")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
        else:
            print(f"Database {db_name} already exists.")
    except Exception as e:
        print(f"Error checking/creating database: {e}")
    finally:
        conn.close()

def push_data():
    if not os.path.exists(csv_path):
        print(f"CSV file not found at: {csv_path}")
        return

    print("Reading CSV...")
    df = pd.read_csv(csv_path)
    
    # Clean column names (optional, but good practice)
    df.columns = [c.lower() for c in df.columns]

    print("Connecting to database...")
    engine = create_engine(f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}")

    print(f"Pushing {len(df)} records to table '{table_name}'...")
    try:
        df.to_sql(table_name, engine, if_exists='replace', index=False)
        print("Data successfully pushed to PostgreSQL!")
    except Exception as e:
        print(f"Error pushing data: {e}")

if __name__ == "__main__":
    create_database_if_not_exists()
    push_data()
