# 🚀 Panduan Deploy WA Gateway ke Ubuntu Server

Panduan lengkap untuk deploy aplikasi WA Gateway ke server Ubuntu dengan Docker dan Nginx.

## 📋 Daftar Isi

1. [Persyaratan Sistem](#persyaratan-sistem)
2. [Persiapan Server Ubuntu](#persiapan-server-ubuntu)
3. [Installasi Dependencies](#installasi-dependencies)
4. [Setup Database](#setup-database)
5. [Konfigurasi Environment](#konfigurasi-environment)
6. [Deploy dengan Docker](#deploy-dengan-docker)
7. [Setup SSL dengan Let's Encrypt](#setup-ssl-dengan-lets-encrypt)
8. [Setup Monitoring](#setup-monitoring)
9. [Backup dan Maintenance](#backup-dan-maintenance)
10. [Troubleshooting](#troubleshooting)

## 🖥️ Persyaratan Sistem

### Minimum Requirements
- **OS**: Ubuntu 20.04 LTS atau 22.04 LTS
- **RAM**: 4GB (8GB recommended)
- **Storage**: 50GB SSD
- **CPU**: 2 cores
- **Network**: Koneksi internet stabil

### Recommended Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 8GB atau lebih
- **Storage**: 100GB SSD
- **CPU**: 4 cores atau lebih
- **Network**: Koneksi internet dengan bandwidth tinggi

## 🔧 Persiapan Server Ubuntu

### 1. Update Sistem

```bash
# Update package list
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git vim htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### 2. Setup Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH (sesuaikan port jika bukan 22)
sudo ufw allow 22

# Allow HTTP dan HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow port untuk development (opsional)
sudo ufw allow 3000
sudo ufw allow 3001

# Check status
sudo ufw status
```

### 3. Setup User Non-Root

```bash
# Buat user baru (ganti 'wagateway' dengan username yang diinginkan)
sudo adduser wagateway

# Tambahkan ke grup sudo
sudo usermod -aG sudo wagateway

# Switch ke user baru
su - wagateway
```

## 📦 Installasi Dependencies

### 1. Install Docker

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package list
sudo apt update

# Install Docker
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Enable Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Verify installation
docker --version
docker compose version
```

### 2. Install Docker Compose (jika belum terinstall)

```bash
# Install Docker Compose
sudo apt install -y docker-compose

# Verify installation
docker-compose --version
```

### 3. Install Node.js (untuk development)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install Nginx (untuk reverse proxy)

```bash
# Install Nginx
sudo apt install -y nginx

# Enable dan start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

## 🗄️ Setup Database

### 1. Install MySQL (opsional, jika tidak menggunakan Docker)

```bash
# Install MySQL Server
sudo apt install -y mysql-server

# Secure MySQL installation
sudo mysql_secure_installation

# Create database dan user
sudo mysql -u root -p
```

```sql
-- Di dalam MySQL console
CREATE DATABASE wa_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wa_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON wa_gateway.* TO 'wa_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Install Redis (opsional, jika tidak menggunakan Docker)

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis
sudo vim /etc/redis/redis.conf

# Enable Redis service
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Check status
sudo systemctl status redis-server
```

## ⚙️ Konfigurasi Environment

### 1. Clone Repository

```bash
# Clone repository
git clone <repository-url> wa-gateway
cd wa-gateway

# Atau jika sudah ada, pull latest changes
git pull origin main
```

### 2. Setup Environment Files

```bash
# Copy environment files
cp docker.env.example .env
cp backend/env.example backend/.env

# Edit environment files
nano .env
nano backend/.env
```

### 3. Konfigurasi .env untuk Production

```bash
# Edit file .env
nano .env
```

```env
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MYSQL_ROOT_PASSWORD=your_strong_root_password
MYSQL_DATABASE=wa_gateway
MYSQL_USER=wa_user
MYSQL_PASSWORD=your_strong_password

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=production
PORT=3000

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-change-this-in-production

# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================
NUXT_PUBLIC_API_URL=https://yourdomain.com
NUXT_PUBLIC_WS_URL=wss://yourdomain.com

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW=15
RATE_LIT_MAX=100
```

### 4. Konfigurasi backend/.env

```bash
# Edit file backend/.env
nano backend/.env
```

```env
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=wa_gateway
DB_USER=wa_user
DB_PASSWORD=your_strong_password
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=WA Gateway <noreply@yourdomain.com>

# File Upload Configuration
UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=16777216

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/sessions
WHATSAPP_QR_TIMEOUT=60000
WHATSAPP_CONNECTION_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
CORS_ORIGIN=https://yourdomain.com

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Cache Configuration
CACHE_TTL=3600
CACHE_PREFIX=wagateway:

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret-key-change-this-in-production
WEBHOOK_TIMEOUT=10000

# Production Settings
DEBUG=false
ENABLE_SWAGGER=false
ENABLE_CORS=true
```

## 🐳 Deploy dengan Docker

### 1. Build dan Start Services

```bash
# Build dan start semua services
docker compose up -d --build

# Check status containers
docker compose ps

# View logs
docker compose logs -f
```

### 2. Setup Database Migrations

```bash
# Run database migrations
docker compose exec backend npm run migrate

# Seed database (opsional)
docker compose exec backend npm run seed
```

### 3. Verify Deployment

```bash
# Check if all services are running
docker compose ps

# Test API endpoint
curl http://localhost/api/health

# Test frontend
curl http://localhost
```

## 🔒 Setup SSL dengan Let's Encrypt

### 1. Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop Nginx sementara
sudo systemctl stop nginx
```

### 2. Generate SSL Certificate

```bash
# Generate certificate (ganti yourdomain.com dengan domain Anda)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Atau jika menggunakan Nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Update Nginx Configuration

```bash
# Edit Nginx configuration
sudo nano /etc/nginx/sites-available/wa-gateway
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API Routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Enable Site dan Restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/wa-gateway /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5. Setup Auto-Renewal

```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e

# Add this line
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Setup Monitoring

### 1. Install Monitoring Tools

```bash
# Install htop untuk monitoring system
sudo apt install -y htop iotop nethogs

# Install log monitoring
sudo apt install -y logrotate
```

### 2. Setup Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/wa-gateway
```

```
/var/log/wa-gateway/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 wagateway wagateway
    postrotate
        docker compose restart backend
    endscript
}
```

### 3. Setup System Monitoring Script

```bash
# Create monitoring script
nano ~/monitor.sh
```

```bash
#!/bin/bash

# WA Gateway Monitoring Script
echo "=== WA Gateway System Status ==="
echo "Date: $(date)"
echo

# Check Docker containers
echo "=== Docker Containers ==="
docker compose ps

echo
echo "=== System Resources ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)"

echo "Memory Usage:"
free -h

echo "Disk Usage:"
df -h

echo
echo "=== Application Logs (Last 10 lines) ==="
docker compose logs --tail=10 backend
```

```bash
# Make executable
chmod +x ~/monitor.sh

# Add to crontab untuk monitoring harian
crontab -e

# Add this line
0 9 * * * /home/wagateway/monitor.sh >> /var/log/wa-gateway-monitor.log
```

## 💾 Backup dan Maintenance

### 1. Setup Database Backup

```bash
# Create backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash

# Database backup script
BACKUP_DIR="/home/wagateway/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wa_gateway_backup_$DATE.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
docker compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD wa_gateway > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

```bash
# Make executable
chmod +x ~/backup-db.sh

# Add to crontab untuk backup harian
crontab -e

# Add this line
0 2 * * * /home/wagateway/backup-db.sh
```

### 2. Setup File Backup

```bash
# Create file backup script
nano ~/backup-files.sh
```

```bash
#!/bin/bash

# File backup script
BACKUP_DIR="/home/wagateway/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="wa_gateway_files_$DATE.tar.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup uploads and sessions
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    /home/wagateway/wa-gateway/backend/uploads \
    /home/wagateway/wa-gateway/backend/sessions \
    /home/wagateway/wa-gateway/backend/logs

# Remove backups older than 30 days
find $BACKUP_DIR -name "wa_gateway_files_*.tar.gz" -mtime +30 -delete

echo "File backup completed: $BACKUP_FILE"
```

```bash
# Make executable
chmod +x ~/backup-files.sh

# Add to crontab untuk backup mingguan
crontab -e

# Add this line
0 3 * * 0 /home/wagateway/backup-files.sh
```

### 3. Setup Update Script

```bash
# Create update script
nano ~/update-app.sh
```

```bash
#!/bin/bash

# Application update script
cd /home/wagateway/wa-gateway

echo "=== Updating WA Gateway ==="
echo "Date: $(date)"

# Pull latest changes
git pull origin main

# Backup current database
./backup-db.sh

# Rebuild and restart containers
docker compose down
docker compose up -d --build

# Wait for services to start
sleep 30

# Check if services are running
docker compose ps

echo "Update completed!"
```

```bash
# Make executable
chmod +x ~/update-app.sh
```

## 🔧 Troubleshooting

### 1. Common Issues

#### Container tidak bisa start
```bash
# Check logs
docker compose logs backend
docker compose logs frontend
docker compose logs mysql

# Check container status
docker compose ps

# Restart specific service
docker compose restart backend
```

#### Database connection error
```bash
# Check MySQL container
docker compose exec mysql mysql -u root -p

# Check database exists
docker compose exec mysql mysql -u root -p -e "SHOW DATABASES;"

# Reset database
docker compose exec mysql mysql -u root -p -e "DROP DATABASE wa_gateway; CREATE DATABASE wa_gateway;"
```

#### Port sudah digunakan
```bash
# Check port usage
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Kill process using port
sudo kill -9 <PID>
```

#### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx configuration
sudo nginx -t
```

### 2. Performance Optimization

#### Optimize Docker
```bash
# Clean up unused containers and images
docker system prune -a

# Check disk usage
docker system df
```

#### Optimize MySQL
```bash
# Edit MySQL configuration
docker compose exec mysql mysql -u root -p

# Add to my.cnf
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
```

#### Optimize Nginx
```bash
# Edit Nginx configuration
sudo nano /etc/nginx/nginx.conf

# Add these settings
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 3. Security Hardening

#### Update system regularly
```bash
# Create update script
nano ~/system-update.sh
```

```bash
#!/bin/bash
sudo apt update && sudo apt upgrade -y
sudo apt autoremove -y
sudo apt autoclean
```

#### Setup fail2ban
```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
```

```bash
# Start fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📞 Support dan Maintenance

### 1. Regular Maintenance Tasks

- **Daily**: Monitor system resources dan application logs
- **Weekly**: Check SSL certificate status dan update system
- **Monthly**: Review security logs dan update dependencies
- **Quarterly**: Full system backup dan disaster recovery test

### 2. Monitoring Checklist

- [ ] Docker containers running
- [ ] Database connectivity
- [ ] SSL certificate valid
- [ ] Disk space available
- [ ] Memory usage normal
- [ ] CPU usage normal
- [ ] Network connectivity
- [ ] Application logs clean

### 3. Emergency Procedures

#### Server down
1. Check server status: `sudo systemctl status nginx`
2. Check Docker: `docker compose ps`
3. Restart services: `docker compose restart`
4. Check logs: `docker compose logs -f`

#### Database corruption
1. Stop application: `docker compose stop backend`
2. Restore from backup: `./backup-db.sh`
3. Restart services: `docker compose start backend`

#### SSL certificate expired
1. Renew certificate: `sudo certbot renew`
2. Restart Nginx: `sudo systemctl restart nginx`
3. Check status: `sudo certbot certificates`

## 🎯 Kesimpulan

Panduan ini memberikan langkah-langkah lengkap untuk deploy WA Gateway ke Ubuntu server. Pastikan untuk:

1. **Security**: Selalu gunakan password yang kuat dan update sistem secara berkala
2. **Backup**: Setup backup otomatis untuk database dan files
3. **Monitoring**: Monitor sistem secara berkala untuk mencegah masalah
4. **SSL**: Gunakan SSL certificate untuk keamanan
5. **Updates**: Update aplikasi dan dependencies secara berkala

Untuk pertanyaan atau bantuan lebih lanjut, silakan buat issue di repository atau hubungi tim support.

---

**Catatan**: Ganti semua placeholder seperti `yourdomain.com`, `your-email@gmail.com`, dan password dengan nilai yang sesuai dengan environment Anda.
