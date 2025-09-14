# 🚀 WA Gateway - Ubuntu Quick Start Guide

Panduan cepat untuk deploy WA Gateway ke Ubuntu server dalam 3 langkah sederhana.

## ⚡ Quick Start (3 Langkah)

### Step 1: Setup Server Ubuntu
```bash
# Login ke server Ubuntu
ssh user@your-server-ip

# Download dan jalankan setup script
wget https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/setup-ubuntu-server.sh
chmod +x setup-ubuntu-server.sh
./setup-ubuntu-server.sh

# Logout dan login kembali
exit
ssh user@your-server-ip
```

### Step 2: Deploy WA Gateway
```bash
# Switch ke user 'wagateway'
su - wagateway

# Download dan jalankan deploy script
wget https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Step 3: Verifikasi Deployment
```bash
# Check status
docker compose ps

# Test aplikasi
curl https://yourdomain.com/api/health
```

## 📋 Prerequisites

- **Server**: Ubuntu 20.04/22.04/24.04 LTS
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **Domain**: Domain name yang valid
- **DNS**: A record mengarah ke server IP

## 🔧 Konfigurasi yang Diperlukan

Saat menjalankan `deploy.sh`, Anda akan diminta untuk:

1. **Repository URL**: URL Git repository WA Gateway
2. **Domain**: Domain name (e.g., api.yourdomain.com)
3. **Email**: Email untuk SSL certificate
4. **MySQL Root Password**: Password untuk MySQL root user
5. **MySQL User Password**: Password untuk MySQL user
6. **SMTP Email** (optional): Email untuk notifikasi

## 🎯 Hasil Deployment

Setelah deployment selesai, Anda akan mendapatkan:

- ✅ **Backend API**: `https://yourdomain.com/api/`
- ✅ **Frontend**: `https://yourdomain.com/`
- ✅ **SSL Certificate**: Otomatis dengan Let's Encrypt
- ✅ **Database**: MySQL dengan backup otomatis
- ✅ **Monitoring**: Script monitoring dan alert
- ✅ **Backup**: Backup otomatis harian

## 🛠️ Commands yang Berguna

### Docker Management
```bash
# View status
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Update application
git pull && docker compose up -d --build
```

### Monitoring
```bash
# System monitoring
sudo /usr/local/bin/system-monitor.sh

# Docker monitoring
sudo /usr/local/bin/docker-monitor.sh

# API health check
sudo /usr/local/bin/api-health-check.sh

# Monitoring dashboard
sudo /usr/local/bin/monitoring-dashboard.sh
```

### Backup
```bash
# Database backup
sudo /usr/local/bin/db-backup.sh

# Files backup
sudo /usr/local/bin/files-backup.sh

# Restore database
sudo /usr/local/bin/db-restore.sh backup_file.sql.gz
```

## 🔍 Troubleshooting

### Container tidak bisa start
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Restart services
docker compose restart
```

### Database connection error
```bash
# Check MySQL
docker compose exec mysql mysql -u root -p

# Reset database
docker compose exec mysql mysql -u root -p -e "DROP DATABASE wa_gateway; CREATE DATABASE wa_gateway;"
```

### SSL certificate issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

## 📚 Dokumentasi Lengkap

- **Ubuntu Deployment Guide**: `docs/UBUNTU_DEPLOYMENT.md`
- **SSL Setup Guide**: `docs/SSL_SETUP_GUIDE.md`
- **Monitoring & Backup Guide**: `docs/MONITORING_BACKUP_GUIDE.md`
- **Scripts Documentation**: `scripts/README.md`

## 🆘 Support

Jika mengalami masalah:

1. **Check logs** terlebih dahulu
2. **Baca dokumentasi** yang relevan
3. **Search issues** di repository
4. **Buat issue baru** jika belum ada solusi

## 🎉 Selamat!

WA Gateway Anda sudah berhasil di-deploy! Aplikasi sekarang dapat diakses di `https://yourdomain.com`

---

**Catatan**: Ganti `your-repo` dengan repository URL yang sebenarnya sebelum menggunakan scripts.
