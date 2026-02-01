FROM nvidia/cuda:12.4.0-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3.10 python3-pip git wget ffmpeg \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1 \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Install python deps
COPY runpod-handler/requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt

# Copy code
COPY runpod-handler /app/runpod-handler
COPY worker /app/worker
COPY backend /app/backend

# HunyuanVideo-1.5 code
RUN git clone https://github.com/Tencent-Hunyuan/HunyuanVideo-1.5.git /opt/HunyuanVideo-1.5 || true
RUN pip3 install --no-cache-dir -r /opt/HunyuanVideo-1.5/requirements.txt || true

ENV PYTHONPATH=/app:/app/backend:/opt/HunyuanVideo-1.5

CMD ["python3", "-u", "/app/runpod-handler/handler.py"]
