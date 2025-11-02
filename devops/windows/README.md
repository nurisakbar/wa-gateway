# 🪟 Windows Scripts

Batch script untuk menjalankan aplikasi WA Gateway di Windows dengan Docker.

## 📋 Script yang Tersedia

### `start-dev.bat` - Start Development
Start aplikasi dalam development mode dengan Docker Compose.

**Usage:**
```batch
start-dev.bat
```

**Features:**
- Check Docker installation
- Create .env file jika belum ada
- Start Docker Compose development environment
- Press Ctrl+C untuk stop

### `start-prod.bat` - Start Production
Start aplikasi dalam production mode dengan Docker Compose.

**Usage:**
```batch
start-prod.bat
```

**Features:**
- Check Docker installation
- Create .env file jika belum ada
- Start Docker Compose production environment
- Run in background (detached mode)

## 📦 Prerequisites

1. **Docker Desktop for Windows** terinstall
   - Download dari: https://www.docker.com/products/docker-desktop
   - Pastikan Docker Desktop running

2. **Docker Compose** tersedia
   - Biasanya sudah included dengan Docker Desktop

## 🚀 Quick Start

### Development Mode
1. Double-click `start-dev.bat`
2. Atau jalankan dari Command Prompt:
   ```batch
   cd devops\windows
   start-dev.bat
   ```

### Production Mode
1. Double-click `start-prod.bat`
2. Atau jalankan dari Command Prompt:
   ```batch
   cd devops\windows
   start-prod.bat
   ```

## 🐳 Docker Commands (Windows)

Setelah aplikasi running, Anda bisa menggunakan Docker commands:

```batch
REM Status
docker compose ps
docker ps

REM Logs
docker compose logs -f
docker compose logs -f backend

REM Stop
docker compose stop
docker compose down

REM Restart
docker compose restart

REM Rebuild
docker compose up -d --build
```

Atau menggunakan Docker Desktop GUI untuk manage containers.

## 🔧 Configuration

Script akan otomatis:
1. Check Docker installation
2. Check Docker Compose availability
3. Create `.env` file dari `docker.env.example` jika belum ada
4. Start Docker Compose dengan file yang sesuai

## 🌐 Access URLs

Setelah containers running:

**Development:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

**Production:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🆘 Troubleshooting

### Docker Not Running
```batch
REM Start Docker Desktop manually
REM Atau check jika Docker Desktop service running
```

### Port Already in Use
```batch
REM Check what's using the port
netstat -ano | findstr :3000
netstat -ano | findstr :3001

REM Kill process jika perlu
taskkill /PID <PID> /F
```

### Containers Won't Start
```batch
REM Check logs
docker compose logs

REM Check Docker status
docker info

REM Rebuild
docker compose down
docker compose up -d --build
```

### Permission Issues
```batch
REM Run Command Prompt as Administrator jika ada permission issues
REM Atau check Docker Desktop settings untuk file sharing
```

## 📝 Notes

- Script otomatis detect apakah `docker-compose` atau `docker compose` command tersedia
- Environment file akan dibuat otomatis dari template
- Development mode: containers run in foreground (bisa lihat logs langsung)
- Production mode: containers run in background (detached)
- Untuk stop development mode: press Ctrl+C di terminal
- Untuk stop production mode: gunakan `docker compose down`

## 💡 Tips

1. Gunakan Docker Desktop GUI untuk visual management
2. Check Docker Desktop settings untuk resource allocation
3. Pastikan WSL 2 enabled jika menggunakan WSL backend
4. Untuk better performance, enable Hyper-V jika available

