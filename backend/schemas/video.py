from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
from app.db.models import VideoStatus, VideoTier

class VideoGenerationRequest(BaseModel):
    reference_image: str = Field(..., description="Base64 encoded image or S3 URL")

    # Audio options (one required)
    audio_file: Optional[str] = Field(None, description="Base64 encoded audio or S3 URL")
    text_input: Optional[str] = Field(None, description="Text for TTS generation")
    voice_id: Optional[str] = Field("default", description="Voice ID for TTS")

    # Scene control
    prompt: str = Field(..., description="Scene description: 'Happy customer in modern kitchen'")
    emotion: Optional[str] = Field("neutral", description="Emotion: happy, sad, excited, calm")
    style: Optional[str] = Field("testimonial", description="Style: podcast, interview, testimonial, demo")

    # Advanced settings
    tier: VideoTier = VideoTier.STANDARD
    num_inference_steps: Optional[int] = Field(50, ge=10, le=100)
    num_frames: Optional[int] = Field(129, ge=1, le=257)
    resolution: Optional[str] = Field("720p", description="Video resolution: 540p or 720p")
    seed: Optional[int] = Field(None, description="Seed for reproducibility")

    @validator('text_input', 'audio_file')
    def validate_audio_source(cls, v, values):
        if 'text_input' not in values and 'audio_file' not in values:
            raise ValueError('Either text_input or audio_file must be provided')
        return v

class VideoResponse(BaseModel):
    id: int
    user_id: str
    status: VideoStatus
    reference_image_url: str
    prompt: str
    output_video_url: Optional[str]
    thumbnail_url: Optional[str]
    duration: Optional[float]
    error_message: Optional[str]
    processing_time_seconds: Optional[float]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class VideoStatusResponse(BaseModel):
    id: int
    status: VideoStatus
    progress: int = Field(0, ge=0, le=100)
    message: Optional[str]
    output_video_url: Optional[str]
    error_message: Optional[str]
