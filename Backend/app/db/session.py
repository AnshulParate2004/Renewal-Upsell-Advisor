"""
Database session management.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

# Determine database URL
# Priority: DATABASE_URL > Supabase PostgreSQL > SQLite
database_url = settings.DATABASE_URL

if not database_url and settings.SUPABASE_URL:
    # Try to build PostgreSQL connection from Supabase URL
    # Supabase PostgreSQL connection format:
    # postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
    try:
        from urllib.parse import urlparse
        parsed = urlparse(settings.SUPABASE_URL)
        project_ref = parsed.netloc.split('.')[0]
        
        # Get password from environment (should be set in .env)
        # You can find this in Supabase Dashboard > Settings > Database > Connection string
        supabase_db_password = getattr(settings, 'SUPABASE_DB_PASSWORD', None)
        
        if supabase_db_password:
            database_url = f"postgresql://postgres:{supabase_db_password}@db.{project_ref}.supabase.co:5432/postgres"
        else:
            # Fallback: try to use SUPABASE_URL directly if it's already a postgresql:// URL
            if settings.SUPABASE_URL.startswith('postgresql://'):
                database_url = settings.SUPABASE_URL
    except Exception as e:
        print(f"Warning: Could not build Supabase PostgreSQL URL: {e}")

# Default to SQLite if no database URL is configured
if not database_url:
    database_url = "sqlite:///./app.db"

# Create database engine
is_sqlite = "sqlite" in database_url
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables."""
    Base.metadata.create_all(bind=engine)
