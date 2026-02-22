"""
Truncate all Supabase tables, then push test data from data/test_dataset_15_accounts.xlsx.

Use this before re-pushing test data so the DB is clean. Requires one of:
- DATABASE_URL (PostgreSQL connection string), or
- SUPABASE_URL + SUPABASE_DB_PASSWORD (to build Postgres URL for truncate)

Supabase REST (SUPABASE_URL + SUPABASE_KEY) is used for the push step.

Run from repo root: python Backend/scripts/truncate_and_push_test_data.py
"""
from pathlib import Path
import sys

# Add Backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
env_path = BACKEND_DIR / ".env"
if not env_path.exists():
    env_path = BACKEND_DIR.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)

import os


def get_pg_url():
    """PostgreSQL URL for raw truncate. Set DATABASE_URL in .env (Supabase: Settings -> Database -> Connection string URI)."""
    url = os.getenv("DATABASE_URL") or os.getenv("SUPABASE_DATABASE_URL")
    if url and url.strip().startswith("postgresql"):
        return url.strip()
    return None


def run_truncate_sql(pg_url: str) -> bool:
    """Run truncate SQL file using psycopg2. Returns True on success."""
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 not installed. Install with: pip install psycopg2-binary")
        return False

    sql_path = BACKEND_DIR.parent / "docs" / "truncate_all_tables.sql"
    if not sql_path.exists():
        print(f"ERROR: {sql_path} not found")
        return False

    sql = sql_path.read_text(encoding="utf-8")
    # Remove comments and split into statements (by semicolon, avoid splitting inside CASCADE)
    statements = []
    current = []
    for line in sql.splitlines():
        line = line.strip()
        if not line or line.startswith("--"):
            continue
        current.append(line)
        if line.endswith(";"):
            st = " ".join(current).strip()
            if st:
                statements.append(st)
            current = []
    if current:
        st = " ".join(current).strip()
        if st:
            statements.append(st)

    conn = None
    try:
        conn = psycopg2.connect(pg_url)
        conn.autocommit = True
        cur = conn.cursor()
        for st in statements:
            if not st.endswith(";"):
                st = st + ";"
            try:
                cur.execute(st)
                print("  OK:", st[:60].replace("\n", " ") + "..." if len(st) > 60 else st[:80])
            except psycopg2.Error as e:
                if "does not exist" in str(e):
                    print("  SKIP (table missing):", st[:50] + "...")
                else:
                    raise
        cur.close()
        print("Truncate completed.")
        return True
    except Exception as e:
        print(f"Truncate failed: {e}")
        return False
    finally:
        if conn:
            conn.close()


def main():
    pg_url = get_pg_url()
    if not pg_url:
        print("No PostgreSQL URL found. Set DATABASE_URL in .env (Supabase: Settings -> Database -> Connection string URI)")
        print("")
        print("To truncate manually:")
        print("  1. Open Supabase Dashboard -> SQL Editor")
        print("  2. Run the contents of: docs/truncate_all_tables.sql")
        print("  3. Then run: python Backend/scripts/push_test_accounts_to_supabase.py")
        print("")
        # Still try to push (user may have truncated manually)
        do_push = input("Have you already run the truncate SQL in Supabase? (y/n): ").strip().lower()
        if do_push != "y":
            return 1
    else:
        print("Truncating all tables...")
        if not run_truncate_sql(pg_url):
            return 1

    print("Pushing test data from data/test_dataset_15_accounts.xlsx ...")
    # Run push script
    import importlib.util
    push_path = BACKEND_DIR / "scripts" / "push_test_accounts_to_supabase.py"
    spec = importlib.util.spec_from_file_location("push_test_accounts_to_supabase", push_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.main()
    return 0


if __name__ == "__main__":
    sys.exit(main())
