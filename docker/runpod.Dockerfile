FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3.10 python3-pip git wget ffmpeg \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install runpod + your deps
COPY runpod-handler/requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# App code (only what the handler needs)
COPY runpod-handler /app/runpod-handler
COPY worker /app/worker
COPY backend /app/backend

# Clone OmniAvatar code (NOT weights)
RUN git clone https://github.com/Omni-Avatar/OmniAvatar.git /opt/OmniAvatar || true

ENV PYTHONPATH=/app:/app/backend:/opt/OmniAvatar

# Start RunPod serverless handler
CMD ["python3", "-u", "runpod-handler/handler.py"]
