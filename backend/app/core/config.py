from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # App
    APP_NAME: str = "UGC Avatar Platform"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ugc_avatars"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Storage
    S3_BUCKET: str = "ugc-avatars"
    S3_ENDPOINT: Optional[str] = None  # Internal: http://minio:9000 (for Docker)
    S3_PUBLIC_ENDPOINT: Optional[str] = None  # External: http://localhost:9000 (for browser)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    # Public Base URL (for building absolute asset URLs)
    PUBLIC_BASE_URL: Optional[str] = "http://localhost:8000"
    # File Upload
    MAX_IMAGE_SIZE: int = 10 * 1024 * 1024  # 10MB
    MAX_AUDIO_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_IMAGE_TYPES: list = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_AUDIO_TYPES: list = ["audio/mpeg", "audio/wav", "audio/ogg"]

    # HunyuanVideo-1.5
    HUNYUAN_MODEL_PATH: str = "/runpod-volume/models/hunyuan-video-1.5"
    HUNYUAN_RESOLUTION: str = "720p"
    HUNYUAN_USE_CFG_DISTILLED: bool = True

    # TTS
    ELEVENLABS_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None

    # Video Generation
    MAX_VIDEO_DURATION: int = 30  # seconds
    DEFAULT_FPS: int = 30
    VIDEO_RESOLUTION: str = "480p"  # 480p or 720p

    # RunPod GPU Worker (for cloud-based video generation)
    RUNPOD_API_KEY: Optional[str] = None
    RUNPOD_ENDPOINT_ID: Optional[str] = None

    # Replicate (simplest cloud GPU option)
    REPLICATE_API_TOKEN: Optional[str] = None

    # Vast.ai GPU Marketplace (competitive pricing for A100/H100)
    VASTAI_API_KEY: Optional[str] = None

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    class Config:
        env_file = "../.env"  # Look in project root
        case_sensitive = True
        extra = "ignore"

settings = Settings()
