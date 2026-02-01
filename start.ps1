# Quick Start Script
# This script starts all services in the correct order

Write-Host "=== UGC Avatar Platform - Quick Start ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Start Docker services
Write-Host "[1/3] Starting Docker services (PostgreSQL, Redis, MinIO)..." -ForegroundColor Yellow
docker-compose -f docker/docker-compose.yml up -d postgres redis minio

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start Docker services" -ForegroundColor Red
    Write-Host "Make sure Docker Desktop is running!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker services started" -ForegroundColor Green
Write-Host "  Waiting 30 seconds for services to be ready..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# Step 2: Check if database is initialized
Write-Host ""
Write-Host "[2/3] Checking database..." -ForegroundColor Yellow

$dbInitialized = $false
try {
    cd backend
    python -c "from app.db.database import Base, engine; from sqlalchemy import inspect; inspector = inspect(engine); tables = inspector.get_table_names(); exit(0 if 'videos' in tables else 1)" 2>$null
    if ($LASTEXITCODE -eq 0) {
        $dbInitialized = $true
        Write-Host "✓ Database already initialized" -ForegroundColor Green
    }
} catch {
    # Database not initialized
}

if (-not $dbInitialized) {
    Write-Host "  Initializing database..." -ForegroundColor Gray
    python -c "from app.db.database import Base, engine; Base.metadata.create_all(bind=engine); print('Database initialized')"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database initialized" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to initialize database" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Instructions
Write-Host ""
Write-Host "[3/3] Ready to start backend!" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== Services Running ===" -ForegroundColor Cyan
Write-Host "  PostgreSQL:  localhost:5432" -ForegroundColor White
Write-Host "  Redis:       localhost:6379" -ForegroundColor White
Write-Host "  MinIO:       http://localhost:9000" -ForegroundColor White
Write-Host "  MinIO UI:    http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor White
Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create MinIO bucket (if not exists):" -ForegroundColor Yellow
Write-Host "   - Open http://localhost:9001" -ForegroundColor White
Write-Host "   - Login: minioadmin / minioadmin" -ForegroundColor White
Write-Host "   - Create bucket: ugc-avatars" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the backend API:" -ForegroundColor Yellow
Write-Host "   uvicorn app.main:app --reload" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Test the API:" -ForegroundColor Yellow
Write-Host "   .\test_api.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Open API documentation:" -ForegroundColor Yellow
Write-Host "   http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed testing instructions, see:" -ForegroundColor Yellow
Write-Host "  QUICK_TEST.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services:" -ForegroundColor Yellow
Write-Host "  docker-compose -f docker/docker-compose.yml down" -ForegroundColor Cyan
Write-Host ""
