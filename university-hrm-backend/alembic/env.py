# alembic/env.py  (key sections only — replace corresponding parts)

import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy.engine import Connection
from app.db.models import (
    user,
    department,
    role,
    leave_request,
    leave_policy,
    attendance,
    onboarding,
    payroll,
    performance,
    chat,
    audit_log,
    recruitment,
    announcement,
    notification,
    holiday,
    system_setting,
    enums,
    address,
    financial,
    employment,
    emergency_contact,
)
from alembic import context

# this is the Alembic Config object
config = context.config

fileConfig(config.config_file_name)

# Import your models' Base + all models so auto-detect works
from app.db.base import Base
from app.db.models import user, department, role  # adjust imports

target_metadata = Base.metadata

from app.core.config import settings

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url, 
        target_metadata=target_metadata, 
        literal_binds=True,
        include_object=include_object
    )
    with context.begin_transaction():
        context.run_migrations()

def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and reflected and compare_to is None:
        return False
    return True

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection, 
        target_metadata=target_metadata,
        include_object=include_object
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()