# Quick Testing Guide

This guide will get you up and running in **5 minutes** (without GPU/models for initial testing).

---

## Step 1: Start Infrastructure (1 minute)

Open PowerShell or Terminal and run:

```powershell
cd C:\Users\loke_\Downloads\ugc-avatar-platform

# Start PostgreSQL, Redis, and MinIO
docker-compose -f docker/docker-compose.yml up -d postgres redis minio

# Wait 30 seconds for services to start
Start-Sleep -Seconds 30

# Check if services are running
docker-compose -f docker/docker-compose.yml ps
```

**Expected Output:**
```
NAME                                    STATUS
ugc-avatar-platform-postgres-1          Up (healthy)
ugc-avatar-platform-redis-1             Up (healthy)
ugc-avatar-platform-minio-1             Up (healthy)
```

---

## Step 2: Initialize Database (30 seconds)

```powershell
cd backend
python -c "from app.db.database import Base, engine; Base.metadata.create_all(bind=engine); print('✓ Database initialized')"
```

**Expected Output:**
```
✓ Database initialized
```

---

## Step 3: Create MinIO Bucket (1 minute)

**Option A - Using Browser (Recommended):**
1. Open http://localhost:9001 in your browser
2. Login:
   - Username: `minioadmin`
   - Password: `minioadmin`
3. Click "Buckets" → "Create Bucket"
4. Name: `ugc-avatars`
5. Click "Create Bucket"

**Option B - Using Command Line:**
```powershell
# Install MinIO client
choco install minio-client
# or download from: https://min.io/docs/minio/windows/reference/minio-mc.html

# Configure
mc alias set local http://localhost:9000 minioadmin minioadmin

# Create bucket
mc mb local/ugc-avatars
```

---

## Step 4: Start Backend API (1 minute)

Open a **new terminal window**:

```powershell
cd C:\Users\loke_\Downloads\ugc-avatar-platform\backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Leave this terminal running!**

---

## Step 5: Test the API (1 minute)

Open a **new terminal window** and test:

### Test 1: Health Check
```powershell
curl http://localhost:8000/health
```

**Expected Response:**
```json
{"status":"healthy"}
```

### Test 2: Root Endpoint
```powershell
curl http://localhost:8000/
```

**Expected Response:**
```json
{"message":"UGC Avatar Platform API","status":"running"}
```

### Test 3: API Documentation
Open in your browser:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

You should see all API endpoints documented!

---

## Step 6: Test Video Generation (Without GPU)

**Note:** This will create a database record but fail at the worker stage (since OmniAvatar models aren't downloaded yet). This is expected for initial testing.

### Create a Test Image

Save any portrait image as `test.jpg` in your Downloads folder.

### Generate Video Request

```powershell
curl -X POST http://localhost:8000/api/v1/videos/generate `
  -F "reference_image=@C:\Users\loke_\Downloads\test.jpg" `
  -F "text_input=Hello! This is a test." `
  -F "prompt=Happy person in modern office" `
  -F "emotion=excited" `
  -F "style=testimonial"
```

**Expected Response:**
```json
{
  "id": 1,
  "user_id": "user-123",
  "status": "pending",
  "reference_image_url": "http://localhost:9000/ugc-avatars/uploads/user-123/images/...",
  "audio_url": "http://localhost:9000/ugc-avatars/uploads/user-123/audio/...",
  "prompt": "Happy person in modern office",
  "emotion": "excited",
  "style": "testimonial",
  "created_at": "2025-01-19T...",
  "output_video_url": null
}
```

### Check Video Status

```powershell
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

## Step 7: Verify Files Were Uploaded

Check MinIO:
1. Open http://localhost:9001
2. Login (minioadmin/minioadmin)
3. Click "Buckets" → "ugc-avatars"
4. Navigate to `uploads/user-123/`
5. You should see:
   - `images/` folder with your uploaded image
   - `audio/` folder with generated TTS audio (if OpenAI API key is configured)

---

## ✅ Success Criteria

If you've completed all steps successfully:

