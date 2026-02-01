# Upload models to RunPod
# Make sure you have OpenSSH installed on Windows

$podHost = "70.167.32.138"
$podPort = "31010"
$modelsPath = "c:\Users\loke_\Downloads\ugc-avatar-platform\models"

Write-Host "Starting model upload to RunPod pod..."
Write-Host "This will take a while (67GB total)"

# Upload each model folder
Write-Host "`nUploading Wan2.1-T2V-14B (65GB)..."
scp -r -P $podPort "$modelsPath\Wan2.1-T2V-14B" root@${podHost}:/workspace/models/

Write-Host "`nUploading wav2vec2-base-960h (1.1GB)..."
scp -r -P $podPort "$modelsPath\wav2vec2-base-960h" root@${podHost}:/workspace/models/

Write-Host "`nUploading OmniAvatar-14B (1.2GB)..."
scp -r -P $podPort "$modelsPath\OmniAvatar-14B" root@${podHost}:/workspace/models/

Write-Host "`nUpload complete!"
