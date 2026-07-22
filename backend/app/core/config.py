from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration.

    Prototype:
        SQLite + Gemini

    Future:
        PostgreSQL
        Redis
        Google ADK
        Qdrant
    """

    PROJECT_NAME: str = "SAHAYAK AI API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str = "sqlite+aiosqlite:///./sahayak.db"

    SECRET_KEY: str = "CHANGE_THIS_TO_A_RANDOM_SECRET_KEY"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    GOOGLE_CLIENT_ID: str = ""

    GEMINI_API_KEY: str = ""

    GCS_BUCKET_NAME: str = "sahayak-documents"
    GCS_CREDENTIALS_FILE: str = ""

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return self.DATABASE_URL

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()