import os
from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

# Database Engine
database_url = settings.DATABASE_URL

# Provide support for async SQLite in unit tests if needed
is_sqlite = database_url.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    database_url,
    echo=False,
    connect_args=connect_args,
    future=True
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

def ensure_preference_columns(sync_conn):
    """Add new preference columns on existing databases (create_all will not alter)."""
    inspector = inspect(sync_conn)
    tables = inspector.get_table_names()
    if "user_preferences" not in tables:
        return
    existing = {col["name"] for col in inspector.get_columns("user_preferences")}
    for name in ("preferred_genres", "pacing_bands", "pacing_by_mode", "content_modes", "content_intent"):
        if name not in existing:
            sync_conn.execute(text(f"ALTER TABLE user_preferences ADD COLUMN {name} JSON"))


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
