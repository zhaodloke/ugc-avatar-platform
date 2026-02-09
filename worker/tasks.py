from celery import Task
from .celery_app import celery_app
# Lazy import to avoid PyTorch loading issues on backend startup
# from .hunyuan_video_service import get_service
import logging
from pathlib import Path
import os
from datetime import datetime
import uuid
import traceback

def get_service():
    """Lazy import of HunyuanVideo service to avoid PyTorch loading on backend startup"""
    from .hunyuan_video_service import get_service as _get_service
    return _get_service()

# Database imports
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# Add backend and project root to path
project_root = Path(__file__).parent.parent
backend_path = project_root / 'backend'
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(backend_path))

from app.db.models import Video, VideoStatus
from services.storage import storage_service

logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ugc_avatars")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class VideoGenerationTask(Task):
    """Base task with error handling"""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """Handle task failure"""
        video_id = args[0]
        db = SessionLocal()
        try:
            video = db.query(Video).filter(Video.id == video_id).first()
            if video:
                video.status = VideoStatus.FAILED
                video.error_message = str(exc)
                db.commit()
        finally:
            db.close()

@celery_app.task(bind=True, base=VideoGenerationTask, name="worker.tasks.generate_video_task")
def generate_video_task(self, video_id: int):
    """
    Celery task to generate avatar video using HunyuanVideo-1.5

    Args:
        video_id: Database ID of video to generate
    """

    db = SessionLocal()

    try:
        # Get video from database
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise ValueError(f"Video {video_id} not found")

        # Update status
        video.status = VideoStatus.PROCESSING
        video.processing_started_at = datetime.utcnow()
        db.commit()

        logger.info(f"Processing video {video_id}")

        # Download reference image and audio from S3
        work_dir = Path(f"/tmp/video_{video_id}_{uuid.uuid4().hex[:8]}")
        work_dir.mkdir(parents=True, exist_ok=True)

        # Download files
        reference_image_path = work_dir / "reference.jpg"
        audio_path = work_dir / "audio.mp3"
        output_path = work_dir / "output.mp4"

        # Extract S3 keys from URLs
        ref_key = video.reference_image_url.split(f"{storage_service.bucket}/")[-1]
        audio_key = video.audio_url.split(f"{storage_service.bucket}/")[-1]

        # Download from S3
        with open(reference_image_path, 'wb') as f:
            f.write(storage_service.download_file(ref_key))

        with open(audio_path, 'wb') as f:
            f.write(storage_service.download_file(audio_key))

        logger.info(f"Downloaded input files for video {video_id}")

        # Enhance prompt with emotion and style
        enhanced_prompt = f"{video.prompt}. {video.emotion} emotion. {video.style} style."

        # Generate video
        service = get_service()

        settings = video.settings or {}
        num_inference_steps = settings.get('num_inference_steps', 50)
        num_frames = settings.get('num_frames', 129)

        metadata = service.generate(
            reference_image_path=str(reference_image_path),
            prompt=enhanced_prompt,
            output_path=str(output_path),
            num_inference_steps=num_inference_steps,
            num_frames=num_frames,
            seed=settings.get('seed'),
            resolution=settings.get('resolution', '720p'),
        )

        logger.info(f"Generated video for {video_id}")

        # Upload output video to S3
        with open(output_path, 'rb') as f:
            output_data = f.read()

        output_key = f"outputs/{video.user_id}/videos/{video_id}_{uuid.uuid4().hex[:8]}.mp4"
        output_url = storage_service.upload_file(output_data, output_key, "video/mp4")

        # TODO: Generate thumbnail
        # thumbnail_url = generate_thumbnail(output_path)

        # Get video duration
        import cv2
        cap = cv2.VideoCapture(str(output_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration = frame_count / fps if fps > 0 else 0
        cap.release()

        # Update database
        video.status = VideoStatus.COMPLETED
        video.output_video_url = output_url
        video.duration = duration
        video.processing_completed_at = datetime.utcnow()
        video.processing_time_seconds = (video.processing_completed_at - video.processing_started_at).total_seconds()
        db.commit()

        logger.info(f"Video {video_id} completed successfully")

        # Cleanup
        import shutil
        shutil.rmtree(work_dir, ignore_errors=True)

        return {
            "video_id": video_id,
            "status": "completed",
            "output_url": output_url,
            "duration": duration,
            "processing_time": video.processing_time_seconds
        }

    except Exception as e:
        logger.error(f"Error processing video {video_id}: {e}")
        logger.error(traceback.format_exc())

        video.status = VideoStatus.FAILED
        video.error_message = str(e)
        db.commit()

        raise

    finally:
        db.close()
