# 🚀 WA Gateway - Deployment Guide

Panduan lengkap untuk deploy aplikasi WA Gateway dengan berbagai metode menggunakan DevOps scripts.

## 📋 Metode Deployment

### 1. PM2 (Recommended untuk Production - Linux/Mac)
Deploy menggunakan PM2 process manager. Cocok untuk server production.

**Lokasi Script:** `devops/pm2/`

**Quick Start:**
```bash
cd devops/pm2
./prod.sh              # Production mode
./start.sh production  # Alternative
./stop.sh              # Stop application
```

**Dokumentasi:** [devops/pm2/README.md](devops/pm2/README.md)

---

### 2. Docker (Recommended untuk Development & Production)
Deploy menggunakan Docker dan Docker Compose. Cocok untuk semua environment.

**Lokasi Script:** `devops/docker/`

**Quick Start:**
```bash
cd devops/docker
./start-prod.sh         # Production mode
./start-dev.sh          # Development mode
./docker-start.sh stop  # Stop containers
```

**Dokumentasi:** [devops/docker/README.md](devops/docker/README.md)

---

### 3. Windows (Docker)
Deploy di Windows menggunakan Docker Desktop.

**Lokasi Script:** `devops/windows/`

**Quick Start:**
```batch
cd devops\windows
start-prod.bat         # Production mode
start-dev.bat          # Development mode
```

**Dokumentasi:** [devops/windows/README.md](devops/windows/README.md)

---

### 4. Automated Server Deployment
Automated deployment script untuk server Ubuntu dengan Docker.

**Lokasi Script:** `devops/deploy/`

**Quick Start:**
```bash
# Setup server (run sekali)
sudo ./devops/deploy/setup-ubuntu-server.sh

# Deploy application
./devops/deploy/deploy.sh
```

**Dokumentasi:** [devops/deploy/README.md](devops/deploy/README.md)

---

## 🎯 Pilih Metode Deployment

### Untuk Development (Local)
- **Windows:** `devops/windows/start-dev.bat`
- **Linux/Mac dengan Docker:** `devops/docker/start-dev.sh`
- **Linux/Mac dengan PM2:** `devops/pm2/dev.sh`

### Untuk Production (Server)
- **Linux Server (Recommended):** `devops/pm2/prod.sh`
- **Docker (Flexible):** `devops/docker/start-prod.sh`
- **Automated:** `devops/deploy/deploy.sh`

### Untuk Windows Desktop
- **Docker Desktop:** `devops/windows/start-prod.bat`

---

## 📁 Struktur Scripts

```
devops/
├── pm2/              # PM2 deployment (Linux/Mac)
│   ├── start.sh
│   ├── prod.sh
│   ├── stop.sh
│   ├── restart.sh
│   ├── status.sh
│   ├── dev.sh
│   ├── cleanup-pm2.sh
│   └── README.md
│
├── docker/           # Docker deployment
│   ├── docker-start.sh
│   ├── docker-run.sh
│   ├── start-dev.sh
│   ├── start-prod.sh
│   └── README.md
│
├── windows/          # Windows batch scripts
│   ├── start-dev.bat
│   ├── start-prod.bat
│   └── README.md
│
├── utils/            # Utility scripts
│   ├── cleanup-ports.sh
│   └── README.md
│
└── deploy/           # Server deployment
    ├── deploy.sh
    ├── setup-ubuntu-server.sh
    └── README.md
```

---

## 🚀 Quick Reference

### Start Application

**PM2:**
```bash
cd devops/pm2
./prod.sh
```

**Docker:**
```bash
cd devops/docker
./start-prod.sh
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
# atau
docker compose down
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
pm2 logs
pm2 logs wa-gateway-be
pm2 monit
```

**Docker:**
```bash
docker compose logs -f
docker compose logs -f backend
```

---

## 📚 Dokumentasi Lengkap

- **PM2:** [devops/pm2/README.md](devops/pm2/README.md)
- **Docker:** [devops/docker/README.md](devops/docker/README.md)
- **Windows:** [devops/windows/README.md](devops/windows/README.md)
- **Utils:** [devops/utils/README.md](devops/utils/README.md)
- **Deploy:** [devops/deploy/README.md](devops/deploy/README.md)
- **Scripts Overview:** [devops/README.md](devops/README.md)

---

## 🆘 Troubleshooting

### Port Conflicts
```bash
cd devops/utils
./cleanup-ports.sh
```

### PM2 Issues
```bash
cd devops/pm2
./cleanup-pm2.sh
```

### Docker Issues
```bash
docker compose down -v
docker system prune -a
```

---

## 💡 Tips

1. **Development:** Gunakan Docker atau PM2 dengan watch mode
2. **Production:** Gunakan PM2 untuk better process management
3. **Testing:** Gunakan Docker untuk isolated environment
4. **Windows:** Gunakan Docker Desktop atau PM2 dengan WSL

---

## 📞 Support

Jika ada masalah:
1. Check dokumentasi di folder masing-masing
2. Check logs aplikasi
3. Verify prerequisites sudah terpenuhi
4. Check issues di repository

