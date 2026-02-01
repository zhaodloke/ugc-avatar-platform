# Phase 7 & 8: OmniAvatar Setup Guide

This guide covers downloading OmniAvatar models and setting up the inference repository.

---

## Phase 7: Download OmniAvatar Models

### Overview

You need to download approximately **32GB** of model files:
- **Wan2.1-T2V-14B**: ~28GB (base text-to-video model)
- **wav2vec2-base-960h**: ~360MB (audio processing)
- **OmniAvatar-14B**: ~4GB (avatar generation weights)

### Prerequisites

- **Disk Space**: At least 50GB free
- **Internet**: Fast connection recommended (1-4 hours download time)
- **Hugging Face Account**: Optional (for faster downloads)

### Method 1: PowerShell Script (Windows - Recommended)

```powershell
cd C:\Users\loke_\Downloads\ugc-avatar-platform

# Run the download script
.\download_models.ps1
```

The script will:
1. Install Hugging Face CLI
2. Create `.\models\` directory
3. Download all three models
4. Verify downloads
5. Show file sizes

### Method 2: Manual Download (Any OS)

```bash
cd C:\Users\loke_\Downloads\ugc-avatar-platform

# Install Hugging Face CLI
pip install huggingface_hub

# Create models directory
mkdir -p models

# Download models (one at a time)
huggingface-cli download Wan-AI/Wan2.1-T2V-14B --local-dir ./models/Wan2.1-T2V-14B

huggingface-cli download facebook/wav2vec2-base-960h --local-dir ./models/wav2vec2-base-960h

huggingface-cli download OmniAvatar/OmniAvatar-14B --local-dir ./models/OmniAvatar-14B
```

### Method 3: Using Bash Script (Linux/WSL)

```bash
cd /c/Users/loke_/Downloads/ugc-avatar-platform

# Make script executable
chmod +x scripts/setup_omniavatar.sh

# Run script
./scripts/setup_omniavatar.sh
```

### Verify Downloads

Check that all models were downloaded:

```bash
ls -lh models/

# Expected output:
# Wan2.1-T2V-14B/     (~28GB)
# wav2vec2-base-960h/ (~360MB)
# OmniAvatar-14B/     (~4GB)
```

Verify specific files:

```bash
# Wan2.1 base model
ls models/Wan2.1-T2V-14B/

# OmniAvatar weights
ls models/OmniAvatar-14B/

# wav2vec model
ls models/wav2vec2-base-960h/
```

---

## Phase 8: Clone OmniAvatar Repository

### Step 1: Clone Repository

```bash
cd C:\Users\loke_\Downloads\ugc-avatar-platform

# Clone OmniAvatar from GitHub
git clone https://github.com/Omni-Avatar/OmniAvatar.git

# Navigate to repository
cd OmniAvatar
```

**Note:** If the repository doesn't exist or you get a 404 error, the project may be:
- Private (requires access)
- Renamed
- Not yet published

In this case, you'll need to:
1. Contact the OmniAvatar team for repository access
2. Use alternative installation methods
3. Build the inference wrapper based on their API documentation

### Step 2: Install OmniAvatar Dependencies

```bash
cd OmniAvatar

# Install requirements
pip install -r requirements.txt
```

### Step 3: Create Inference Wrapper

Since the OmniAvatar repository structure may vary, create a custom wrapper:

**File: `C:\Users\loke_\Downloads\ugc-avatar-platform\OmniAvatar\inference_wrapper.py`**

```python
import sys
import json
import torch
from pathlib import Path

# Load config from JSON file
config_path = sys.argv[1]
with open(config_path, 'r') as f:
    config = json.load(f)

# Import OmniAvatar inference
# Note: This assumes OmniAvatar has a generate_video function
# Adjust based on actual repository structure
try:
    from inference import generate_video
except ImportError:
    from omniavatar.inference import generate_video

# Generate video
result = generate_video(
    reference_image=config['reference_image'],
    audio=config['audio'],
    prompt=config['prompt'],
    output=config['output'],
    model_path=config['model_path'],
    base_model_path=config['base_model_path'],
    wav2vec_path=config['wav2vec_path'],
    sample_steps=config.get('sample_steps', 40),
    guidance_scale=config.get('guidance_scale', 7.5),
    seed=config.get('seed'),
)

