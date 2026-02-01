import torch
import os
from pathlib import Path
import logging
from typing import Optional, Dict
import json
import subprocess

logger = logging.getLogger(__name__)

class OmniAvatarGenerator:
    def __init__(
        self,
        model_path: str = "/models/OmniAvatar-14B",
        base_model_path: str = "/models/Wan2.1-T2V-14B",
        wav2vec_path: str = "/models/wav2vec2-base-960h",
        device: str = "cuda" if torch.cuda.is_available() else "cpu"
    ):
        self.model_path = model_path
        self.base_model_path = base_model_path
        self.wav2vec_path = wav2vec_path
        self.device = device

        logger.info(f"Initializing OmniAvatar on {device}")

        # Check model paths
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"OmniAvatar model not found at {model_path}")

        # Note: Actual model loading happens in generate() to save memory
        # Model is loaded on-demand

    def generate(
        self,
        reference_image_path: str,
        audio_path: str,
        prompt: str,
        output_path: str,
        sample_steps: int = 40,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
        resolution: str = "480p"
    ) -> Dict:
        """
        Generate avatar video using OmniAvatar

        Args:
            reference_image_path: Path to reference image
            audio_path: Path to audio file
            prompt: Text prompt describing the scene
            output_path: Path for output video
            sample_steps: Number of diffusion steps (10-100)
            guidance_scale: Guidance scale (1.0-20.0)
            seed: Random seed for reproducibility
            resolution: "480p" or "720p"

        Returns:
            Dict with generation metadata
        """

        try:
            logger.info(f"Generating video with prompt: {prompt}")

            # Prepare config
            config = {
                "reference_image": reference_image_path,
                "audio": audio_path,
                "prompt": prompt,
                "output": output_path,
                "sample_steps": sample_steps,
                "guidance_scale": guidance_scale,
                "seed": seed or torch.randint(0, 1000000, (1,)).item(),
                "resolution": resolution,
                "model_path": self.model_path,
                "base_model_path": self.base_model_path,
                "wav2vec_path": self.wav2vec_path
            }

            # Save config to temp file
            config_path = "/tmp/omniavatar_config.json"
            with open(config_path, 'w') as f:
                json.dump(config, f)

            # Call OmniAvatar inference script
            # This assumes you have a inference.py script from OmniAvatar
            cmd = [
                "python", "/opt/OmniAvatar/inference.py",
                "--config", config_path
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )

            logger.info("OmniAvatar generation completed")

            # Parse output
            metadata = {
                "success": True,
                "output_path": output_path,
                "seed": config["seed"],
                "sample_steps": sample_steps,
                "guidance_scale": guidance_scale
            }

            return metadata

        except subprocess.CalledProcessError as e:
            logger.error(f"OmniAvatar generation failed: {e.stderr}")
            raise RuntimeError(f"Video generation failed: {e.stderr}")
        except Exception as e:
            logger.error(f"Unexpected error in OmniAvatar generation: {e}")
            raise

# Singleton instance
_generator = None

def get_generator() -> OmniAvatarGenerator:
    global _generator
    if _generator is None:
        _generator = OmniAvatarGenerator()
    return _generator
