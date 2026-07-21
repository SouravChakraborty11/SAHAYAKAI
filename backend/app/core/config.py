import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "SAHAYAK AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    USE_POSTGRES: bool = False
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "sahayak"
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.USE_POSTGRES:
            return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return "sqlite+aiosqlite:///./sahayak.db"
    
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_REPLACE_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    GOOGLE_CLIENT_ID: str = "YOUR_GOOGLE_CLIENT_ID"
    GEMINI_API_KEY: str = "YOUR_GEMINI_API_KEY"

    # Google Cloud Storage settings
    GCS_BUCKET_NAME: str = "sahayak-app-storage"
    GCS_CREDENTIALS_FILE: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
