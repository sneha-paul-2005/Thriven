import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./thriven.db")

# Neon/Render sometimes hand out "postgres://", which SQLAlchemy rejects
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

_is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    pool_pre_ping=not _is_sqlite,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_startup_columns():
    """Add profile columns to an existing 'startups' table.
    Fresh databases get them from create_all, so this skips if the table is missing."""
    insp = inspect(engine)
    if "startups" not in insp.get_table_names():
        return
    existing = {c["name"] for c in insp.get_columns("startups")}
    wanted = ["first_name", "last_name", "company_name", "industry"]
    with engine.begin() as conn:
        for col in wanted:
            if col not in existing:
                conn.execute(text(f"ALTER TABLE startups ADD COLUMN {col} VARCHAR"))


ensure_startup_columns()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()