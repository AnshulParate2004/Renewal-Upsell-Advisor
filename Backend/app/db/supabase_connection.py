"""
Helper to convert Supabase URL to PostgreSQL connection string.
"""
from app.core.config import settings
from urllib.parse import urlparse


def get_supabase_postgres_url() -> str:
    """
    Convert Supabase URL to PostgreSQL connection string.
    Supabase URL format: https://[project-ref].supabase.co
    PostgreSQL connection: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
    """
    if not settings.SUPABASE_URL:
        return None
    
    # Parse Supabase URL
    parsed = urlparse(settings.SUPABASE_URL)
    project_ref = parsed.netloc.split('.')[0]
    
    # Get password from service role key (first part before the dot)
    # Or use SUPABASE_DB_PASSWORD if set
    password = getattr(settings, 'SUPABASE_DB_PASSWORD', None)
    
    if not password:
        # Try to extract from service role key (not recommended, but works)
        # Better to set SUPABASE_DB_PASSWORD explicitly
        return None
    
    # Build PostgreSQL connection string
    postgres_url = f"postgresql://postgres:{password}@db.{project_ref}.supabase.co:5432/postgres"
    return postgres_url
