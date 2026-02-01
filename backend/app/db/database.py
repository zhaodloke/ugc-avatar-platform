from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from ..core.config import settings
import os

# Use SQLite for development if PostgreSQL is not available
def get_database_url():
    db_url = settings.DATABASE_URL

    # If PostgreSQL URL, try to connect; fall back to SQLite on failure
    if db_url.startswith("postgresql"):
        try:
            # Quick connection test
            test_engine = create_engine(db_url, pool_pre_ping=True)
            with test_engine.connect() as conn:
                pass
            print("[DATABASE] Using PostgreSQL")
            return db_url, False
        except Exception as e:
            print(f"[DATABASE] PostgreSQL unavailable ({e}), falling back to SQLite")
            # Create SQLite database in backend directory
            sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ugc_avatars.db")
            return f"sqlite:///{sqlite_path}", True

    return db_url, db_url.startswith("sqlite")

DATABASE_URL, IS_SQLITE = get_database_url()

# SQLite doesn't support pool_size/max_overflow
if IS_SQLITE:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}  # Needed for SQLite with FastAPI
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
