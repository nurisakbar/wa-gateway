Write-Host "🔧 Fixing npm dependency resolution issues..." -ForegroundColor Green

Write-Host ""
Write-Host "📋 Checking current npm and node versions..." -ForegroundColor Yellow
npm --version
node --version

Write-Host ""
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host ""
Write-Host "📦 Attempting to install backend dependencies with legacy peer deps..." -ForegroundColor Yellow
Set-Location "backend"

try {
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
    } else {
        throw "Legacy peer deps failed"
    }
} catch {
    Write-Host ""
    Write-Host "⚠️  Legacy peer deps failed, trying with force..." -ForegroundColor Yellow
    try {
        npm install --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
        } else {
            throw "Force install failed"
        }
    } catch {
        Write-Host ""
        Write-Host "⚠️  Force install failed, trying with --no-audit..." -ForegroundColor Yellow
        try {
            npm install --no-audit --legacy-peer-deps
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Backend dependencies installed successfully!" -ForegroundColor Green
            } else {
                throw "All backend attempts failed"
            }
        } catch {
            Write-Host ""
            Write-Host "❌ All backend installation attempts failed." -ForegroundColor Red
            Write-Host "💡 Additional solutions to try:" -ForegroundColor Cyan
            Write-Host "   1. Update npm: npm install -g npm@latest" -ForegroundColor White
            Write-Host "   2. Delete node_modules and package-lock.json, then run npm install" -ForegroundColor White
            Write-Host "   3. Use yarn instead: npm install -g yarn && yarn install" -ForegroundColor White
            Read-Host "Press Enter to continue"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "..\frontend"

try {
    npm install --legacy-peer-deps
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
    } else {
        throw "Frontend legacy peer deps failed"
    }
} catch {
    Write-Host ""
    Write-Host "⚠️  Frontend install failed, trying with force..." -ForegroundColor Yellow
    try {
        npm install --force
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
        } else {
            throw "Frontend force install failed"
        }
    } catch {
        Write-Host ""
        Write-Host "⚠️  Frontend force install failed, trying with --no-audit..." -ForegroundColor Yellow
        try {
            npm install --no-audit --legacy-peer-deps
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Frontend dependencies installed successfully!" -ForegroundColor Green
            } else {
                throw "All frontend attempts failed"
            }
        } catch {
            Write-Host ""
            Write-Host "❌ Frontend installation failed." -ForegroundColor Red
            Read-Host "Press Enter to continue"
            exit 1
        }
    }
}

Write-Host ""
Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green
Read-Host "Press Enter to continue" 