# RunPod GPU Deployment Setup

This guide will help you set up a RunPod serverless endpoint to generate real talking head videos using OmniAvatar.

## Prerequisites

1. **RunPod Account**: Sign up at https://runpod.io
2. **RunPod API Key**: Get from https://runpod.io/console/user/settings
3. **Credits**: Add GPU credits to your account (~$0.50-2.00 per video generation)

## Step 1: Create a Serverless Endpoint

1. Go to https://runpod.io/console/serverless
2. Click **"New Endpoint"**
3. Configure:
   - **Name**: `omniavatar-generator`
   - **GPU Type**: RTX 4090 (24GB) or A100 (40GB/80GB)
   - **Container Image**: Use our pre-built image or build your own (see below)
   - **Min Workers**: 0 (scale to zero when not in use)
   - **Max Workers**: 3 (adjust based on expected traffic)

## Step 2: Build and Push Docker Image

### Option A: Use Pre-built Image (Recommended)
```bash
# Pull and use our pre-built image
docker pull ghcr.io/your-org/omniavatar-runpod:latest
```

### Option B: Build Your Own
```bash
cd deployment/runpod

# Build the image
docker build -t omniavatar-runpod:latest .

# Tag for your registry
docker tag omniavatar-runpod:latest your-registry/omniavatar-runpod:latest

# Push to registry
docker push your-registry/omniavatar-runpod:latest
```

## Step 3: Download OmniAvatar Models

The models need to be available to the worker. Options:

### Option A: Mount from RunPod Network Volume (Recommended)
1. Create a Network Volume in RunPod console
2. Download models to the volume:
   ```bash
   # OmniAvatar-14B (~28GB)
   huggingface-cli download OmniAvatar/OmniAvatar-14B --local-dir /models/OmniAvatar-14B

   # Wan2.1-T2V-14B base model (~28GB)
   huggingface-cli download Wan-AI/Wan2.1-T2V-14B --local-dir /models/Wan2.1-T2V-14B

   # Wav2Vec2 for audio processing (~400MB)
   huggingface-cli download facebook/wav2vec2-base-960h --local-dir /models/wav2vec2-base-960h
   ```
3. Attach volume to your endpoint

### Option B: Bake Models into Docker Image
Add to Dockerfile:
```dockerfile
RUN python download_models.py
```

## Step 4: Configure Your Backend

Add to your `.env` file:

```bash
# RunPod Configuration
RUNPOD_API_KEY=your-api-key-here
RUNPOD_ENDPOINT_ID=your-endpoint-id-here
```

Get the endpoint ID from the RunPod console after creating your endpoint.

## Step 5: Test the Setup

1. Restart your backend:
   ```bash
   cd backend
   .venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. The backend will now use RunPod for video generation instead of mock mode.

3. Generate a video through the frontend - you should see real avatar animation!

## Pricing Estimate

| GPU Type | Price/sec | ~30s Video Cost |
|----------|-----------|-----------------|
| RTX 4090 | $0.00044  | ~$0.50          |
| A100 40GB| $0.00076  | ~$0.90          |
| A100 80GB| $0.00139  | ~$1.70          |

## Troubleshooting

### "RunPod not configured" error
- Check that `RUNPOD_API_KEY` and `RUNPOD_ENDPOINT_ID` are set in `.env`
- Restart the backend after changing `.env`

### Timeout errors
- Increase `timeout` in `gpu_worker.py` (default 300s)
- Check RunPod console for worker logs

### Out of memory
- Use a GPU with more VRAM (A100 80GB recommended for 14B model)
- Reduce `num_inference_steps` in generation settings

### Model not found
- Ensure models are downloaded to the correct path
- Check volume mount in RunPod endpoint config

## Alternative: Local GPU Setup

If you have a local GPU (RTX 4090 or better):

1. Install CUDA 12.1+ and cuDNN
2. Download models to `C:\models\` (Windows) or `/models/` (Linux)
3. Install dependencies:
   ```bash
   pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
   pip install diffusers transformers accelerate
   ```
4. Run the Celery worker locally instead of using RunPod

## Support

For issues with:
- **RunPod**: https://docs.runpod.io or Discord
- **OmniAvatar model**: Check the model card on HuggingFace
- **This integration**: Open an issue in this repository
