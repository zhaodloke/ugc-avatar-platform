"""
Replicate Worker Service - Calls Replicate API for video generation

Replicate hosts pre-trained models that can generate talking head videos.
This is the simplest and often cheapest option for video generation.
"""

import requests
import base64
import time
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

# Available talking head models on Replicate
MODELS = {
    # SadTalker - Good quality, fast
    "sadtalker": "cjwbw/sadtalker:3aa3dac9353cc4d6bd62a8f95957bd844003b401ca4e4a9b33baa574c549d376",
    # Wav2Lip - Fast lip sync
    "wav2lip": "devxpy/wav2lip:8d65e3f4f4298520e079198b493c25adfc43c058ffec924f2aaae99a16f1f3bf",
    # Video-retalking - High quality
    "video-retalking": "chenxwh/video-retalking:db5a650c807b007dc5f9e5abe27c53e1b62880d1f94d218d27ce7fa802711d67",
}

# Default model to use
DEFAULT_MODEL = "sadtalker"


class ReplicateWorkerService:
    """Service for calling Replicate API for video generation"""

    def __init__(self):
        self.api_token = getattr(settings, 'REPLICATE_API_TOKEN', None)
        self.base_url = "https://api.replicate.com/v1"
        self.timeout = 300  # 5 minute timeout
        self.model = MODELS.get(DEFAULT_MODEL)

    @property
    def is_configured(self) -> bool:
        """Check if Replicate is properly configured"""
        return bool(self.api_token)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Token {self.api_token}",
            "Content-Type": "application/json"
        }

    def generate_video(
        self,
        reference_image: bytes,
        audio_data: bytes,
        model: str = DEFAULT_MODEL,
    ) -> Dict[str, Any]:
        """
        Generate a talking head video using Replicate.

        Args:
            reference_image: Image bytes (face photo)
            audio_data: Audio bytes (speech)
            model: Model to use (sadtalker, wav2lip, video-retalking)

        Returns:
            Dict with video URL and metadata
        """
        if not self.is_configured:
            raise ValueError("Replicate not configured. Set REPLICATE_API_TOKEN in .env")

        # Get model version
        model_version = MODELS.get(model, MODELS[DEFAULT_MODEL])

        # Encode inputs as base64 data URIs
        image_b64 = base64.b64encode(reference_image).decode('utf-8')
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')

        # Detect image type
        if reference_image[:8] == b'\x89PNG\r\n\x1a\n':
            image_mime = "image/png"
        else:
            image_mime = "image/jpeg"

        # Detect audio type
        if audio_data[:4] == b'RIFF':
            audio_mime = "audio/wav"
        else:
            audio_mime = "audio/mpeg"

        image_uri = f"data:{image_mime};base64,{image_b64}"
        audio_uri = f"data:{audio_mime};base64,{audio_b64}"

        # Prepare input based on model
        if model == "sadtalker":
            input_data = {
                "source_image": image_uri,
                "driven_audio": audio_uri,
                "enhancer": "gfpgan",  # Face enhancement
            }
        elif model == "wav2lip":
            input_data = {
                "face": image_uri,
                "audio": audio_uri,
            }
        elif model == "video-retalking":
            input_data = {
                "face": image_uri,
                "input_audio": audio_uri,
            }
        else:
            input_data = {
                "source_image": image_uri,
                "driven_audio": audio_uri,
            }

        try:
            # Create prediction
            logger.info(f"[Replicate] Starting prediction with {model}")
            print(f"[Replicate] Starting prediction with {model}")

            response = requests.post(
                f"{self.base_url}/predictions",
                headers=self._get_headers(),
                json={
                    "version": model_version,
                    "input": input_data
                },
                timeout=30
            )
            response.raise_for_status()
            prediction = response.json()
            prediction_id = prediction.get("id")

            if not prediction_id:
                raise ValueError(f"No prediction ID returned: {prediction}")

            logger.info(f"[Replicate] Prediction started: {prediction_id}")
            print(f"[Replicate] Prediction started: {prediction_id}")

            # Poll for completion
            return self._poll_prediction(prediction_id)

        except requests.exceptions.RequestException as e:
            logger.error(f"[Replicate] Request failed: {e}")
            raise

    def _poll_prediction(self, prediction_id: str) -> Dict[str, Any]:
        """Poll Replicate prediction until completion"""
        start_time = time.time()
        poll_url = f"{self.base_url}/predictions/{prediction_id}"

        while time.time() - start_time < self.timeout:
            try:
                response = requests.get(
                    poll_url,
                    headers=self._get_headers(),
                    timeout=30
                )
                response.raise_for_status()
                prediction = response.json()

                status = prediction.get("status")
                logger.info(f"[Replicate] Prediction {prediction_id} status: {status}")

                if status == "succeeded":
                    output = prediction.get("output")

                    # Output format varies by model
                    if isinstance(output, str):
                        video_url = output
                    elif isinstance(output, dict):
                        video_url = output.get("video") or output.get("output")
                    elif isinstance(output, list) and len(output) > 0:
                        video_url = output[0]
                    else:
                        raise ValueError(f"Unexpected output format: {output}")

                    # Download the video
                    print(f"[Replicate] Downloading video from {video_url}")
                    video_response = requests.get(video_url, timeout=60)
                    video_response.raise_for_status()
                    video_bytes = video_response.content

                    return {
                        "video": video_bytes,
                        "video_url": video_url,
                        "status": "success"
                    }

                elif status == "failed":
                    error = prediction.get("error", "Unknown error")
                    raise ValueError(f"Prediction failed: {error}")

                elif status in ["starting", "processing"]:
                    time.sleep(2)
                    continue

                else:
                    logger.warning(f"[Replicate] Unknown status: {status}")
                    time.sleep(2)

            except requests.exceptions.RequestException as e:
                logger.error(f"[Replicate] Poll error: {e}")
                time.sleep(5)

        raise TimeoutError(f"Prediction {prediction_id} timed out after {self.timeout}s")

    def check_health(self) -> bool:
        """Check if Replicate API is accessible"""
        if not self.is_configured:
            return False

        try:
            response = requests.get(
                f"{self.base_url}/models",
                headers=self._get_headers(),
                timeout=10
            )
            return response.status_code == 200
        except:
            return False

    def get_available_models(self) -> Dict[str, str]:
        """Get list of available models"""
        return MODELS.copy()


# Singleton instance
_replicate_worker: Optional[ReplicateWorkerService] = None


def get_replicate_worker() -> ReplicateWorkerService:
    """Get Replicate worker service instance"""
    global _replicate_worker
    if _replicate_worker is None:
        _replicate_worker = ReplicateWorkerService()
    return _replicate_worker
