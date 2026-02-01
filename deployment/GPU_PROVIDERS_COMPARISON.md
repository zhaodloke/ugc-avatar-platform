# Cloud GPU Providers for OmniAvatar

This document compares cloud GPU providers that can run OmniAvatar (requires 24GB+ VRAM).

## Quick Comparison

| Provider | A100 40GB | A100 80GB | H100 | API Type | Best For |
|----------|-----------|-----------|------|----------|----------|
| **Thunder Compute** | $0.66/hr | $0.78/hr | $1.47/hr | CLI-based | Interactive dev |
| **Vast.ai** | ~$1.00-1.50/hr | ~$1.50-2.00/hr | ~$2.50/hr | REST API | Flexible, marketplace |
| **RunPod** | $1.79/hr | $2.29/hr | $1.99/hr | REST API (Serverless) | Production, serverless |
| **Lambda Labs** | $1.29/hr | $1.79/hr | $2.49/hr | REST API | Reliability |
| **AWS** | ~$4.00/hr | ~$5.00/hr | ~$6.00/hr | Full SDK | Enterprise |
| **GCP** | ~$4.00/hr | ~$5.50/hr | ~$6.50/hr | Full SDK | Enterprise |

## Recommended Options

### 1. Thunder Compute (Cheapest) - $0.66-0.78/hr
**Best for**: Development and testing

Pros:
- Cheapest A100 pricing found (7× cheaper than GCP)
- Easy VS Code integration
- Pay-per-second billing
- Snapshot and hot-swap features

Cons:
- CLI-based (no REST API for automation)
- Beta platform, less mature
- Not ideal for automated serverless workloads

Setup:
```bash
# Install CLI
pip install tnr

# Login and create instance
tnr login
tnr create --gpu A100
```

### 2. Vast.ai (Best Value + API) - $1.00-2.00/hr
**Best for**: Cost-conscious production with API needs

Pros:
- Marketplace with competitive community pricing
- Full REST API and Python SDK
- Variety of GPU options
- Can filter by reliability, speed, location

Cons:
- Variable pricing (marketplace)
- Some hosts less reliable than others
- Requires instance management (not serverless)

Setup:
```bash
# Get API key from https://cloud.vast.ai/cli/
pip install vastai-sdk

# In .env
VASTAI_API_KEY=your-api-key
```

### 3. RunPod (Best for Production) - $1.79-2.29/hr
**Best for**: Production serverless workloads

Pros:
- True serverless (scale to zero)
- Simple REST API
- Pre-built templates
- Network volumes for model caching
- Good documentation

Cons:
- Higher price than Thunder/Vast
- Still cheaper than AWS/GCP

Setup:
```bash
# Get API key from https://runpod.io/console/user/settings
# Create serverless endpoint in console

# In .env
RUNPOD_API_KEY=your-api-key
RUNPOD_ENDPOINT_ID=your-endpoint-id
```

## Cost Estimate for OmniAvatar

Assuming ~60 seconds GPU time per video generation:

| Provider | Cost per Video |
|----------|----------------|
| Thunder Compute (A100 40GB) | ~$0.01 |
| Vast.ai (A100 40GB) | ~$0.02-0.03 |
| RunPod (A100 SXM) | ~$0.03 |
| Lambda Labs (A100 40GB) | ~$0.02 |
| AWS (A100) | ~$0.07 |

## Implementation Status

| Provider | Integration | Status |
|----------|-------------|--------|
| RunPod | `services/gpu_worker.py` | ✅ Ready |
| Replicate | `services/replicate_worker.py` | ✅ Ready (SadTalker, not OmniAvatar) |
| Vast.ai | `services/vastai_worker.py` | ⚠️ Partial (needs SSH automation) |
| Thunder Compute | Not implemented | ❌ CLI-only, no API |

## Recommendation

For your use case (OmniAvatar video generation):

1. **Development/Testing**: Use **Thunder Compute** ($0.66/hr) with manual CLI
2. **Production with OmniAvatar**: Use **RunPod Serverless** ($1.79/hr)
   - Already integrated in `gpu_worker.py`
   - True serverless, pay only when generating
   - Follow `deployment/RUNPOD_SETUP.md`

3. **Budget Production**: Use **Vast.ai** ($1.00-1.50/hr)
   - Requires more setup (SSH automation)
   - Can save ~40% vs RunPod

## Quick Start (RunPod - Recommended)

1. Sign up at https://runpod.io
2. Add credits ($10 minimum)
3. Create serverless endpoint with our Docker image
4. Add to `.env`:
   ```
   RUNPOD_API_KEY=your-key
   RUNPOD_ENDPOINT_ID=your-endpoint
   ```
5. Restart backend - videos will generate on real GPUs

## Sources

- [Thunder Compute Pricing](https://www.thundercompute.com/)
- [Vast.ai Documentation](https://docs.vast.ai/)
- [RunPod Documentation](https://docs.runpod.io/)
- [Lambda Labs Pricing](https://lambdalabs.com/service/gpu-cloud)
