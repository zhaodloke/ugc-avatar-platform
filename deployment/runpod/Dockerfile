FROM runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    wget \
    ffmpeg \
    libsm6 \
    libxext6 \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /app

# Install all Python dependencies from requirements.txt
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Clone HunyuanVideo-1.5 repo to /opt (NOT /workspace, which is the volume mount point)
RUN git clone https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5.git /opt/HunyuanVideo-1.5 || true

# Install HunyuanVideo-1.5 dependencies
RUN pip install --no-cache-dir -r /opt/HunyuanVideo-1.5/requirements.txt || true

# Set Python path to include HunyuanVideo-1.5
ENV PYTHONPATH=/opt/HunyuanVideo-1.5

# Copy worker code
COPY handler.py .
COPY download_models.py .
COPY test_input.json .

# Set the entrypoint
CMD ["python", "-u", "handler.py"]
