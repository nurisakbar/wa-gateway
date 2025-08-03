@echo off
echo 🚀 Starting WA Gateway Production Environment with Docker Compose...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker compose version >nul 2>&1
if errorlevel 1 (
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose is not installed. Please install Docker Compose first.
        pause
        exit /b 1
    )
)

echo ✅ Docker and Docker Compose are available

REM Check if .env file exists, if not create from example
if not exist ".env" (
    if exist "docker.env.example" (
        echo 📝 Creating .env file from docker.env.example...
        copy docker.env.example .env >nul
        echo ✅ .env file created. Please review and modify if needed.
        echo ⚠️  IMPORTANT: Please update the .env file with production values before continuing!
        pause
    ) else (
        echo ⚠️  No .env file found. Creating basic .env file...
        (
            echo # Database Configuration
            echo MYSQL_ROOT_PASSWORD=your-secure-root-password
            echo MYSQL_DATABASE=wagateway
            echo MYSQL_USER=wagateway
            echo MYSQL_PASSWORD=your-secure-password
            echo.
            echo # JWT Configuration
            echo JWT_SECRET=your-super-secret-jwt-key
            echo JWT_EXPIRES_IN=7d
            echo SESSION_SECRET=your-session-secret
            echo.
            echo # Environment
            echo NODE_ENV=production
        ) > .env
        echo ✅ Basic .env file created.
        echo ⚠️  IMPORTANT: Please update the .env file with production values before continuing!
        pause
    )
)

echo 🐳 Starting Docker Compose production environment...

REM Start Docker Compose production environment in detached mode
docker compose up --build -d

echo.
echo ✅ WA Gateway Production Environment is starting up!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:3001
echo 📊 API Docs: http://localhost:3001/api-docs
echo.
echo To view logs: docker compose logs -f
echo To stop services: docker compose down
echo To check status: docker compose ps
echo.
pause 