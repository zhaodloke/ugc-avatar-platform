"""
Vast.ai GPU Worker Service - Calls Vast.ai marketplace for video generation

Vast.ai is a GPU cloud marketplace with competitive pricing:
- A100 40GB: ~$1.00-1.50/hr (community)
- A100 80GB: ~$1.50-2.00/hr (community)
- Datacenter options available for higher reliability

This service creates on-demand instances for OmniAvatar video generation.
"""

import requests
import base64
import time
import logging
import json
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)

# Vast.ai API base URL
VASTAI_API_URL = "https://console.vast.ai/api/v0"


class VastAIWorkerService:
    """Service for running OmniAvatar on Vast.ai GPU instances"""

    def __init__(self):
        self.api_key = getattr(settings, 'VASTAI_API_KEY', None)
        self.timeout = 600  # 10 minute timeout for video generation
        self.docker_image = "pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime"

    @property
    def is_configured(self) -> bool:
        """Check if Vast.ai is properly configured"""
        return bool(self.api_key)

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _api_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Make authenticated API request to Vast.ai"""
        url = f"{VASTAI_API_URL}/{endpoint}"
        params = {"api_key": self.api_key}

        try:
            if method == "GET":
                response = requests.get(url, headers=self._get_headers(), params=params, timeout=30)
            elif method == "POST":
                response = requests.post(url, headers=self._get_headers(), params=params, json=data, timeout=30)
            elif method == "PUT":
                response = requests.put(url, headers=self._get_headers(), params=params, json=data, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=self._get_headers(), params=params, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")

            response.raise_for_status()
            return response.json() if response.text else {}

        except requests.exceptions.RequestException as e:
            logger.error(f"[Vast.ai] API request failed: {e}")
            raise

    def search_offers(
        self,
        gpu_name: str = "RTX_4090",
        min_gpu_ram: int = 24,
        num_gpus: int = 1,
        max_price: float = 2.0,
    ) -> List[Dict]:
        """
        Search for available GPU offers on Vast.ai marketplace

        Args:
            gpu_name: GPU model (RTX_4090, A100_PCIE, A100_SXM4, H100_PCIE, etc.)
            min_gpu_ram: Minimum GPU RAM in GB
            num_gpus: Number of GPUs needed
            max_price: Maximum price per hour in USD

        Returns:
            List of available offers sorted by price
        """
        if not self.is_configured:
            raise ValueError("Vast.ai not configured. Set VASTAI_API_KEY in .env")

        # Build search query
        # Vast.ai uses a query language for filtering
        query = {
            "verified": {"eq": True},  # Only verified/reliable hosts
            "rentable": {"eq": True},
            "num_gpus": {"gte": num_gpus},
            "gpu_ram": {"gte": min_gpu_ram * 1024},  # Convert to MB
            "dph_total": {"lte": max_price},  # Price per hour
            "cuda_vers": {"gte": 12.0},  # CUDA 12+ for modern PyTorch
            "inet_down": {"gte": 100},  # At least 100 Mbps download
            "reliability2": {"gte": 0.9},  # 90%+ reliability
        }

        # Add GPU name filter if specified
        if gpu_name:
            query["gpu_name"] = {"eq": gpu_name}

        try:
            # Search offers endpoint
            response = self._api_request("GET", f"bundles?q={json.dumps(query)}")
            offers = response.get("offers", [])

            # Sort by price
            offers.sort(key=lambda x: x.get("dph_total", float("inf")))

            logger.info(f"[Vast.ai] Found {len(offers)} matching GPU offers")
            return offers[:10]  # Return top 10 cheapest

        except Exception as e:
            logger.error(f"[Vast.ai] Search failed: {e}")
            raise

    def create_instance(
        self,
        offer_id: int,
        docker_image: str = None,
        disk_gb: int = 50,
        onstart_cmd: str = None,
    ) -> Dict:
        """
        Create a GPU instance from an offer

        Args:
            offer_id: ID of the offer to rent
            docker_image: Docker image to use
            disk_gb: Disk space in GB
            onstart_cmd: Command to run on instance start

        Returns:
            Instance details including ID
        """
        if not self.is_configured:
            raise ValueError("Vast.ai not configured. Set VASTAI_API_KEY in .env")

        data = {
            "client_id": "me",
            "image": docker_image or self.docker_image,
            "disk": disk_gb,
            "runtype": "ssh",  # SSH access
        }

        if onstart_cmd:
            data["onstart"] = onstart_cmd

        try:
            response = self._api_request("PUT", f"asks/{offer_id}/", data)
            instance_id = response.get("new_contract")

            logger.info(f"[Vast.ai] Created instance {instance_id} from offer {offer_id}")
            return {"instance_id": instance_id, **response}

        except Exception as e:
            logger.error(f"[Vast.ai] Instance creation failed: {e}")
            raise

    def get_instance(self, instance_id: int) -> Dict:
        """Get instance details"""
        if not self.is_configured:
            raise ValueError("Vast.ai not configured. Set VASTAI_API_KEY in .env")

        try:
            response = self._api_request("GET", f"instances/{instance_id}/")
            return response
        except Exception as e:
            logger.error(f"[Vast.ai] Get instance failed: {e}")
            raise

    def destroy_instance(self, instance_id: int) -> bool:
        """Destroy/terminate an instance"""
        if not self.is_configured:
            raise ValueError("Vast.ai not configured. Set VASTAI_API_KEY in .env")

        try:
            self._api_request("DELETE", f"instances/{instance_id}/")
            logger.info(f"[Vast.ai] Destroyed instance {instance_id}")
            return True
        except Exception as e:
            logger.error(f"[Vast.ai] Destroy instance failed: {e}")
            return False

    def generate_video(
        self,
        reference_image: bytes,
        audio_data: bytes,
        prompt: str = "",
        emotion: str = "neutral",
        guidance_scale: float = 7.5,
        num_inference_steps: int = 40,
    ) -> Dict[str, Any]:
        """
        Generate a talking head video using Vast.ai GPU

        This is a higher-level method that:
        1. Finds the cheapest available A100/4090 GPU
        2. Creates an instance
        3. Uploads data and runs OmniAvatar
        4. Downloads result
        5. Destroys instance

        Args:
            reference_image: Image bytes (face photo)
            audio_data: Audio bytes (speech)
            prompt: Scene description
            emotion: Emotion for the avatar
            guidance_scale: CFG scale
            num_inference_steps: Number of denoising steps

        Returns:
            Dict with video bytes and metadata
        """
        if not self.is_configured:
            raise ValueError("Vast.ai not configured. Set VASTAI_API_KEY in .env")

        instance_id = None

        try:
            # Step 1: Find cheapest suitable GPU
            logger.info("[Vast.ai] Searching for available GPUs...")
            print("[Vast.ai] Searching for available GPUs...")

            # Try A100 first, fall back to RTX 4090
            offers = []
            for gpu in ["A100_PCIE", "A100_SXM4", "RTX_4090"]:
                try:
                    offers = self.search_offers(
                        gpu_name=gpu,
                        min_gpu_ram=24,
                        max_price=3.0
                    )
                    if offers:
                        break
                except:
                    continue

            if not offers:
                raise ValueError("No suitable GPU offers found on Vast.ai")

            best_offer = offers[0]
            offer_id = best_offer.get("id")
            price = best_offer.get("dph_total", 0)
            gpu_name = best_offer.get("gpu_name", "Unknown")

            logger.info(f"[Vast.ai] Best offer: {gpu_name} at ${price:.2f}/hr (ID: {offer_id})")
            print(f"[Vast.ai] Best offer: {gpu_name} at ${price:.2f}/hr")

            # Step 2: Create instance with OmniAvatar setup script
            onstart_script = """