- [ ] PostgreSQL, Redis, MinIO running in Docker
- [ ] Database tables created
- [ ] MinIO bucket `ugc-avatars` exists
- [ ] Backend API running on port 8000
- [ ] `/health` endpoint returns `{"status":"healthy"}`
- [ ] `/docs` shows API documentation
- [ ] Can create video generation request
- [ ] Files uploaded to MinIO

**Congratulations!** Your infrastructure is working correctly! 🎉

---

## Testing With Celery Worker (Without GPU)

To test the worker connectivity (it will fail at model loading, which is expected):

### Terminal 3: Start Worker

```powershell
cd C:\Users\loke_\Downloads\ugc-avatar-platform\worker
celery -A celery_app worker --loglevel=info --concurrency=1
```

**Expected Output:**
```
-------------- celery@HOSTNAME v5.3.4
--- ***** -----
-- ******* ---- Windows-...
- *** --- * ---
- ** ---------- [config]
- ** ---------- .> app:         avatar_worker
- ** ---------- .> transport:   redis://localhost:6379/0
- ** ---------- .> results:     redis://localhost:6379/0
- *** --- * --- .> concurrency: 1
-- ******* ----
--- ***** -----

[tasks]
  . worker.tasks.generate_video_task

[2025-01-19 ...] [INFO/MainProcess] Connected to redis://localhost:6379/0
[2025-01-19 ...] [INFO/MainProcess] celery@HOSTNAME ready.
```

Now try generating a video again - the worker will pick it up and try to process it (will fail at model loading, which is expected).

---

## Common Issues & Solutions

### Issue 1: "docker-compose: command not found"

**Solution:**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- Make sure Docker Desktop is running
- Restart your terminal

### Issue 2: "Port 8000 already in use"

**Solution:**
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Issue 3: "Database connection failed"

**Solution:**
```powershell
# Check if PostgreSQL is running
docker ps | findstr postgres

# If not running, start it
docker-compose -f docker/docker-compose.yml up -d postgres

# Wait 30 seconds and try again
```

### Issue 4: "MinIO bucket not found"

**Solution:**
- Verify bucket exists at http://localhost:9001
- Create bucket manually (see Step 3)
- Check `.env` has `S3_BUCKET=ugc-avatars`

### Issue 5: "Import errors in Python"

**Solution:**
```powershell
# Make sure you're in the right directory
cd C:\Users\loke_\Downloads\ugc-avatar-platform\backend

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Next Steps

After confirming everything works:

1. **Add OpenAI API Key** (for TTS):
   - Edit `.env`
   - Set `OPENAI_API_KEY=sk-your-actual-key`
   - Restart backend

2. **Download Models** (for actual video generation):
   - See [PHASE_7_8_GUIDE.md](PHASE_7_8_GUIDE.md)
   - Run `.\download_models.ps1`
   - This downloads ~32GB of models

3. **Test Full Pipeline** (with GPU):
   - Start worker with GPU
   - Generate a complete video
   - Download from MinIO

---

## Quick Commands Reference

### Start Everything
```powershell
# Terminal 1: Infrastructure
docker-compose -f docker/docker-compose.yml up -d postgres redis minio

# Terminal 2: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 3: Worker (optional, requires models)
cd worker
celery -A celery_app worker --loglevel=info
```

### Stop Everything
```powershell
# Stop Docker services
docker-compose -f docker/docker-compose.yml down

# Stop backend: Press CTRL+C in terminal
# Stop worker: Press CTRL+C in terminal
```

### Check Logs
```powershell
# Docker logs
docker-compose -f docker/docker-compose.yml logs -f

# Specific service
docker-compose -f docker/docker-compose.yml logs -f postgres
```

---

## URLs Quick Reference

- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **MinIO Console**: http://localhost:9001
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

**You're now ready to test the platform!** 🚀

For full video generation with GPU, proceed to [PHASE_7_8_GUIDE.md](PHASE_7_8_GUIDE.md) to download the OmniAvatar models.
