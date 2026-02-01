"""
RunPod Handler for OmniAvatar Video Generation

This handler receives requests from the UGC Avatar Platform backend
and generates talking head videos using OmniAvatar by calling its inference script.
"""

import runpod
import base64
import os
import sys
import subprocess
import tempfile
import logging
import shutil
import yaml
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

print("="*50, flush=True)
print("OMNIAVATAR HANDLER STARTING", flush=True)
print("="*50, flush=True)

# Fix transformers version if needed
try:
    import transformers
    version = transformers.__version__
    print(f"Transformers version: {version}", flush=True)
    if version.startswith('5.'):
        print("Transformers 5.x detected - downgrading to 4.x...", flush=True)
        subprocess.run([sys.executable, '-m', 'pip', 'install', '--no-cache-dir', 'transformers>=4.36.0,<5.0.0'], check=True)
        print("Transformers downgrade complete", flush=True)
except Exception as e:
    print(f"Warning: Could not check/fix transformers version: {e}", flush=True)

logger.info("Initializing OmniAvatar RunPod Handler")

# Model paths - use /runpod-volume for serverless, fallback to /workspace for pods
VOLUME_PATH = '/runpod-volume' if os.path.exists('/runpod-volume') else '/workspace'

MODEL_PATHS = {
    'omniavatar': os.getenv('OMNIAVATAR_MODEL_PATH', f'{VOLUME_PATH}/models/OmniAvatar-14B'),
    'base_model': os.getenv('OMNIAVATAR_BASE_MODEL_PATH', f'{VOLUME_PATH}/models/Wan2.1-T2V-14B'),
    'wav2vec': os.getenv('WAV2VEC_MODEL_PATH', f'{VOLUME_PATH}/models/wav2vec2-base-960h'),
}

# OmniAvatar repo path
OMNIAVATAR_PATH = '/workspace/OmniAvatar'

logger.info(f"Using volume path: {VOLUME_PATH}")
logger.info(f"Model paths: {MODEL_PATHS}")
logger.info(f"OmniAvatar path: {OMNIAVATAR_PATH}")

# Check what exists at startup
def check_paths():
    """Check and log which paths exist"""
    logger.info("Checking paths...")

    for name, path in MODEL_PATHS.items():
        exists = os.path.exists(path)
        logger.info(f"  {name}: {path} - {'EXISTS' if exists else 'MISSING'}")
        if exists and os.path.isdir(path):
            try:
                files = os.listdir(path)[:5]
                logger.info(f"    Contents (first 5): {files}")
            except Exception as e:
                logger.info(f"    Could not list: {e}")

    if os.path.exists(OMNIAVATAR_PATH):
        logger.info(f"  OmniAvatar repo: EXISTS")
        try:
            files = os.listdir(OMNIAVATAR_PATH)
            logger.info(f"    Contents: {files}")
        except Exception as e:
            logger.info(f"    Could not list: {e}")
    else:
        logger.info(f"  OmniAvatar repo: MISSING")

check_paths()


def create_inference_config(temp_dir, settings=None):
    """Create a YAML config file for OmniAvatar inference with our model paths"""

    settings = settings or {}
    guidance_scale = settings.get('guidance_scale', 4.5)
    num_steps = settings.get('num_inference_steps', 50)

    base_model = MODEL_PATHS['base_model']

    # Build the config matching OmniAvatar's expected format
    config = {
        # Model paths - use our network volume paths
        'text_encoder_path': f"{base_model}/models_t5_umt5-xxl-enc-bf16.pth",
        'image_encoder_path': None,
        'dit_path': [
            f"{base_model}/diffusion_pytorch_model-00001-of-00006.safetensors",
            f"{base_model}/diffusion_pytorch_model-00002-of-00006.safetensors",
            f"{base_model}/diffusion_pytorch_model-00003-of-00006.safetensors",
            f"{base_model}/diffusion_pytorch_model-00004-of-00006.safetensors",
            f"{base_model}/diffusion_pytorch_model-00005-of-00006.safetensors",
            f"{base_model}/diffusion_pytorch_model-00006-of-00006.safetensors",
        ],
        'vae_path': f"{base_model}/Wan2.1_VAE.pth",
        'wav2vec_path': MODEL_PATHS['wav2vec'],
        'exp_path': MODEL_PATHS['omniavatar'],

        # Data settings
        'dtype': 'bf16',
        'max_hw': 720,
        'image_sizes_720': [[400, 720], [720, 720], [720, 400]],
        'image_sizes_1280': [[720, 1280], [1280, 720]],

        # Generation settings
        'seq_len': 200,
        'guidance_scale': guidance_scale,
        'num_steps': num_steps,
        'fps': 25,
        'sample_rate': 16000,
        'overlap_frame': 13,
        'max_tokens': 30000,

        # Output
        'save_dir': os.path.join(temp_dir, 'output'),

        # Negative prompt
        'negative_prompt': (
            "Vivid color tones, background/camera moving quickly, screen switching, "
            "subtitles and special effects, mutation, overexposed, static, blurred details, "
            "subtitles, style, work, painting, image, still, overall grayish, worst quality, "
            "low quality, JPEG compression residue, ugly, incomplete, extra fingers, "
            "poorly drawn hands, poorly drawn face, deformed, disfigured, malformed limbs, "
            "fingers merging, motionless image, chaotic background, three legs, "
            "crowded background with many people, walking backward"
        ),

        # Runtime settings
        'use_usp': False,
        'use_fsdp': False,
        'sp_size': 1,
        'infer': True,
    }

    config_path = os.path.join(temp_dir, 'inference_config.yaml')
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)

    logger.info(f"Created config file: {config_path}")
    return config_path


