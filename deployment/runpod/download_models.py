"""
Download OmniAvatar models from Hugging Face

This script downloads the required models for OmniAvatar video generation.
Run this during Docker build or on first startup.
"""

import os
from huggingface_hub import snapshot_download

# Model paths
MODELS_DIR = "/models"

MODELS = {
    "OmniAvatar-14B": "Wan-AI/Wan2.1-T2V-14B",  # Base model (OmniAvatar uses this)
    "wav2vec2-base-960h": "facebook/wav2vec2-base-960h",  # Audio processing
}


def download_models():
    """Download all required models"""
    os.makedirs(MODELS_DIR, exist_ok=True)

    for model_name, repo_id in MODELS.items():
        local_dir = os.path.join(MODELS_DIR, model_name)

        if os.path.exists(local_dir) and os.listdir(local_dir):
            print(f"[Models] {model_name} already exists, skipping...")
            continue

        print(f"[Models] Downloading {model_name} from {repo_id}...")

        try:
            snapshot_download(
                repo_id=repo_id,
                local_dir=local_dir,
                local_dir_use_symlinks=False,
            )
            print(f"[Models] {model_name} downloaded successfully")
        except Exception as e:
            print(f"[Models] Error downloading {model_name}: {e}")
            raise


if __name__ == "__main__":
    download_models()
