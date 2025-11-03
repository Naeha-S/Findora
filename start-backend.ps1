# Start Backend Server Script

Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Navigate to backend folder
Set-Location "C:\Users\nehas\Findora\backend"

# Set Firebase credentials
$serviceAccountPath = "C:\Users\nehas\Downloads\airadar-95005-firebase-adminsdk-fbsvc-82ab885175.json"

if (Test-Path $serviceAccountPath) {
    $env:FIREBASE_SERVICE_ACCOUNT_KEY = Get-Content -Raw $serviceAccountPath
    Write-Host "✅ Firebase credentials loaded" -ForegroundColor Green
} else {
    Write-Host "❌ Service account file not found!" -ForegroundColor Red
    exit 1
}

# Kill any process on port 8080
Write-Host "🔄 Clearing port 8080..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { 
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

# Start server
Write-Host "🚀 Starting server on port 8080..." -ForegroundColor Cyan
Write-Host ""
node server.js