def generate_video(job):
    """
    Generate video from the job input

    Expected input format:
    {
        "reference_image": "base64_encoded_image",
        "audio": "base64_encoded_audio",
        "prompt": "Scene description",
        "emotion": "happy",
        "settings": {
            "guidance_scale": 4.5,
            "num_inference_steps": 50
        }
    }
    """

    try:
        job_input = job["input"]

        logger.info("Processing job input...")

        # Validate required inputs
        if 'reference_image' not in job_input:
            return {"status": "failed", "error": "Missing 'reference_image' in input"}
        if 'audio' not in job_input:
            return {"status": "failed", "error": "Missing 'audio' in input"}

        # Check if models exist
        missing_models = []
        for name, path in MODEL_PATHS.items():
            if not os.path.exists(path):
                missing_models.append(f"{name}: {path}")

        if missing_models:
            return {
                "status": "failed",
                "error": f"Models not found: {', '.join(missing_models)}. Please ensure models are downloaded to the network volume."
            }

        # Check if OmniAvatar repo exists
        if not os.path.exists(OMNIAVATAR_PATH):
            return {
                "status": "failed",
                "error": f"OmniAvatar repo not found at {OMNIAVATAR_PATH}"
            }

        # Create temp directory for this job
        with tempfile.TemporaryDirectory() as temp_dir:
            logger.info(f"Created temp directory: {temp_dir}")

            # Decode and save reference image
            logger.info("Decoding reference image...")
            image_data = base64.b64decode(job_input['reference_image'])
            image_path = os.path.join(temp_dir, 'reference.jpg')
            with open(image_path, 'wb') as f:
                f.write(image_data)
            logger.info(f"Saved image: {image_path} ({len(image_data)} bytes)")

            # Decode and save audio
            logger.info("Decoding audio...")
            audio_data = base64.b64decode(job_input['audio'])
            audio_path = os.path.join(temp_dir, 'audio.wav')
            with open(audio_path, 'wb') as f:
                f.write(audio_data)
            logger.info(f"Saved audio: {audio_path} ({len(audio_data)} bytes)")

            # Get parameters
            prompt = job_input.get('prompt', 'A person speaking naturally')
            settings = job_input.get('settings', {})

            # Output path
            output_dir = os.path.join(temp_dir, 'output')
            os.makedirs(output_dir, exist_ok=True)

            # Create inference sample file (format: prompt@@img_path@@audio_path)
            samples_file = os.path.join(temp_dir, 'samples.txt')
            with open(samples_file, 'w') as f:
                f.write(f"{prompt}@@{image_path}@@{audio_path}\n")
            logger.info(f"Created samples file: {samples_file}")

            # Create custom config file with our model paths
            config_path = create_inference_config(temp_dir, settings)

            # Build command to run OmniAvatar inference
            inference_script = os.path.join(OMNIAVATAR_PATH, 'scripts', 'inference.py')

            if not os.path.exists(inference_script):
                return {
                    "status": "failed",
                    "error": f"Inference script not found at {inference_script}"
                }

            # Set environment variables for model paths
            env = os.environ.copy()
            env['PYTHONPATH'] = f"{OMNIAVATAR_PATH}:{env.get('PYTHONPATH', '')}"

            # Prepare the command with correct arguments
            cmd = [
                sys.executable, inference_script,
                '--config', config_path,
                '--input_file', samples_file,
                '--infer',
            ]

            logger.info(f"Running inference command: {' '.join(cmd)}")

            # Run inference
            try:
                result = subprocess.run(
                    cmd,
                    env=env,
                    capture_output=True,
                    text=True,
                    timeout=600,  # 10 minute timeout
                    cwd=OMNIAVATAR_PATH
                )

                logger.info(f"Inference stdout: {result.stdout[-2000:] if len(result.stdout) > 2000 else result.stdout}")
                if result.stderr:
                    logger.warning(f"Inference stderr: {result.stderr[-2000:] if len(result.stderr) > 2000 else result.stderr}")

                if result.returncode != 0:
                    return {
                        "status": "failed",
                        "error": f"Inference failed with code {result.returncode}: {result.stderr[-500:]}"
                    }

            except subprocess.TimeoutExpired:
                return {
                    "status": "failed",
                    "error": "Inference timed out after 10 minutes"
                }
            except Exception as e:
                return {
                    "status": "failed",
                    "error": f"Failed to run inference: {str(e)}"
                }

            # Find output video
            output_videos = list(Path(output_dir).glob('*.mp4'))
            if not output_videos:
                # Also check for other video formats
                output_videos = list(Path(output_dir).glob('*.*'))
                logger.info(f"Files in output dir: {output_videos}")
                return {
                    "status": "failed",
                    "error": f"No video file found in output directory. Files found: {[str(f) for f in output_videos]}"
                }

            output_video = output_videos[0]
            logger.info(f"Found output video: {output_video}")

            # Read and encode video
            with open(output_video, 'rb') as f:
                video_bytes = f.read()

            video_b64 = base64.b64encode(video_bytes).decode('utf-8')
            video_size = len(video_bytes)

            logger.info(f"Video generated successfully: {video_size} bytes")

            return {
                "status": "success",
                "video": video_b64,
                "size_bytes": video_size
            }

    except Exception as e:
        logger.error(f"Video generation failed: {e}", exc_info=True)
        return {
            "status": "failed",
            "error": str(e)
        }


# Start the RunPod serverless handler
print("="*50, flush=True)
print("STARTING RUNPOD SERVERLESS HANDLER", flush=True)
print("="*50, flush=True)
logger.info("Starting RunPod serverless handler")

runpod.serverless.start({"handler": generate_video})

print("Handler started successfully", flush=True)
