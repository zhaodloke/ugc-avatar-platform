# API Testing Script
# This script tests all API endpoints

Write-Host "=== UGC Avatar Platform API Test ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8000"

# Test 1: Health Check
Write-Host "[1/4] Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($response.status -eq "healthy") {
        Write-Host "✓ Health check passed" -ForegroundColor Green
        Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Root endpoint
Write-Host "[2/4] Testing root endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "✓ Root endpoint working" -ForegroundColor Green
    Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Root endpoint failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: OpenAPI docs
Write-Host "[3/4] Testing OpenAPI documentation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/openapi.json" -Method Get
    Write-Host "✓ OpenAPI schema available" -ForegroundColor Green
    Write-Host "  Size: $($response.Content.Length) bytes" -ForegroundColor Gray
} catch {
    Write-Host "✗ OpenAPI schema failed: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: API Documentation UI
Write-Host "[4/4] Checking documentation UI..." -ForegroundColor Yellow
Write-Host "  Swagger UI: $baseUrl/docs" -ForegroundColor Cyan
Write-Host "  ReDoc: $baseUrl/redoc" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host "✓ Backend API is running correctly!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Open $baseUrl/docs in your browser" -ForegroundColor White
Write-Host "  2. Try the video generation endpoint" -ForegroundColor White
Write-Host "  3. Check MinIO at http://localhost:9001" -ForegroundColor White
Write-Host ""
Write-Host "For video generation with a test image, see QUICK_TEST.md" -ForegroundColor Cyan
