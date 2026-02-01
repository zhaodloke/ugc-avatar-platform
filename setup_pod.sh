#!/bin/bash
# Setup script for RunPod Pod - OmniAvatar
# Run this script on your RunPod Pod via SSH or web terminal

set -e  # Exit on error

echo "=========================================="
echo "OmniAvatar Pod Setup Script"
echo "=========================================="
echo ""

# 1. Install system dependencies
echo "[1/6] Installing system dependencies..."
apt-get update
apt-get install -y ffmpeg git libsndfile1

# 2. Clone OmniAvatar repository
echo "[2/6] Cloning OmniAvatar repository..."
if [ ! -d "/workspace/OmniAvatar" ]; then
    git clone https://github.com/Omni-Avatar/OmniAvatar.git /workspace/OmniAvatar
else
    echo "OmniAvatar already cloned, skipping..."
fi

# 3. Install Python dependencies
echo "[3/6] Installing Python dependencies..."
pip install --no-cache-dir \
    runpod \
    huggingface_hub \
    librosa==0.10.2.post1 \
    tqdm \
    peft==0.15.1 \
    transformers==4.52.3 \
    scipy==1.14.0 \
    numpy==1.26.4 \
    ftfy \
    einops

# Install xfuser without dependencies
pip install --no-cache-dir --no-deps xfuser==0.4.1

# 4. Create models directory
echo "[4/6] Creating models directory..."
mkdir -p /workspace/models

# 5. Set environment variables
echo "[5/6] Setting environment variables..."
export PYTHONUNBUFFERED=1
export OMNIAVATAR_MODEL_PATH=/workspace/models/OmniAvatar-14B
export OMNIAVATAR_BASE_MODEL_PATH=/workspace/models/Wan2.1-T2V-14B
export WAV2VEC_MODEL_PATH=/workspace/models/wav2vec2-base-960h
export TEXT_ENCODER_PATH=/workspace/models/Wan2.1-T2V-14B/models_t5_umt5-xxl-enc-bf16.pth
export VAE_PATH=/workspace/models/Wan2.1-T2V-14B/Wan2.1_VAE.pth
export PYTHONPATH=/workspace/OmniAvatar:$PYTHONPATH

# Add to bashrc for persistence
cat >> ~/.bashrc <<'EOF'
export PYTHONUNBUFFERED=1
export OMNIAVATAR_MODEL_PATH=/workspace/models/OmniAvatar-14B
export OMNIAVATAR_BASE_MODEL_PATH=/workspace/models/Wan2.1-T2V-14B
export WAV2VEC_MODEL_PATH=/workspace/models/wav2vec2-base-960h
export TEXT_ENCODER_PATH=/workspace/models/Wan2.1-T2V-14B/models_t5_umt5-xxl-enc-bf16.pth
export VAE_PATH=/workspace/models/Wan2.1-T2V-14B/Wan2.1_VAE.pth
export PYTHONPATH=/workspace/OmniAvatar:$PYTHONPATH
EOF

# 6. Download models from Hugging Face
echo "[6/6] Downloading models from Hugging Face..."
echo "This will take 10-20 minutes (67GB total)..."

cd /workspace
python3 << 'PYTHON_SCRIPT'
import os
from huggingface_hub import snapshot_download
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODELS = [
    ("facebook/wav2vec2-base-960h", "/workspace/models/wav2vec2-base-960h"),
    ("Omni-Avatar/OmniAvatar-14B", "/workspace/models/OmniAvatar-14B"),
    ("Wan-AI/Wan2.1-T2V-14B", "/workspace/models/Wan2.1-T2V-14B")
]

os.makedirs("/workspace/models", exist_ok=True)

for repo_id, local_dir in MODELS:
    model_name = repo_id.split('/')[-1]

    if os.path.exists(local_dir) and len(os.listdir(local_dir)) > 0:
        logger.info(f"✓ Model {model_name} already exists")
        continue

    logger.info(f"⬇ Downloading {model_name} from {repo_id}...")
    try:
        snapshot_download(
            repo_id=repo_id,
            local_dir=local_dir,
            resume_download=True,
            max_workers=4
        )
        logger.info(f"✓ Downloaded {model_name}")
    except Exception as e:
        logger.error(f"✗ Failed to download {model_name}: {e}")
        raise

print("\n✓ All models ready!")
PYTHON_SCRIPT

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Models are stored in: /workspace/models"
echo "OmniAvatar code is in: /workspace/OmniAvatar"
echo ""
echo "Next steps:"
echo "1. Copy your handler.py to /workspace/"
echo "2. Run: python3 /workspace/handler.py"
echo ""
