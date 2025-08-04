@echo off
echo 🔧 Fixing npm dependency resolution issues...

echo.
echo 📋 Checking current npm and node versions...
npm --version
node --version

echo.
echo 🧹 Cleaning npm cache...
npm cache clean --force

echo.
echo 📦 Attempting to install dependencies with legacy peer deps...
cd backend
npm install --legacy-peer-deps

if errorlevel 1 (
    echo.
    echo ⚠️  Legacy peer deps failed, trying with force...
    npm install --force
)

if errorlevel 1 (
    echo.
    echo ⚠️  Force install failed, trying with --no-audit...
    npm install --no-audit --legacy-peer-deps
)

if errorlevel 1 (
    echo.
    echo ⚠️  All attempts failed. Please check the error messages above.
    echo 💡 Additional solutions to try:
    echo    1. Update npm: npm install -g npm@latest
    echo    2. Delete node_modules and package-lock.json, then run npm install
    echo    3. Use yarn instead: npm install -g yarn && yarn install
    pause
    exit /b 1
)

echo.
echo ✅ Backend dependencies installed successfully!

echo.
echo 📦 Installing frontend dependencies...
cd ..\frontend
npm install --legacy-peer-deps

if errorlevel 1 (
    echo.
    echo ⚠️  Frontend install failed, trying with force...
    npm install --force
)

if errorlevel 1 (
    echo.
    echo ⚠️  Frontend force install failed, trying with --no-audit...
    npm install --no-audit --legacy-peer-deps
)

if errorlevel 1 (
    echo.
    echo ⚠️  Frontend installation failed. Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ✅ Frontend dependencies installed successfully!
echo.
echo 🎉 All dependencies installed successfully!
pause 