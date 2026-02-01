#!/bin/bash

# OmniAvatar Model Download Script
# This script downloads OmniAvatar models to the worker container

set -e

echo "Setting up OmniAvatar models..."

# Create model directory
mkdir -p /models

# Install huggingface-cli if not present
pip3 install -q huggingface_hub

# Download models
echo "Downloading Wan2.1-T2V-14B (base model)..."
huggingface-cli download Wan-AI/Wan2.1-T2V-14B --local-dir /models/Wan2.1-T2V-14B

echo "Downloading wav2vec2-base-960h..."
huggingface-cli download facebook/wav2vec2-base-960h --local-dir /models/wav2vec2-base-960h

echo "Downloading OmniAvatar-14B..."
huggingface-cli download OmniAvatar/OmniAvatar-14B --local-dir /models/OmniAvatar-14B

echo "Model download complete!"
echo "Models saved to /models/"
echo ""
echo "Model locations:"
echo "  - Wan2.1-T2V-14B: /models/Wan2.1-T2V-14B"
echo "  - wav2vec2: /models/wav2vec2-base-960h"
echo "  - OmniAvatar: /models/OmniAvatar-14B"
