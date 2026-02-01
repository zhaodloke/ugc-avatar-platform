from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON, Enum as SQLEnum
from sqlalchemy.sql import func
from .database import Base
import enum

class VideoStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class VideoTier(str, enum.Enum):
    FREE = "free"
    STANDARD = "standard"
    PREMIUM = "premium"

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)

    # Input files
    reference_image_url = Column(String, nullable=False)
    audio_url = Column(String, nullable=True)

    # Generation parameters
    text_input = Column(Text, nullable=True)  # For TTS
    prompt = Column(Text, nullable=False)  # Scene description
    emotion = Column(String, nullable=True)  # happy, sad, neutral
    style = Column(String, nullable=True)  # podcast, interview, testimonial

    # Output
    output_video_url = Column(String, nullable=True)
    thumbnail_url = Column(String, nullable=True)
    duration = Column(Float, nullable=True)

    # Generation metadata
    status = Column(SQLEnum(VideoStatus), default=VideoStatus.PENDING)
    tier = Column(SQLEnum(VideoTier), default=VideoTier.STANDARD)
    celery_task_id = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)

    # Processing stats
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)
    processing_time_seconds = Column(Float, nullable=True)

    # Advanced settings
    settings = Column(JSON, nullable=True)  # sample_steps, guidance_scale, etc.

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Video(id={self.id}, status={self.status})>"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Credits/limits
    credits_remaining = Column(Integer, default=10)
    tier = Column(SQLEnum(VideoTier), default=VideoTier.FREE)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"
