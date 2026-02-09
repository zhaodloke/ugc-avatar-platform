"""
RunPod Handler for HunyuanVideo-1.5 Video Generation

This handler receives requests from the UGC Avatar Platform backend
and generates videos using HunyuanVideo-1.5.

Supports:
- Text-to-Video (T2V): prompt only
- Image-to-Video (I2V): prompt + reference image
"""

import runpod
import base64
import os
import sys
import tempfile
import logging
import torch
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Set CUDA memory config
if 'PYTORCH_CUDA_ALLOC_CONF' not in os.environ:
    os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'expandable_segments:True'

print("=" * 50, flush=True)
print("HUNYUANVIDEO-1.5 HANDLER STARTING", flush=True)
print("=" * 50, flush=True)

logger.info("Initializing HunyuanVideo-1.5 RunPod Handler")

# Model path - use /runpod-volume for serverless, fallback to /workspace
VOLUME_PATH = '/runpod-volume' if os.path.exists('/runpod-volume') else '/workspace'
MODEL_PATH = os.getenv('HUNYUAN_MODEL_PATH', f'{VOLUME_PATH}/models/hunyuan-video-1.5')
# HunyuanVideo-1.5 repo path: /opt in Docker image, /workspace as fallback
HUNYUAN_REPO_PATH = '/opt/HunyuanVideo-1.5' if os.path.exists('/opt/HunyuanVideo-1.5') else '/workspace/HunyuanVideo-1.5'

# Add HunyuanVideo-1.5 to Python path
if os.path.exists(HUNYUAN_REPO_PATH):
    sys.path.insert(0, HUNYUAN_REPO_PATH)

logger.info(f"Using volume path: {VOLUME_PATH}")
logger.info(f"Model path: {MODEL_PATH}")

# Global pipeline (lazy-loaded)
_pipe = None


