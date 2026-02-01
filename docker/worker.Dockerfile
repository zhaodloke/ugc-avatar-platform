FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

WORKDIR /app

# Install Python and system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    git \
    wget \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
COPY worker/requirements.txt ./worker-requirements.txt
RUN pip3 install --no-cache-dir -r worker-requirements.txt

# Clone OmniAvatar (or COPY if you have it locally)
RUN git clone https://github.com/Omni-Avatar/OmniAvatar.git /opt/OmniAvatar || true

# Copy worker code
COPY worker /app/worker
COPY backend /app/backend

# Set Python path (backend contains schemas and services)
ENV PYTHONPATH=/app:/app/backend:/opt/OmniAvatar

# Start Celery worker
CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info", "--concurrency=1"]
