# 📜 DevOps Scripts Quick Reference

Quick reference untuk semua script DevOps yang tersedia di project ini.

## 🚀 Quick Start

### PM2 (Recommended untuk Production - Linux/Mac)
```bash
cd devops/pm2
./start.sh              # Start development
./prod.sh               # Start production
./stop.sh                # Stop semua
./restart.sh            # Restart semua
./status.sh             # Check status
```

### Docker (Development & Production)
```bash
cd devops/docker
./docker-start.sh start production    # Start dengan Docker
./docker-start.sh stop               # Stop
./docker-start.sh logs               # View logs
./start-prod.sh                      # Quick start production
./start-dev.sh                       # Quick start development
```

### Windows (Docker)
```batch
cd devops\windows
start-prod.bat          # Start production
start-dev.bat            # Start development
```

---

## 📁 Struktur Script

Semua script terorganisir di folder `devops/`:

```
devops/
├── pm2/             # PM2 deployment scripts (Linux/Mac)
│   ├── start.sh
│   ├── prod.sh
│   ├── stop.sh
│   ├── restart.sh
│   ├── status.sh
│   ├── dev.sh
│   ├── cleanup-pm2.sh
│   └── README.md
│
├── docker/          # Docker deployment scripts
│   ├── docker-start.sh
│   ├── docker-run.sh
│   ├── start-dev.sh
│   ├── start-prod.sh
│   └── README.md
│
├── windows/         # Windows batch scripts
│   ├── start-dev.bat
│   ├── start-prod.bat
│   └── README.md
│
├── utils/           # Utility scripts
│   ├── cleanup-ports.sh
│   └── README.md
│
└── deploy/          # Server deployment scripts
    ├── deploy.sh
    ├── setup-ubuntu-server.sh
    └── README.md
```

---

## 📚 Dokumentasi Lengkap

- **PM2:** `devops/pm2/README.md`
- **Docker:** `devops/docker/README.md`
- **Windows:** `devops/windows/README.md`
- **Utils:** `devops/utils/README.md`
- **Deploy:** `devops/deploy/README.md`
- **Overview:** `devops/README.md`
- **Deployment Guide:** `DEPLOYMENT_GUIDE.md`

---

## 🎯 Pilih Metode Sesuai Kebutuhan

1. **Development Local (Linux/Mac):** `cd devops/pm2 && ./dev.sh`
2. **Development Local (Windows):** `cd devops\windows && start-dev.bat`
3. **Production Server (Linux):** `cd devops/pm2 && ./prod.sh`
4. **Docker (Semua OS):** `cd devops/docker && ./start-prod.sh`
5. **Automated Server Deploy:** `cd devops/deploy && ./deploy.sh`

---

## 🆘 Troubleshooting

**PM2 issues:**
```bash
cd devops/pm2
./cleanup-pm2.sh
```

**Port conflicts:**
```bash
cd devops/utils
./cleanup-ports.sh
```

**Docker cleanup:**
```bash
docker compose down -v
```

---

## 💡 Tips

- **Untuk PM2:** Masuk ke folder `devops/pm2/` lalu jalankan script
- **Untuk Docker:** Masuk ke folder `devops/docker/` lalu jalankan script
- **Untuk Windows:** Masuk ke folder `devops/windows/` lalu jalankan batch file
- Setiap folder memiliki README.md dengan dokumentasi lengkap

