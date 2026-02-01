# OmniAvatar Model Download Script for Windows
# Total download size: ~32GB
# Estimated time: 1-4 hours depending on internet speed

Write-Host "=== OmniAvatar Model Download Script ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will download:" -ForegroundColor Yellow
Write-Host "  - Wan2.1-T2V-14B base model (~28GB)" -ForegroundColor Yellow
Write-Host "  - wav2vec2-base-960h (~360MB)" -ForegroundColor Yellow
Write-Host "  - OmniAvatar-14B (~4GB)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Total: ~32GB | Estimated time: 1-4 hours" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Download cancelled." -ForegroundColor Red
    exit
}

# Set location
Set-Location "C:\Users\loke_\Downloads\ugc-avatar-platform"

# Install huggingface-hub if not present
Write-Host "`n[1/5] Installing Hugging Face CLI..." -ForegroundColor Cyan
python -m pip install -q huggingface_hub

# Create models directory
Write-Host "`n[2/5] Creating models directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path ".\models" | Out-Null
Write-Host "Created: .\models" -ForegroundColor Green

# Download Wan2.1-T2V-14B (base model ~28GB)
Write-Host "`n[3/5] Downloading Wan2.1-T2V-14B base model (~28GB)..." -ForegroundColor Cyan
Write-Host "This is the largest file and will take the most time..." -ForegroundColor Yellow
huggingface-cli download Wan-AI/Wan2.1-T2V-14B --local-dir .\models\Wan2.1-T2V-14B

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Wan2.1-T2V-14B downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to download Wan2.1-T2V-14B" -ForegroundColor Red
    exit 1
}

# Download wav2vec2-base-960h (~360MB)
Write-Host "`n[4/5] Downloading wav2vec2-base-960h (~360MB)..." -ForegroundColor Cyan
huggingface-cli download facebook/wav2vec2-base-960h --local-dir .\models\wav2vec2-base-960h

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ wav2vec2-base-960h downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to download wav2vec2-base-960h" -ForegroundColor Red
    exit 1
}

# Download OmniAvatar-14B (~4GB)
Write-Host "`n[5/5] Downloading OmniAvatar-14B (~4GB)..." -ForegroundColor Cyan
huggingface-cli download OmniAvatar/OmniAvatar-14B --local-dir .\models\OmniAvatar-14B

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ OmniAvatar-14B downloaded successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to download OmniAvatar-14B" -ForegroundColor Red
    exit 1
}

# Verify downloads
Write-Host "`n=== Verifying Downloads ===" -ForegroundColor Cyan
Write-Host "`nModel locations:" -ForegroundColor Yellow

if (Test-Path ".\models\Wan2.1-T2V-14B") {
    $size = (Get-ChildItem ".\models\Wan2.1-T2V-14B" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
    Write-Host "  ✓ Wan2.1-T2V-14B: .\models\Wan2.1-T2V-14B ($([math]::Round($size, 2)) GB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Wan2.1-T2V-14B: NOT FOUND" -ForegroundColor Red
}

if (Test-Path ".\models\wav2vec2-base-960h") {
    $size = (Get-ChildItem ".\models\wav2vec2-base-960h" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  ✓ wav2vec2: .\models\wav2vec2-base-960h ($([math]::Round($size, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ wav2vec2: NOT FOUND" -ForegroundColor Red
}

if (Test-Path ".\models\OmniAvatar-14B") {
    $size = (Get-ChildItem ".\models\OmniAvatar-14B" -Recurse | Measure-Object -Property Length -Sum).Sum / 1GB
    Write-Host "  ✓ OmniAvatar: .\models\OmniAvatar-14B ($([math]::Round($size, 2)) GB)" -ForegroundColor Green
} else {
    Write-Host "  ✗ OmniAvatar: NOT FOUND" -ForegroundColor Red
}

Write-Host "`n=== Download Complete! ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env to point to these model paths (already configured)" -ForegroundColor White
Write-Host "  2. Run Phase 8: Clone OmniAvatar Repository" -ForegroundColor White
Write-Host "  3. Test video generation with the worker" -ForegroundColor White
