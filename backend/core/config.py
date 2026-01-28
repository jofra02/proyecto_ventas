from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Enterprise ERP"
    API_V1_STR: str = "/api/v1"
    
    # SECURITY: Using os.getenv ensures secrets aren't hardcoded.
    # The default value is ONLY for local development.
    # In production, this MUST be set via environment variable.
    SECRET_KEY: str = os.getenv("SECRET_KEY", "WARNING_UNSECURE_DEV_KEY_CHANGE_ME_IMMEDIATELY")
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
    ALGORITHM: str = "HS256"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./production_erp.db")

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore" # Allow extra env vars
    }

@lru_cache()
def get_settings():
    return Settings()
