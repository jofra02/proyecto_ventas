from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from functools import lru_cache
import os
import json

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
    DATABASE_URL: str | None = os.getenv("DATABASE_URL")
    
    # Partial DB Configs (Optional, for easy Docker setup)
    DB_TYPE: str = "sqlite" # postgres, mysql, etc.
    DB_HOST: str | None = None
    DB_PORT: int | None = 5432
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None
    DB_NAME: str | None = None

    @model_validator(mode="after")
    def assemble_db_connection(self) -> "Settings":
        if self.DATABASE_URL:
            return self
        
        if self.DB_TYPE == "sqlite":
            self.DATABASE_URL = f"sqlite+aiosqlite:///{self.DB_NAME or './sql_app.db'}"
        elif self.DB_TYPE == "postgres":
             self.DATABASE_URL = f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        # Add other types as needed
        return self

    # CORS
    BACKEND_CORS_ORIGINS: list[str] | str = []

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            # Manually parse JSON to ensure we return a list, 
            # as the type hint allows str which might confuse Pydantic
            return json.loads(v)
        elif isinstance(v, list):
            return v
        raise ValueError(v)

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
        "extra": "ignore" # Allow extra env vars
    }

@lru_cache()
def get_settings():
    return Settings()
