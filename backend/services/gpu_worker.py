"""
GPU Worker Service - Calls RunPod serverless endpoint for video generation

This service handles communication with the remote GPU worker that runs
HunyuanVideo-1.5 for generating talking head videos (T2V and I2V).
"""

import requests
import base64
import time
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class GPUWorkerService:
    """Service for calling remote GPU worker (RunPod)"""

    def __init__(self):
        self.runpod_api_key = getattr(settings, 'RUNPOD_API_KEY', None)
        self.runpod_endpoint_id = getattr(settings, 'RUNPOD_ENDPOINT_ID', None)
        self.base_url = f"https://api.runpod.ai/v2/{self.runpod_endpoint_id}"
        self.timeout = 300  # 5 minute timeout for video generation

    @property
    def is_configured(self) -> bool:
        """Check if RunPod is properly configured"""
        return bool(self.runpod_api_key and self.runpod_endpoint_id)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.runpod_api_key}",
            "Content-Type": "application/json"
        }

    def generate_video(
        self,
        reference_image: bytes,
        prompt: str,
        num_inference_steps: int = 50,
        num_frames: int = 129,
        resolution: str = "720p",
        aspect_ratio: str = "16:9",
        seed: int = 42,
    ) -> Dict[str, Any]:
        """
        Generate a video using HunyuanVideo-1.5 on RunPod.

        Args:
            reference_image: Image bytes (for I2V mode; omit for T2V)
            prompt: Scene description
            num_inference_steps: Denoising steps (default 50)
            num_frames: Number of frames (default 129, ~5.4s at 24fps)
            resolution: Video resolution (540p or 720p)
            aspect_ratio: Aspect ratio (16:9, 9:16, etc.)
            seed: Random seed for reproducibility

        Returns:
            Dict with video bytes and metadata
        """
        if not self.is_configured:
            raise ValueError("RunPod not configured. Set RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID")

        # Encode reference image as base64
        image_b64 = base64.b64encode(reference_image).decode('utf-8')

        # Prepare request payload (matches handler.py expected format)
        payload = {
            "input": {
                "reference_image": image_b64,
                "prompt": prompt,
                "settings": {
                    "num_inference_steps": num_inference_steps,
                    "num_frames": num_frames,
                    "resolution": resolution,
                    "aspect_ratio": aspect_ratio,
                    "seed": seed,
                }
            }
        }

        try:
            # Submit job to RunPod
            logger.info(f"[GPU] Submitting job to RunPod endpoint {self.runpod_endpoint_id}")
            response = requests.post(
                f"{self.base_url}/run",
                headers=self._get_headers(),
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            job_data = response.json()
            job_id = job_data.get("id")

            if not job_id:
                raise ValueError(f"No job ID returned: {job_data}")

            logger.info(f"[GPU] Job submitted: {job_id}")

            # Poll for completion
            return self._poll_job(job_id)

        except requests.exceptions.RequestException as e:
            logger.error(f"[GPU] Request failed: {e}")
            raise

    def _poll_job(self, job_id: str) -> Dict[str, Any]:
        """Poll RunPod job until completion"""
        start_time = time.time()

        while time.time() - start_time < self.timeout:
            try:
                response = requests.get(
                    f"{self.base_url}/status/{job_id}",
                    headers=self._get_headers(),
                    timeout=30
                )
                response.raise_for_status()
                status_data = response.json()

                status = status_data.get("status")
                logger.info(f"[GPU] Job {job_id} status: {status}")

                if status == "COMPLETED":
                    output = status_data.get("output", {})
                    if output.get("status") == "failed":
                        raise ValueError(f"Generation failed: {output.get('error')}")

                    # Decode video
                    video_b64 = output.get("video")
                    if video_b64:
                        video_bytes = base64.b64decode(video_b64)
                        return {
                            "video": video_bytes,
                            "duration": output.get("duration", 0),
                            "status": "success"
                        }
                    else:
                        raise ValueError("No video in response")

                elif status == "FAILED":
                    error = status_data.get("error", "Unknown error")
                    raise ValueError(f"Job failed: {error}")

                elif status in ["IN_QUEUE", "IN_PROGRESS"]:
                    time.sleep(2)  # Poll every 2 seconds
                    continue

                else:
                    logger.warning(f"[GPU] Unknown status: {status}")
                    time.sleep(2)

            except requests.exceptions.RequestException as e:
                logger.error(f"[GPU] Poll error: {e}")
                time.sleep(5)

        raise TimeoutError(f"Job {job_id} timed out after {self.timeout}s")

    def check_health(self) -> bool:
        """Check if the GPU worker endpoint is healthy"""
        if not self.is_configured:
            return False

        try:
            response = requests.get(
                f"{self.base_url}/health",
                headers=self._get_headers(),
                timeout=10
            )
            return response.status_code == 200
        except:
            return False


# Singleton instance
_gpu_worker: Optional[GPUWorkerService] = None


def get_gpu_worker() -> GPUWorkerService:
    """Get GPU worker service instance"""
    global _gpu_worker
    if _gpu_worker is None:
        _gpu_worker = GPUWorkerService()
    return _gpu_worker