#!/bin/bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install diffusers transformers accelerate flask
# Download models (cached if using persistent storage)
python -c "from huggingface_hub import snapshot_download; snapshot_download('OmniAvatar/OmniAvatar-14B', local_dir='/models/OmniAvatar-14B')"
# Start simple HTTP server for receiving jobs
python /workspace/server.py &
"""

            logger.info("[Vast.ai] Creating GPU instance...")
            print("[Vast.ai] Creating GPU instance...")

            result = self.create_instance(
                offer_id=offer_id,
                docker_image="pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime",
                disk_gb=100,  # Need space for models
                onstart_cmd=onstart_script
            )

            instance_id = result.get("instance_id")
            if not instance_id:
                raise ValueError(f"Failed to create instance: {result}")

            logger.info(f"[Vast.ai] Instance created: {instance_id}")
            print(f"[Vast.ai] Instance created: {instance_id}")

            # Step 3: Wait for instance to be ready
            logger.info("[Vast.ai] Waiting for instance to be ready...")
            print("[Vast.ai] Waiting for instance to be ready...")

            start_time = time.time()
            ssh_host = None
            ssh_port = None

            while time.time() - start_time < 300:  # 5 min timeout for startup
                instance = self.get_instance(instance_id)
                status = instance.get("actual_status", "")

                if status == "running":
                    ssh_host = instance.get("ssh_host")
                    ssh_port = instance.get("ssh_port")
                    if ssh_host and ssh_port:
                        break

                time.sleep(10)

            if not ssh_host:
                raise TimeoutError("Instance failed to start within 5 minutes")

            logger.info(f"[Vast.ai] Instance ready at {ssh_host}:{ssh_port}")
            print(f"[Vast.ai] Instance ready at {ssh_host}:{ssh_port}")

            # Step 4: Run video generation
            # For simplicity, we'll use the RunPod-style HTTP approach
            # In production, you'd SSH in and run commands directly

            # Encode data
            image_b64 = base64.b64encode(reference_image).decode('utf-8')
            audio_b64 = base64.b64encode(audio_data).decode('utf-8')

            # This is a simplified version - in production you'd:
            # 1. SCP the files to the instance
            # 2. SSH and run the generation script
            # 3. SCP the result back

            # For now, simulate with a placeholder
            # Real implementation would use paramiko for SSH
            logger.warning("[Vast.ai] Full SSH-based generation not yet implemented")
            logger.warning("[Vast.ai] Use RunPod serverless for production workloads")

            raise NotImplementedError(
                "Vast.ai SSH-based generation requires additional setup. "
                "For immediate use, configure RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID "
                "for serverless video generation, or use REPLICATE_API_TOKEN for "
                "pre-hosted models (SadTalker/Wav2Lip, not OmniAvatar)."
            )

        except Exception as e:
            logger.error(f"[Vast.ai] Video generation failed: {e}")
            raise

        finally:
            # Always clean up instance
            if instance_id:
                logger.info(f"[Vast.ai] Cleaning up instance {instance_id}")
                self.destroy_instance(instance_id)

    def check_health(self) -> bool:
        """Check if Vast.ai API is accessible"""
        if not self.is_configured:
            return False

        try:
            # Try to get user info
            response = self._api_request("GET", "users/current/")
            return "id" in response
        except:
            return False

    def get_balance(self) -> float:
        """Get account balance"""
        if not self.is_configured:
            return 0.0

        try:
            response = self._api_request("GET", "users/current/")
            return float(response.get("balance", 0))
        except:
            return 0.0


# Singleton instance
_vastai_worker: Optional[VastAIWorkerService] = None


def get_vastai_worker() -> VastAIWorkerService:
    """Get Vast.ai worker service instance"""
    global _vastai_worker
    if _vastai_worker is None:
        _vastai_worker = VastAIWorkerService()
    return _vastai_worker
