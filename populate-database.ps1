# AIRadar - Populate Database Script
# This script will populate your Firestore database with real AI tool data

Write-Host "🚀 AIRadar Database Population" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the jobs folder
$currentPath = Get-Location
if ($currentPath.Path -notlike "*\jobs") {
    Write-Host "📁 Navigating to jobs folder..." -ForegroundColor Yellow
    Set-Location -Path "jobs"
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Check if Playwright is installed
Write-Host "🎭 Checking Playwright installation..." -ForegroundColor Yellow
npx playwright install chromium --with-deps
Write-Host ""

# Set Firebase credentials
$serviceAccountPath = "C:\Users\nehas\Downloads\airadar-95005-firebase-adminsdk-fbsvc-82ab885175.json"

if (Test-Path $serviceAccountPath) {
    Write-Host "🔑 Setting Firebase credentials..." -ForegroundColor Yellow
    $env:FIREBASE_SERVICE_ACCOUNT_KEY = Get-Content -Raw $serviceAccountPath
    Write-Host "✅ Firebase credentials loaded" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ Firebase service account file not found at:" -ForegroundColor Red
    Write-Host "   $serviceAccountPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please update the path in this script or move the file to the expected location." -ForegroundColor Yellow
    exit 1
}

# Ask user which method to use
Write-Host "Choose population method:" -ForegroundColor Cyan
Write-Host "  1. Popular Tools (Recommended - 25 tools, ~5 minutes)" -ForegroundColor White
Write-Host "  2. Reddit Scraping (Requires Reddit API, finds more tools)" -ForegroundColor White
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

Write-Host ""

if ($choice -eq "1") {
    Write-Host "🎯 Populating with popular AI tools..." -ForegroundColor Cyan
    Write-Host "This will scrape and analyze 25 popular AI tools." -ForegroundColor White
    Write-Host "Estimated time: 5 minutes" -ForegroundColor White
    Write-Host ""
    
    npm run populate-popular
    
} elseif ($choice -eq "2") {
    Write-Host "🔥 Populating from Reddit..." -ForegroundColor Cyan
    Write-Host "Make sure you've set up Reddit API credentials in .env file!" -ForegroundColor Yellow
    Write-Host ""
    
    npm run populate
    
} else {
    Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Done! Check your app at http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Make sure your backend is running (npm run dev in backend folder)" -ForegroundColor White
Write-Host "  2. Make sure your frontend is running (npm run dev in root folder)" -ForegroundColor White
Write-Host "  3. Refresh your browser to see real data!" -ForegroundColor White
Write-Host ""
