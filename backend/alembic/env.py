from __future__ import annotations

import os
import sys
from pathlib import Path
from logging.config import fileConfig

from dotenv import load_dotenv
from sqlalchemy import engine_from_config, pool
from alembic import context


# ------------------------------------------------------------
# Ensure backend root is on sys.path so "import app..." works
# (env.py lives in backend/alembic/, so parent[1] == backend/)
# ------------------------------------------------------------
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


# ------------------------------------------------------------
# Alembic config
# ------------------------------------------------------------
config = context.config


# ------------------------------------------------------------
# Load .env and override sqlalchemy.url from env var
# (Prefer MIGRATION_DATABASE_URL for Alembic migrations)
# ------------------------------------------------------------
load_dotenv()
db_url = os.getenv("MIGRATION_DATABASE_URL") or os.getenv("DATABASE_URL")
if db_url:
    config.set_main_option("sqlalchemy.url", db_url)


# ------------------------------------------------------------
# Logging
# ------------------------------------------------------------
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# ------------------------------------------------------------
# Import models and set target_metadata for autogenerate
# IMPORTANT: we import the model module so SQLAlchemy "sees" it.
# ------------------------------------------------------------
from app.models.base import Base  # noqa: E402
from app.models.user import User  # noqa: F401, E402
from app.models.property import Property  # noqa: F401, E402

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
