import asyncio
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# --- IMPORT DE TES MODÈLES ET CONFIG ---
from app.core.config import settings
from app.core.database import Base
from app.models.users import User, UserSession 
# ---------------------------------------

# Configuration de l'objet Alembic
config = context.config

# Setup du logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# On lie les métadonnées de nos modèles SQLAlchemy
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Mode hors ligne : génère le SQL sans se connecter à la DB."""
    url = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations() -> None:
    """Mode en ligne : crée l'engine et lance les migrations."""
    
    # On récupère la section de config et on injecte notre URL dynamique
    section = config.get_section(config.config_ini_section, {})
    section["sqlalchemy.url"] = f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"

    connectable = async_engine_from_config(
        section,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

def run_migrations_online() -> None:
    """Lancement de la boucle asynchrone pour les migrations."""
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()