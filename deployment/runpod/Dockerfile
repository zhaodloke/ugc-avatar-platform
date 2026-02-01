FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV TORCH_CUDA_ARCH_LIST="8.0 8.6 8.9 9.0"

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    python3.10-venv \
    git \
    wget \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Set Python 3.10 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.10 1
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 1

# Create working directory
WORKDIR /app

# Install PyTorch with CUDA support first
RUN pip install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# Install all Python dependencies from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clone OmniAvatar repo for model code
RUN git clone https://github.com/Omni-Avatar/OmniAvatar.git /workspace/OmniAvatar || true

# Set Python path to include OmniAvatar
ENV PYTHONPATH=/workspace/OmniAvatar

# Copy worker code (handler.py should be copied from runpod-handler/ before building)
COPY handler.py .
COPY download_models.py .
COPY test_input.json .

# Set the entrypoint
CMD ["python", "-u", "handler.py"]
