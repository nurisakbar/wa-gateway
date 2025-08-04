@echo off
echo 🔧 Rebuilding Docker containers with updated dependencies...

echo.
echo 🛑 Stopping existing containers...
docker compose -f docker-compose.dev.yml down

echo.
echo 🧹 Cleaning up Docker cache...
docker system prune -f

echo.
echo 📦 Rebuilding containers with no cache...
docker compose -f docker-compose.dev.yml build --no-cache

echo.
echo 🚀 Starting containers with updated dependencies...
docker compose -f docker-compose.dev.yml up

echo.
echo ✅ Docker containers rebuilt and started successfully!
pause 