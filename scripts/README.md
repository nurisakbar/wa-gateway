# 🚀 WA Gateway Deployment Scripts

Koleksi script otomatis untuk deployment dan maintenance WA Gateway di Ubuntu server.

## 📁 Daftar Scripts

### 1. `setup-ubuntu-server.sh`
Script untuk setup awal server Ubuntu dengan semua dependencies yang diperlukan.

**Fitur:**
- ✅ Update sistem Ubuntu
- ✅ Install Docker & Docker Compose
- ✅ Install Node.js 18.x
- ✅ Install Nginx
- ✅ Install Certbot (SSL)
- ✅ Setup firewall (UFW)
- ✅ Setup fail2ban (Security)
- ✅ Setup monitoring & backup scripts
- ✅ Optimasi sistem

**Cara penggunaan:**
```bash
# Download dan jalankan script
wget https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/setup-ubuntu-server.sh
chmod +x setup-ubuntu-server.sh
./setup-ubuntu-server.sh
```

### 2. `deploy.sh`
Script untuk deployment otomatis WA Gateway dengan konfigurasi lengkap.

**Fitur:**
- ✅ Clone/update repository
- ✅ Setup environment files
- ✅ Konfigurasi Nginx
- ✅ Deploy dengan Docker
- ✅ Setup SSL dengan Let's Encrypt
- ✅ Run database migrations
- ✅ Verifikasi deployment

**Cara penggunaan:**
```bash
# Jalankan sebagai user 'wagateway'
su - wagateway
cd ~
wget https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/deploy.sh
chmod +x deploy.sh
./deploy.sh
```

## 🔧 Prerequisites

### Untuk `setup-ubuntu-server.sh`:
- Ubuntu 20.04 LTS, 22.04 LTS, atau 24.04 LTS
- User dengan sudo access
- Koneksi internet yang stabil

### Untuk `deploy.sh`:
- Server sudah di-setup dengan `setup-ubuntu-server.sh`
- User 'wagateway' sudah dibuat
- Docker dan dependencies sudah terinstall
- Domain name yang valid

## 📋 Langkah-langkah Deployment

### Step 1: Setup Server Ubuntu
```bash
# 1. Login ke server Ubuntu
ssh user@your-server-ip

# 2. Download dan jalankan setup script
wget https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/setup-ubuntu-server.sh
chmod +x setup-ubuntu-server.sh
./setup-ubuntu-server.sh

# 3. Logout dan login kembali untuk apply Docker group changes
exit
ssh user@your-server-ip
```

### Step 2: Deploy WA Gateway
```bash
# 1. Switch ke user 'wagateway'
su - wagateway

# 2. Download dan jalankan deploy script
wget https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/deploy.sh
chmod +x deploy.sh
./deploy.sh

# 3. Follow prompts untuk konfigurasi
# - Repository URL
# - Domain name
# - Email untuk SSL
# - MySQL passwords
# - SMTP configuration (optional)
```

### Step 3: Verifikasi Deployment
```bash
# Check container status
docker compose ps

# Check logs
docker compose logs -f

# Test API
curl https://yourdomain.com/api/health

# Test frontend
curl https://yourdomain.com
```

## 🔐 Konfigurasi Environment

### File `.env` (Main Configuration)
```env
# Database
MYSQL_ROOT_PASSWORD=your_strong_password
MYSQL_DATABASE=wa_gateway
MYSQL_USER=wa_user
MYSQL_PASSWORD=your_strong_password

# Application
NODE_ENV=production
JWT_SECRET=your_jwt_secret

# Frontend
NUXT_PUBLIC_API_URL=https://yourdomain.com
NUXT_PUBLIC_WS_URL=wss://yourdomain.com

# Email (Optional)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### File `backend/.env` (Backend Configuration)
```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=mysql
DB_PORT=3306
DB_NAME=wa_gateway
DB_USER=wa_user
DB_PASSWORD=your_strong_password

# Security
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://yourdomain.com
```

## 🛠️ Maintenance Commands

### Docker Commands
```bash
# View container status
docker compose ps

# View logs
docker compose logs -f

# Restart services
docker compose restart

# Stop services
docker compose down

# Update and restart
git pull && docker compose up -d --build
```

### Monitoring Commands
```bash
# System monitoring
sudo /usr/local/bin/system-monitor.sh

# Docker monitoring
sudo /usr/local/bin/docker-monitor.sh

# API health check
sudo /usr/local/bin/api-health-check.sh

# Database monitoring
sudo /usr/local/bin/db-monitor.sh
```

### Backup Commands
```bash
# Database backup
sudo /usr/local/bin/db-backup.sh

# Files backup
sudo /usr/local/bin/files-backup.sh

# Restore database
sudo /usr/local/bin/db-restore.sh backup_file.sql.gz
```

## 📊 Monitoring Dashboard

Jalankan monitoring dashboard untuk melihat status sistem secara real-time:

```bash
sudo /usr/local/bin/monitoring-dashboard.sh
```

Dashboard akan menampilkan:
- System status (CPU, Memory, Disk)
- Docker container status
- Service health (API, Frontend, Nginx)
- Recent errors
- Backup status

## 🔧 Troubleshooting

### Common Issues

#### 1. Container tidak bisa start
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check container status
docker compose ps

# Restart specific service
docker compose restart backend
```

#### 2. Database connection error
```bash
# Check MySQL container
docker compose exec mysql mysql -u root -p

# Check database exists
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Reset database
docker compose exec mysql mysql -u root -p -e "DROP DATABASE wa_gateway; CREATE DATABASE wa_gateway;"
```

#### 3. SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

#### 4. Port sudah digunakan
```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Kill process using port
sudo kill -9 <PID>
```

### Log Files
```bash
# Application logs
docker compose logs

# System logs
sudo tail -f /var/log/wa-gateway/system-monitor.log
sudo tail -f /var/log/wa-gateway/docker-monitor.log
sudo tail -f /var/log/wa-gateway/api-health-check.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 📚 Dokumentasi Lengkap

- **Ubuntu Deployment Guide**: `docs/UBUNTU_DEPLOYMENT.md`
- **SSL Setup Guide**: `docs/SSL_SETUP_GUIDE.md`
- **Monitoring & Backup Guide**: `docs/MONITORING_BACKUP_GUIDE.md`
- **API Documentation**: `docs/API.md`
- **Troubleshooting**: `docs/TROUBLESHOOTING.md`

## 🆘 Support

Jika mengalami masalah:

1. **Check logs** terlebih dahulu
2. **Baca dokumentasi** yang relevan
3. **Search issues** di repository
4. **Buat issue baru** jika belum ada solusi

## 🔄 Update Scripts

Untuk update scripts ke versi terbaru:

```bash
# Update setup script
wget -O setup-ubuntu-server.sh https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/setup-ubuntu-server.sh
chmod +x setup-ubuntu-server.sh

# Update deploy script
wget -O deploy.sh https://raw.githubusercontent.com/your-repo/wa-gateway/main/scripts/deploy.sh
chmod +x deploy.sh
```

## 📝 Changelog

### v1.0.0
- ✅ Initial release
- ✅ Ubuntu server setup script
- ✅ Automated deployment script
- ✅ SSL setup dengan Let's Encrypt
- ✅ Monitoring dan backup scripts
- ✅ Comprehensive documentation

---

**Catatan**: Ganti `your-repo` dengan repository URL yang sebenarnya sebelum menggunakan scripts.
