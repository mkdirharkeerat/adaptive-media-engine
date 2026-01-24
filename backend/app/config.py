from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = ConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

    PROJECT_NAME: str = "Adaptive Media Recommendation"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # ML & Embedding Dimensions
    EMBEDDING_DIMENSION: int = 384

    # Security
    SECRET_KEY: str = "super-secret-adaptive-media-key-change-in-prod-123456789"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/adaptive_media_rec"
    
    # External APIs
    ANTHROPIC_API_KEY: Optional[str] = None
    TMDB_API_KEY: Optional[str] = None
    GOOGLE_BOOKS_API_KEY: Optional[str] = None
    STEAM_API_KEY: Optional[str] = None

settings = Settings()
