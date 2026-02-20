"""
SQLAlchemy Base and database setup.
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import DeclarativeBase

# Use new SQLAlchemy 2.0 style
class Base(DeclarativeBase):
    """Base class for all database models."""
    pass
