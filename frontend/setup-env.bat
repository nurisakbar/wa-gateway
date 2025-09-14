@echo off
REM Setup Environment Variables Script for Windows
REM This script helps you set up environment files for different environments

echo 🚀 WA Gateway Frontend - Environment Setup
echo ==========================================

REM Check if we're in the frontend directory
if not exist "nuxt.config.ts" (
    echo ❌ Please run this script from the frontend directory
    pause
    exit /b 1
)

echo.
echo 📋 Available environment setups:
echo 1. Development (local)
echo 2. Staging
echo 3. Production
echo 4. All environments
echo.

set /p choice="Choose setup option (1-4): "

if "%choice%"=="1" (
    echo 🔧 Setting up Development environment...
    if exist "env.example" (
        copy "env.example" ".env.local" >nul
        echo ✅ Created .env.local from env.example
    ) else (
        echo ❌ Source file env.example not found
    )
    echo ✅ Development environment ready!
    echo 📝 Edit .env.local to customize your settings
) else if "%choice%"=="2" (
    echo 🔧 Setting up Staging environment...
    if exist "env.staging" (
        copy "env.staging" ".env.staging" >nul
        echo ✅ Created .env.staging from env.staging
    ) else (
        echo ❌ Source file env.staging not found
    )
    echo ✅ Staging environment ready!
    echo 📝 Edit .env.staging to customize your settings
) else if "%choice%"=="3" (
    echo 🔧 Setting up Production environment...
    if exist "env.production" (
        copy "env.production" ".env.production" >nul
        echo ✅ Created .env.production from env.production
    ) else (
        echo ❌ Source file env.production not found
    )
    echo ✅ Production environment ready!
    echo 📝 Edit .env.production to customize your settings
) else if "%choice%"=="4" (
    echo 🔧 Setting up all environments...
    if exist "env.example" (
        copy "env.example" ".env.local" >nul
        echo ✅ Created .env.local from env.example
    )
    if exist "env.staging" (
        copy "env.staging" ".env.staging" >nul
        echo ✅ Created .env.staging from env.staging
    )
    if exist "env.production" (
        copy "env.production" ".env.production" >nul
        echo ✅ Created .env.production from env.production
    )
    echo ✅ All environments ready!
    echo 📝 Edit the respective .env files to customize your settings
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)

echo.
echo 🎉 Environment setup complete!
echo.
echo 📖 Next steps:
echo 1. Edit the created .env file(s) with your actual URLs and API keys
echo 2. Run 'npm run dev' for development
echo 3. Run 'npm run build' for production
echo.
echo 📚 For more information, see ENV_README.md
pause
