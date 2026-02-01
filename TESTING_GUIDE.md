# OmniAvatar UGC Platform - Testing Guide

## Phase 6: Initial Testing

This guide provides step-by-step instructions for testing the OmniAvatar UGC platform.

---

## Prerequisites

- Docker Desktop installed and running
- Python 3.10+ installed
- PostgreSQL, Redis, and MinIO running (via Docker Compose)

---

## Task 6.1: Start Infrastructure Services

Start the required infrastructure services using Docker Compose:

```bash
cd C:\Users\loke_\Downloads\ugc-avatar-platform

# Start PostgreSQL, Redis, and MinIO
docker-compose -f docker/docker-compose.yml up -d postgres redis minio

# Wait for services to be healthy (30 seconds)
timeout /t 30

# Verify services are running
docker-compose -f docker/docker-compose.yml ps
```

**Expected Output:**
- postgres: healthy (port 5432)
- redis: healthy (port 6379)
- minio: healthy (port 9000, console 9001)

**Access MinIO Console:**
- URL: http://localhost:9001
- Username: `minioadmin`
- Password: `minioadmin`

---

## Task 6.2: Initialize Database

Create database tables using SQLAlchemy:

```bash
cd C:\Users\loke_\Downloads\ugc-avatar-platform\backend

# Activate virtual environment (if using one)
# venv\Scripts\activate

# Initialize database tables
python -c "from app.db.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database tables created successfully')"
```

**Expected Output:**
```
Database tables created successfully
```

**Verify Tables:**
```bash
# Connect to PostgreSQL
docker exec -it ugc-avatar-platform-postgres-1 psql -U postgres -d ugc_avatars

# List tables
\dt

# Expected tables:
# - videos
# - users
```

---

## Task 6.3: Test Backend API

### Terminal 1: Start Backend Server

```bash
cd C:\Users\loke_\Downloads\ugc-avatar-platform\backend

# Start FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Terminal 2: Test Endpoints

#### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status":"healthy"}
```

#### Test 2: Root Endpoint
```bash
curl http://localhost:8000/
```

**Expected Response:**
```json
{"message":"UGC Avatar Platform API","status":"running"}
```

#### Test 3: API Documentation
Open in browser: http://localhost:8000/docs

You should see the interactive Swagger UI with:
- POST `/api/v1/videos/generate`
- GET `/api/v1/videos/{video_id}`
- GET `/api/v1/videos/{video_id}/status`
- DELETE `/api/v1/videos/{video_id}`

---

## Task 6.4: Test Celery Worker

### Terminal 3: Start Celery Worker

**Note:** The worker requires GPU and OmniAvatar models to fully function. For initial testing, we'll verify connectivity only.

```bash
cd C:\Users\loke_\Downloads\ugc-avatar-platform\worker

# Test worker imports (without starting)
python -c "from celery_app import celery_app; print(f'Celery app: {celery_app.main}')"
```

**Expected Output:**
```
Celery app: avatar_worker
```

### Start Worker (for connectivity test)
```bash
celery -A celery_app worker --loglevel=info
```

**Expected Output:**
```
[tasks]
  . worker.tasks.generate_video_task

[2025-01-19 ...] [INFO/MainProcess] Connected to redis://localhost:6379/0
[2025-01-19 ...] [INFO/MainProcess] mingle: searching for neighbors
[2025-01-19 ...] [INFO/MainProcess] mingle: all alone
[2025-01-19 ...] [INFO/MainProcess] celery@HOSTNAME ready.
```

---

## End-to-End API Test (Optional)

### Test Video Generation Endpoint

**Create a test image file** (`test.jpg`) and save it locally.

```bash
curl -X POST http://localhost:8000/api/v1/videos/generate \
  -F "reference_image=@test.jpg" \
  -F "text_input=Hello! This is a test of the OmniAvatar platform." \
  -F "prompt=Happy person in modern office discussing technology" \
  -F "emotion=excited" \
  -F "style=testimonial"
```

**Expected Response:**
```json
{
  "id": 1,
  "user_id": "user-123",
  "status": "pending",
  "reference_image_url": "http://localhost:9000/ugc-avatars/uploads/user-123/images/...",
  "prompt": "Happy person in modern office discussing technology",
  "created_at": "2025-01-19T...",
  ...
}
```

**Check Video Status:**
```bash
curl http://localhost:8000/api/v1/videos/1/status
```

**Expected Response:**
```json
{
  "id": 1,
  "status": "pending",
  "progress": 10,
  "message": "Waiting in queue...",
  "output_video_url": null,
  "error_message": null
}
```

---

## Troubleshooting

### Issue 1: Database Connection Failed
**Error:** `psycopg2.OperationalError: could not connect to server`

**Solution:**
1. Verify PostgreSQL is running: `docker ps | grep postgres`
2. Check DATABASE_URL in `.env` matches service configuration
3. Wait 30 seconds for service to fully start

### Issue 2: Redis Connection Failed
**Error:** `redis.exceptions.ConnectionError`

**Solution:**
1. Verify Redis is running: `docker ps | grep redis`
2. Check REDIS_URL in `.env`
3. Test connection: `redis-cli -h localhost ping`

### Issue 3: S3/MinIO Upload Failed
**Error:** `botocore.exceptions.ClientError`

**Solution:**
1. Verify MinIO is running: `docker ps | grep minio`
2. Create bucket manually:
   - Open http://localhost:9001
   - Login with minioadmin/minioadmin
   - Create bucket named `ugc-avatars`
3. Check S3_ENDPOINT in `.env`

### Issue 4: Import Errors
**Error:** `ModuleNotFoundError` or `ImportError`

**Solution:**
1. Ensure you're in the correct directory
2. Set PYTHONPATH: `export PYTHONPATH=$PYTHONPATH:/path/to/ugc-avatar-platform`
3. Install missing dependencies: `pip install -r requirements.txt`

### Issue 5: Worker Cannot Find Models
**Error:** `FileNotFoundError: /models/OmniAvatar-14B not found`

**Solution:**
This is expected for Phase 6 testing. OmniAvatar models will be downloaded in Phase 7.
For now, verify worker connectivity only.

---

## Success Checklist

- [ ] PostgreSQL running and accessible (port 5432)
- [ ] Redis running and accessible (port 6379)
- [ ] MinIO running with console accessible (ports 9000, 9001)
- [ ] MinIO bucket `ugc-avatars` created
- [ ] Database tables created (videos, users)
- [ ] Backend API responds to `/health` endpoint
- [ ] Backend API documentation accessible at `/docs`
- [ ] Celery worker connects to Redis
- [ ] Celery worker registers `generate_video_task`

---

## Next Steps

After completing Phase 6:

1. **Phase 7**: Download OmniAvatar Models (~50GB)
2. **Phase 8**: Clone OmniAvatar Repository
3. **Phase 9**: Frontend Implementation (Optional)
4. **Phase 10**: End-to-End Testing with actual video generation

---

## Quick Reference

**Service URLs:**
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432
- Redis: localhost:6379

**Credentials:**
- PostgreSQL: postgres/postgres
- MinIO: minioadmin/minioadmin

**Project Location:**
`C:\Users\loke_\Downloads\ugc-avatar-platform\`
