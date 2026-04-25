from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # --- Infos Projet ---
    PROJECT_NAME: str = "PulsePrice API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"

    # --- Database (Postgres) ---
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_HOST: str
    POSTGRES_PORT: int

    # --- Cache (Redis) ---
    REDIS_HOST: str
    REDIS_PORT: int

    # --- Security (JWT) ---
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int

    # --- External Services ---
    ANALYTICS_API_URL: str
    ANALYTICS_API_KEY: str

    # Configuration du chargeur
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# On crée l'instance unique
settings = Settings()