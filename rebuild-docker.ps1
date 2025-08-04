Write-Host "🔧 Rebuilding Docker containers with updated dependencies..." -ForegroundColor Green

Write-Host ""
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml down

Write-Host ""
Write-Host "🧹 Cleaning up Docker cache..." -ForegroundColor Yellow
docker system prune -f

Write-Host ""
Write-Host "📦 Rebuilding containers with no cache..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml build --no-cache

Write-Host ""
Write-Host "🚀 Starting containers with updated dependencies..." -ForegroundColor Yellow
docker compose -f docker-compose.dev.yml up

Write-Host ""
Write-Host "✅ Docker containers rebuilt and started successfully!" -ForegroundColor Green
Read-Host "Press Enter to continue" 