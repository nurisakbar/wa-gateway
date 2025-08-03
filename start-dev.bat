@echo off
echo 🚀 Starting WA Gateway Development Environment with Docker Compose...

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
    ) else (
        echo ⚠️  No .env file found. Creating basic .env file...
        (
            echo # Database Configuration
            echo MYSQL_ROOT_PASSWORD=rootpassword
            echo MYSQL_DATABASE=wagateway_dev
            echo MYSQL_USER=wagateway
            echo MYSQL_PASSWORD=wagateway123
            echo.
            echo # JWT Configuration
            echo JWT_SECRET=dev-jwt-secret
            echo JWT_EXPIRES_IN=7d
            echo SESSION_SECRET=dev-session-secret
            echo.
            echo # Environment
            echo NODE_ENV=development
        ) > .env
        echo ✅ Basic .env file created.
    )
)

echo 🐳 Starting Docker Compose development environment...

REM Start Docker Compose development environment
docker compose -f docker-compose.dev.yml up --build

echo.
echo ✅ WA Gateway Development Environment stopped.
pause 