# Output result as JSON
print(json.dumps(result))
```

### Step 4: Test OmniAvatar Setup

Create a test configuration:

```bash
cat > test_config.json << EOF
{
    "reference_image": "./test_files/person.jpg",
    "audio": "./test_files/speech.mp3",
    "prompt": "Happy person in modern office",
    "output": "./test_output.mp4",
    "model_path": "C:/Users/loke_/Downloads/ugc-avatar-platform/models/OmniAvatar-14B",
    "base_model_path": "C:/Users/loke_/Downloads/ugc-avatar-platform/models/Wan2.1-T2V-14B",
    "wav2vec_path": "C:/Users/loke_/Downloads/ugc-avatar-platform/models/wav2vec2-base-960h",
    "sample_steps": 40,
    "guidance_scale": 7.5
}
EOF
```

Test the wrapper:

```bash
python inference_wrapper.py test_config.json
```

---

## Alternative: Docker-Based Model Setup

If you prefer using Docker, the models can be mounted as volumes:

### Update docker-compose.yml:

The existing `docker-compose.yml` already includes model volume mounting:

```yaml
worker:
  volumes:
    - ../worker:/app/worker
    - model_cache:/models  # Models mounted here
```

### Download Models Inside Container:

```bash
# Start worker container
docker-compose -f docker/docker-compose.yml run worker bash

# Inside container
pip install huggingface_hub
huggingface-cli download Wan-AI/Wan2.1-T2V-14B --local-dir /models/Wan2.1-T2V-14B
huggingface-cli download facebook/wav2vec2-base-960h --local-dir /models/wav2vec2-base-960h
huggingface-cli download OmniAvatar/OmniAvatar-14B --local-dir /models/OmniAvatar-14B
```

---

## Troubleshooting

### Issue 1: Slow Download Speed

**Solution:**
- Use a VPN or different network
- Download models one at a time
- Use Hugging Face mirror sites
- Login to Hugging Face: `huggingface-cli login`

### Issue 2: Out of Disk Space

**Error:** `No space left on device`

**Solution:**
1. Check available space: `df -h`
2. Free up space or use external drive
3. Download models to different location:
   ```bash
   huggingface-cli download ... --local-dir /path/to/external/drive/models
   ```
4. Update `.env` with new paths

### Issue 3: Download Interrupted

**Solution:**
- Re-run the download command (it will resume)
- Hugging Face CLI supports resume by default

### Issue 4: Model Files Corrupted

**Solution:**
```bash
# Remove corrupted model
rm -rf models/MODEL_NAME

# Re-download
huggingface-cli download ... --local-dir ./models/MODEL_NAME
```

### Issue 5: OmniAvatar Repository Not Found

**Solution:**
1. Check if repository is public
2. Verify repository name: https://github.com/Omni-Avatar/OmniAvatar
3. Contact authors for access
4. Use alternative: Implement custom inference based on paper/documentation

---

## Verification Checklist

After completing Phase 7 & 8:

- [ ] Models directory exists: `C:\Users\loke_\Downloads\ugc-avatar-platform\models\`
- [ ] Wan2.1-T2V-14B downloaded (~28GB)
- [ ] wav2vec2-base-960h downloaded (~360MB)
- [ ] OmniAvatar-14B downloaded (~4GB)
- [ ] Total size approximately 32GB
- [ ] OmniAvatar repository cloned (if available)
- [ ] OmniAvatar dependencies installed
- [ ] Inference wrapper created
- [ ] Model paths in `.env` match downloaded locations

---

## Next Steps

After Phase 7 & 8:

1. **Test Worker**: Start Celery worker with GPU
2. **Generate Test Video**: Use API to create a test video
3. **Monitor Progress**: Check logs for generation progress
4. **Phase 9**: Optional frontend implementation
5. **Phase 10**: End-to-end testing

---

## Disk Space Planning

**Minimum Requirements:**
- Models: 32GB
- Docker volumes: 10GB
- Python environments: 5GB
- Generated videos: 10GB
- **Total**: ~60GB

**Recommended:**
- 100GB+ free space for comfortable operation
- SSD for better model loading performance
- Dedicated GPU with 24GB+ VRAM (RTX 4090, A100, etc.)

---

## Performance Notes

**Expected Performance (on A100 GPU):**
- Model loading: 30-60 seconds
- Video generation (10s clip): 2-5 minutes
- Video generation (30s clip): 5-15 minutes

**Memory Requirements:**
- GPU VRAM: 24GB+ recommended
- System RAM: 32GB+ recommended
- Models loaded in memory: ~30GB

---

## Quick Reference

**Model Locations (after download):**
```
C:\Users\loke_\Downloads\ugc-avatar-platform\models\
├── Wan2.1-T2V-14B/
├── wav2vec2-base-960h/
└── OmniAvatar-14B/
```

**Environment Variables (.env already configured):**
```
OMNIAVATAR_MODEL_PATH=/models/OmniAvatar-14B
OMNIAVATAR_BASE_MODEL_PATH=/models/Wan2.1-T2V-14B
WAV2VEC_MODEL_PATH=/models/wav2vec2-base-960h
```

**Download Script:**
- Windows: `.\download_models.ps1`
- Linux/WSL: `./scripts/setup_omniavatar.sh`
