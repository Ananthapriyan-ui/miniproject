import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import config

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
db_url = config.settings.DATABASE_URL or os.getenv("DATABASE_URL")
if not db_url:
    if os.environ.get("VERCEL") == "1":
        db_url = "sqlite:////tmp/cloudvuln.db"
    else:
        db_url = f"sqlite:///{os.path.join(BASE_DIR, 'cloudvuln.db')}"

# Ensure parent directory exists for file-based SQLite database
if db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    if db_path and db_path != ":memory:":
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)

SQLALCHEMY_DATABASE_URL = db_url

# Optimized SQLite engine with WAL mode and connection pooling
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30,
    },
    # Use StaticPool for SQLite to avoid threading issues
    poolclass=StaticPool,
    echo=False,
)

# Enable WAL mode and performance PRAGMAs on every connection
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA cache_size=-64000")   # 64MB cache
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.close()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    """Dependency: yields a DB session per request, always closes on exit."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and perform safe schema migrations for missing columns."""
    from sqlalchemy import inspect
    import models
    models.Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        if "users" in tables:
            columns = [c["name"] for c in inspector.get_columns("users")]
            if "last_login" not in columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login DATETIME;"))
                conn.commit()