def get_pipeline(task="t2v", resolution="720p"):
    """Get or initialize the HunyuanVideo-1.5 pipeline (singleton)."""
    global _pipe

    if _pipe is not None:
        return _pipe

    logger.info("Loading HunyuanVideo-1.5 pipeline...")

    from hyvideo.pipelines.hunyuan_video_pipeline import HunyuanVideo_1_5_Pipeline
    from hyvideo.commons.infer_state import initialize_infer_state

    use_cfg_distilled = os.getenv('HUNYUAN_USE_CFG_DISTILLED', 'true').lower() == 'true'
    use_sparse_attn = os.getenv('HUNYUAN_USE_SPARSE_ATTN', 'false').lower() == 'true'
    enable_cpu_offload = os.getenv('HUNYUAN_ENABLE_CPU_OFFLOAD', 'true').lower() == 'true'

    transformer_version = HunyuanVideo_1_5_Pipeline.get_transformer_version(
        resolution, task, use_cfg_distilled, False, use_sparse_attn
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    transformer_dtype = torch.bfloat16
    transformer_init_device = "cpu" if enable_cpu_offload else device

    _pipe = HunyuanVideo_1_5_Pipeline.create_pipeline(
        pretrained_model_name_or_path=MODEL_PATH,
        transformer_version=transformer_version,
        create_sr_pipeline=False,
        transformer_dtype=transformer_dtype,
        device=device,
        transformer_init_device=transformer_init_device,
    )

    # Apply optimizations
    infer_state = initialize_infer_state()

    enable_group_offloading = None
    if enable_cpu_offload:
        try:
            vram_gb = torch.cuda.get_device_properties(0).total_mem / (1024**3)
            if vram_gb < 24:
                enable_group_offloading = True
        except Exception:
            enable_group_offloading = True

    _pipe.apply_infer_optimization(
        infer_state=infer_state,
        enable_offloading=enable_cpu_offload,
        enable_group_offloading=enable_group_offloading,
        overlap_group_offloading=True,
    )

    logger.info("HunyuanVideo-1.5 pipeline loaded successfully")
    return _pipe


def check_paths():
    """Check and log which paths exist at startup."""
    logger.info("Checking paths...")
    logger.info(f"  Model path: {MODEL_PATH} - {'EXISTS' if os.path.exists(MODEL_PATH) else 'MISSING'}")
    logger.info(f"  HunyuanVideo repo: {HUNYUAN_REPO_PATH} - {'EXISTS' if os.path.exists(HUNYUAN_REPO_PATH) else 'MISSING'}")

    if os.path.exists(MODEL_PATH) and os.path.isdir(MODEL_PATH):
        try:
            files = os.listdir(MODEL_PATH)[:5]
            logger.info(f"    Contents (first 5): {files}")
        except Exception as e:
            logger.info(f"    Could not list: {e}")


check_paths()


def generate_video(job):
    """
    Generate video from the job input.

    Expected input format:
    {
        "reference_image": "base64_encoded_image",   # Optional (for I2V)
        "prompt": "Scene description",
        "settings": {
            "num_inference_steps": 50,
            "num_frames": 129,
            "resolution": "720p",
            "aspect_ratio": "16:9",
            "seed": 42,
            "use_cfg_distilled": true
        }
    }
    """
    import imageio

    try:
        job_input = job["input"]

        logger.info("Processing job input...")

        # Validate required inputs
        if 'prompt' not in job_input:
            return {"status": "failed", "error": "Missing 'prompt' in input"}

        # Check if model exists
        if not os.path.exists(MODEL_PATH):
            return {
                "status": "failed",
                "error": f"Model not found at {MODEL_PATH}. Please download HunyuanVideo-1.5 models."
            }

        # Check if HunyuanVideo repo exists
        if not os.path.exists(HUNYUAN_REPO_PATH):
            return {
                "status": "failed",
                "error": f"HunyuanVideo-1.5 repo not found at {HUNYUAN_REPO_PATH}"
            }

        # Extract parameters
        prompt = job_input.get('prompt', 'A person speaking naturally')
        settings = job_input.get('settings', {})
        num_inference_steps = settings.get('num_inference_steps', 50)
        num_frames = settings.get('num_frames', 129)
        resolution = settings.get('resolution', '720p')
        aspect_ratio = settings.get('aspect_ratio', '16:9')
        seed = settings.get('seed', 42)

        with tempfile.TemporaryDirectory() as temp_dir:
            logger.info(f"Created temp directory: {temp_dir}")

            # Decode reference image if provided (I2V mode)
            image_path = None
            if 'reference_image' in job_input and job_input['reference_image']:
                logger.info("Decoding reference image (I2V mode)...")
                image_data = base64.b64decode(job_input['reference_image'])
                image_path = os.path.join(temp_dir, 'reference.jpg')
                with open(image_path, 'wb') as f:
                    f.write(image_data)
                logger.info(f"Saved image: {image_path} ({len(image_data)} bytes)")

            task = "i2v" if image_path else "t2v"
            logger.info(f"Mode: {task.upper()}")

            # Get pipeline
            pipe = get_pipeline(task=task, resolution=resolution)

            # Build extra kwargs
            extra_kwargs = {}
            if image_path:
                from PIL import Image
                ref_image = Image.open(image_path).convert("RGB")
                extra_kwargs["reference_image"] = ref_image

            # Run inference
            logger.info(f"Running inference: {num_inference_steps} steps, {num_frames} frames")
            out = pipe(
                enable_sr=False,
                prompt=prompt,
                aspect_ratio=aspect_ratio,
                num_inference_steps=num_inference_steps,
                video_length=num_frames,
                negative_prompt="",
                seed=seed,
                output_type="pt",
                prompt_rewrite=False,
                **extra_kwargs,
            )

            # Extract video tensor
            if isinstance(out, dict):
                video_tensor = out.get("videos") or out.get("video")
            elif hasattr(out, "videos"):
                video_tensor = out.videos
            else:
                video_tensor = out

            if video_tensor is None:
                return {"status": "failed", "error": "Pipeline returned no video output"}

            # Convert to video file
            if video_tensor.dim() == 5:
                video_tensor = video_tensor[0]

            video_np = video_tensor.permute(1, 2, 3, 0).cpu().numpy()
            video_np = (video_np * 255).clip(0, 255).astype("uint8")

            output_path = os.path.join(temp_dir, 'output.mp4')
            imageio.mimwrite(output_path, video_np, fps=24, codec="libx264")

            logger.info(f"Video generated: {output_path}")

            # Read and encode video
            with open(output_path, 'rb') as f:
                video_bytes = f.read()

            video_b64 = base64.b64encode(video_bytes).decode('utf-8')
            video_size = len(video_bytes)
            duration = num_frames / 24.0

            logger.info(f"Video encoded: {video_size} bytes, {duration:.1f}s")

            return {
                "status": "success",
                "video": video_b64,
                "size_bytes": video_size,
                "duration": round(duration, 2),
                "mode": task,
                "model": "hunyuanvideo-1.5",
            }

    except Exception as e:
        logger.error(f"Video generation failed: {e}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e)
        }


# Start the RunPod serverless handler
print("=" * 50, flush=True)
print("STARTING RUNPOD SERVERLESS HANDLER", flush=True)
print("=" * 50, flush=True)
logger.info("Starting RunPod serverless handler")

runpod.serverless.start({"handler": generate_video})

print("Handler started successfully", flush=True)
