# UGC Avatar Platform with OmniAvatar

AI-powered avatar video generation platform using OmniAvatar for full-body animations.

## Quick Start

1. **Install dependencies**:
   ```bash
   cd backend && python3.11 -m venv venv && source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Start services**:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d postgres redis minio
   ```

3. **Run backend**:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

4. **Download models** (50GB+):
   ```bash
   bash scripts/download_models.sh
   ```

5. **Start worker**:
   ```bash
   cd worker
   celery -A celery_app worker --loglevel=info
   ```

## Documentation

- Full integration guide: `OMNIAVATAR_INTEGRATION_GUIDE.md`
- Step-by-step instructions: `CLAUDE_CODE_INSTRUCTIONS.md`

## Architecture

```
Frontend (React) → FastAPI Backend → Celery Queue → OmniAvatar Worker → S3 Storage
                          ↓
                   PostgreSQL Database
```

## Features

- ✅ Full-body avatar animations
- ✅ Text-to-speech integration
- ✅ Scene control via prompts
- ✅ Emotion and style customization
- ✅ Async processing with Celery
- ✅ S3-compatible storage

## Tech Stack

- Backend: FastAPI + SQLAlchemy
- Queue: Celery + Redis
- Database: PostgreSQL
- Storage: S3 / MinIO
- AI: OmniAvatar (14B parameters)

## License

MIT
