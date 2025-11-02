# Setup script for environment variables
Write-Host "Setting up environment variables..." -ForegroundColor Cyan

# Frontend .env.local
$frontendEnv = @"
# Frontend Environment Variables (Vite)
VITE_GEMINI_API_KEY=AIzaSyA-FiICEuyRia5nnaUog_QVqbLaGEvBdmk
VITE_API_KEY=AIzaSyA-FiICEuyRia5nnaUog_QVqbLaGEvBdmk
VITE_API_URL=http://localhost:8080
"@

$frontendEnv | Out-File -FilePath ".env.local" -Encoding utf8 -NoNewline
Write-Host "✅ Created .env.local" -ForegroundColor Green

# Backend .env
if (-not (Test-Path "backend\.env")) {
    $backendEnv = @"
# Backend Environment Variables
PORT=8080
GEMINI_API_KEY=AIzaSyA-FiICEuyRia5nnaUog_QVqbLaGEvBdmk
API_KEY=AIzaSyA-FiICEuyRia5nnaUog_QVqbLaGEvBdmk
NODE_ENV=development
"@
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding utf8 -NoNewline
    Write-Host "✅ Created backend/.env" -ForegroundColor Green
} else {
    Write-Host "ℹ️  backend/.env already exists" -ForegroundColor Yellow
}

Write-Host "`n✅ Environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the backend:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "To start the frontend:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White

