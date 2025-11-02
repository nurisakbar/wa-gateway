# 📁 DevOps Directory Structure

Direktori ini berisi semua script untuk deploy, development, dan maintenance aplikasi WA Gateway yang terorganisir berdasarkan kebutuhan dan platform.

## 📂 Struktur Direktori

```
devops/
├── pm2/          # Script untuk deployment dengan PM2 (Linux/Mac)
├── docker/       # Script untuk deployment dengan Docker
├── windows/      # Script untuk Windows (batch files)
├── utils/        # Utility scripts (cleanup, maintenance, dll)
└── deploy/       # Script untuk automated deployment ke server
```

---

## 🚀 PM2 Scripts (`devops/pm2/`)

Script untuk menjalankan aplikasi dengan PM2 process manager (Linux/Mac).

### Script yang Tersedia:

- **`start.sh`** - Start aplikasi (development/production mode)
- **`prod.sh`** - Start aplikasi dalam production mode
- **`dev.sh`** - Start aplikasi dalam development mode
- **`stop.sh`** - Stop aplikasi
- **`restart.sh`** - Restart aplikasi (zero downtime)
- **`status.sh`** - Cek status aplikasi
- **`cleanup-pm2.sh`** - Cleanup proses PM2 yang duplikat

### Cara Menggunakan:

```bash
# Masuk ke folder devops/pm2/
cd devops/pm2

# Jalankan script
./start.sh              # Start development mode
./start.sh production    # Start production mode
./prod.sh               # Start production mode
./stop.sh               # Stop semua services
./restart.sh            # Restart semua services
./status.sh             # Cek status
```

### Prerequisites:
- Node.js dan npm terinstall
- PM2 terinstall (`npm install -g pm2`)

---

## 🐳 Docker Scripts (`devops/docker/`)

Script untuk menjalankan aplikasi dengan Docker dan Docker Compose.

### Script yang Tersedia:

- **`docker-start.sh`** - Docker management script (start/stop/restart/status/logs)
- **`docker-run.sh`** - Interactive Docker runner (menu-based)
- **`start-dev.sh`** - Start development environment dengan Docker Compose
- **`start-prod.sh`** - Start production environment dengan Docker Compose

### File Konfigurasi:

- **`docker-compose.yml`** - Production Docker Compose configuration
- **`docker-compose.dev.yml`** - Development Docker Compose configuration
- **`docker.env.example`** - Template environment file untuk Docker

### Cara Menggunakan:

```bash
# Masuk ke folder devops/docker/
cd devops/docker

# Docker management (flexible)
./docker-start.sh start production    # Start production
./docker-start.sh start development   # Start development
./docker-start.sh stop                # Stop services
./docker-start.sh restart production  # Restart services
./docker-start.sh status              # Check status
./docker-start.sh logs backend        # View logs
./docker-start.sh help                # Show help

# Interactive runner
./docker-run.sh                       # Menu-based interface

# Quick start
./start-dev.sh                        # Development mode
./start-prod.sh                        # Production mode
```

### Prerequisites:
- Docker terinstall
- Docker Compose terinstall

---

## 🪟 Windows Scripts (`devops/windows/`)

Script batch file untuk Windows.

### Script yang Tersedia:

- **`start-dev.bat`** - Start development environment dengan Docker
- **`start-prod.bat`** - Start production environment dengan Docker

### Cara Menggunakan:

```batch
REM Masuk ke folder devops/windows/
cd devops\windows

REM Jalankan batch file
start-dev.bat      # Start development
start-prod.bat     # Start production
```

### Prerequisites:
- Docker Desktop for Windows terinstall
- Docker Compose tersedia

---

## 🛠️ Utility Scripts (`devops/utils/`)

Script utility untuk maintenance dan cleanup.

### Script yang Tersedia:

- **`cleanup-ports.sh`** - Cleanup ports yang digunakan oleh aplikasi

### Cara Menggunakan:

```bash
./devops/utils/cleanup-ports.sh
```

---

## 🚢 Deploy Scripts (`devops/deploy/`)

Script untuk automated deployment ke server.

### Script yang Tersedia:

- **`deploy.sh`** - Automated deployment script (Docker-based)
- **`setup-ubuntu-server.sh`** - Setup server Ubuntu untuk deployment

### Cara Menggunakan:

```bash
# Setup server (run sebagai root atau dengan sudo)
sudo ./devops/deploy/setup-ubuntu-server.sh

# Deploy aplikasi (run sebagai user wagateway)
./devops/deploy/deploy.sh
```

### Prerequisites:
- Ubuntu Server
- Akses root/sudo
- Git repository access

---

## 📝 Quick Reference

### Start Application

**PM2 (Recommended untuk production):**
```bash
cd devops/pm2
./start.sh              # Development
./prod.sh               # Production
```

**Docker:**
```bash
cd devops/docker
./docker-start.sh start production
```

**Windows:**
```batch
cd devops\windows
start-prod.bat
```

### Stop Application

**PM2:**
```bash
cd devops/pm2
./stop.sh
```

**Docker:**
```bash
cd devops/docker
./docker-start.sh stop
```

### Check Status

**PM2:**
```bash
cd devops/pm2
./status.sh
# atau
pm2 status
```

**Docker:**
```bash
cd devops/docker
./docker-start.sh status
# atau
docker compose ps
```

### View Logs

**PM2:**
```bash
pm2 logs                # Semua logs
pm2 logs wa-gateway-be  # Backend only
pm2 logs wa-gateway-fe  # Frontend only
pm2 monit               # Real-time monitoring
```

**Docker:**
```bash
./devops/docker/docker-start.sh logs        # Semua logs
./devops/docker/docker-start.sh logs backend
docker compose logs -f        # Follow logs
```

---

## 🔧 Troubleshooting

### PM2 Issues

**Multiple instances running:**
```bash
./devops/pm2/cleanup-pm2.sh
# atau
pm2 delete all
pm2 kill
```

**Restart PM2:**
```bash
pm2 kill
pm2 resurrect
```

### Docker Issues

**Cleanup semua containers:**
```bash
docker compose down -v
docker system prune -a
```

**Rebuild containers:**
```bash
docker compose up -d --build
```

### Port Conflicts

```bash
./devops/utils/cleanup-ports.sh
```

---

## 📚 Dokumentasi Lengkap

- **PM2 Deployment**: Lihat `devops/pm2/README.md`
- **Docker Setup**: Lihat `devops/docker/README.md`
- **Windows**: Lihat `devops/windows/README.md`
- **Utils**: Lihat `devops/utils/README.md`
- **Deploy**: Lihat `devops/deploy/README.md`
- **Main README**: Lihat `README.md` di root project

---

## 💡 Tips

1. **Untuk Development**: Gunakan `./devops/pm2/start.sh` atau `./devops/pm2/dev.sh` dengan PM2
2. **Untuk Production**: Gunakan `./devops/pm2/prod.sh` dengan PM2 atau Docker
3. **Untuk Testing**: Gunakan Docker dengan `./devops/docker/docker-start.sh start development`
4. **Untuk Deployment**: Gunakan script di `devops/deploy/`

---

## 🆘 Support

Jika ada masalah, cek:
- Logs aplikasi
- Status PM2/Docker
- Dokumentasi lengkap di `devops/`
- Issues di repository
