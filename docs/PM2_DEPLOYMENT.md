# 🚀 Panduan Deploy WA Gateway dengan PM2 di Ubuntu

Panduan lengkap untuk deploy WA Gateway backend menggunakan PM2 sebagai process manager di Ubuntu server.

## 📋 Daftar Isi

1. [Persyaratan](#persyaratan)
2. [Installasi PM2](#installasi-pm2)
3. [Konfigurasi PM2](#konfigurasi-pm2)
4. [Deploy dengan PM2](#deploy-dengan-pm2)
5. [Management PM2](#management-pm2)
6. [Monitoring dan Logging](#monitoring-dan-logging)
7. [Auto Start on Boot](#auto-start-on-boot)
8. [Troubleshooting](#troubleshooting)

## ✅ Persyaratan

- Ubuntu 20.04 LTS atau 22.04 LTS
- Node.js 18.x atau lebih tinggi
- MySQL database sudah terkonfigurasi
- Backend WA Gateway sudah siap untuk production

## 📦 Installasi PM2

### 1. Install PM2 secara global

```bash
# Install PM2
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### 2. Setup PM2 Logging

```bash
# Install PM2 log rotation (untuk menghindari log files terlalu besar)
pm2 install pm2-logrotate

# Konfigurasi log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## ⚙️ Konfigurasi PM2

### 1. File ecosystem.config.js

File `ecosystem.config.js` sudah tersedia di folder backend dengan konfigurasi:

```javascript
module.exports = {
  apps: [{
    name: 'klikwhatsapp-backend',
    script: 'server.js',
    instances: 'max', // Cluster mode
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    max_memory_restart: '1G',
    // ... konfigurasi lengkap di ecosystem.config.js
  }]
}
```

### 2. Customize Konfigurasi (Opsional)

Edit file `ecosystem.config.js` sesuai kebutuhan:

```bash
nano backend/ecosystem.config.js
```

**Opsi Konfigurasi:**
- `instances`: Jumlah instances (misal: `2` untuk 2 instances, atau `'max'` untuk semua CPU cores)
- `max_memory_restart`: Memory limit sebelum restart (misal: `'1G'`, `'500M'`)
- `watch`: Enable/disable auto-restart pada file changes (default: `false` untuk production)
- `node_args`: Node.js arguments (misal: `'--max-old-space-size=2048'`)

## 🚀 Deploy dengan PM2

### 1. Persiapan Environment

```bash
# Masuk ke direktori backend
cd backend

# Pastikan environment variables sudah dikonfigurasi
cp .env.example .env
nano .env

# Install dependencies
npm install --production
```

### 2. Start Aplikasi dengan PM2

```bash
# Start aplikasi menggunakan ecosystem config
pm2 start ecosystem.config.js

# Atau start langsung tanpa config file
pm2 start server.js --name klikwhatsapp-backend --env production
```

### 3. Verifikasi Deployment

```bash
# Check status aplikasi
pm2 status

# Check logs
pm2 logs klikwhatsapp-backend

# Check info detail
pm2 info klikwhatsapp-backend

# Test API endpoint
curl http://localhost:3001/health
```

### 4. Save PM2 Configuration

```bash
# Save current PM2 process list untuk auto-start on boot
pm2 save

# Setup PM2 untuk auto-start on system boot
pm2 startup

# Ikuti instruksi yang ditampilkan (biasanya perlu run command sebagai sudo)
```

## 🔧 Management PM2

### Commands Dasar

```bash
# List semua aplikasi
pm2 list
pm2 ls

# Start aplikasi
pm2 start klikwhatsapp-backend
pm2 start ecosystem.config.js

# Stop aplikasi
pm2 stop klikwhatsapp-backend
pm2 stop all

# Restart aplikasi
pm2 restart klikwhatsapp-backend
pm2 restart all

# Reload aplikasi (graceful restart - zero downtime)
pm2 reload klikwhatsapp-backend
pm2 reload all

# Delete aplikasi dari PM2
pm2 delete klikwhatsapp-backend
pm2 delete all

# Monitor aplikasi (real-time)
pm2 monit

# Show logs
pm2 logs klikwhatsapp-backend
pm2 logs --lines 100  # Show 100 lines terakhir

# Clear logs
pm2 flush

# Show application info
pm2 info klikwhatsapp-backend

# Show process list dengan detail
pm2 jlist
```

### Update dan Deploy Ulang

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies jika ada update
npm install --production

# 3. Reload aplikasi (zero downtime)
pm2 reload klikwhatsapp-backend

# Atau restart jika perlu full restart
pm2 restart klikwhatsapp-backend

# 4. Check status
pm2 status
pm2 logs klikwhatsapp-backend --lines 50
```

## 📊 Monitoring dan Logging

### 1. Real-time Monitoring

```bash
# Monitor aplikasi dengan dashboard
pm2 monit

# Monitor dengan metrics detail
pm2 show klikwhatsapp-backend
```

### 2. Log Management

```bash
# View logs
pm2 logs klikwhatsapp-backend

# View logs dengan filter
pm2 logs klikwhatsapp-backend --err  # Hanya error logs
pm2 logs klikwhatsapp-backend --out  # Hanya output logs

# View logs dengan format JSON
pm2 logs --json

# Export logs
pm2 logs klikwhatsapp-backend --lines 1000 > logs-backup.txt
```

### 3. Log Rotation

```bash
# Setup log rotation (sudah diinstall sebelumnya)
pm2 install pm2-logrotate

# Check log rotate settings
pm2 conf pm2-logrotate

# Manual rotate logs
pm2 flush
```

### 4. Performance Monitoring

```bash
# Show real-time metrics
pm2 monit

# Check memory usage
pm2 show klikwhatsapp-backend | grep memory

# Check CPU usage
pm2 show klikwhatsapp-backend | grep cpu
```

## 🔄 Auto Start on Boot

### 1. Setup Startup Script

```bash
# Generate startup script
pm2 startup

# Output akan seperti ini:
# [PM2] Init System found: systemd
# [PM2] To setup the Startup Script, copy/paste the following command:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Jalankan command yang ditampilkan (ganti $USER dengan username Anda)
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u wagateway --hp /home/wagateway

# Save current PM2 process list
pm2 save
```

### 2. Verify Auto Start

```bash
# Test dengan restart server
sudo reboot

# Setelah reboot, check PM2 status
pm2 status
```

## 🔧 Advanced Configuration

### 1. Cluster Mode untuk Load Balancing

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'klikwhatsapp-backend',
    script: 'server.js',
    instances: 4, // 4 instances untuk load balancing
    exec_mode: 'cluster'
  }]
}
```

### 2. Environment-specific Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'klikwhatsapp-backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_staging: {
      NODE_ENV: 'staging',
      PORT: 3002
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3001
    }
  }]
}

// Start dengan environment tertentu
pm2 start ecosystem.config.js --env staging
```

### 3. Custom Restart Strategy

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'klikwhatsapp-backend',
    script: 'server.js',
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    cron_restart: '0 3 * * *' // Restart setiap hari jam 3 pagi
  }]
}
```

## 🛠️ Scripts Helper

### 1. Create PM2 Management Script

```bash
# Create script helper
nano ~/pm2-manage.sh
```

```bash
#!/bin/bash

APP_NAME="klikwhatsapp-backend"
ACTION=$1

case $ACTION in
  start)
    pm2 start ecosystem.config.js
    ;;
  stop)
    pm2 stop $APP_NAME
    ;;
  restart)
    pm2 restart $APP_NAME
    ;;
  reload)
    pm2 reload $APP_NAME
    ;;
  status)
    pm2 status
    ;;
  logs)
    pm2 logs $APP_NAME --lines 100
    ;;
  monitor)
    pm2 monit
    ;;
  deploy)
    git pull origin main
    npm install --production
    pm2 reload $APP_NAME
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|reload|status|logs|monitor|deploy}"
    exit 1
    ;;
esac
```

```bash
# Make executable
chmod +x ~/pm2-manage.sh

# Usage
~/pm2-manage.sh start
~/pm2-manage.sh deploy
```

## 📊 Monitoring Dashboard

### 1. PM2 Plus (Cloud Monitoring)

```bash
# Link PM2 dengan PM2 Plus (free tier)
pm2 link <secret_key> <public_key>

# Access dashboard di https://app.pm2.io
```

### 2. Local Monitoring

```bash
# Use PM2 web interface
pm2 web

# Access di http://localhost:9615
```

## 🔍 Troubleshooting

### 1. Application Tidak Start

```bash
# Check logs
pm2 logs klikwhatsapp-backend --err

# Check application info
pm2 info klikwhatsapp-backend

# Check if port already in use
sudo netstat -tulpn | grep 3001

# Restart PM2 daemon
pm2 kill
pm2 resurrect
```

### 2. Memory Issues

```bash
# Check memory usage
pm2 show klikwhatsapp-backend | grep memory

# Reduce instances atau adjust max_memory_restart
# Edit ecosystem.config.js:
# instances: 2  # Kurangi dari 'max'
# max_memory_restart: '500M'  # Kurangi limit
```

### 3. Log Files Terlalu Besar

```bash
# Clear logs
pm2 flush

# Setup log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 4. Auto-start Tidak Bekerja

```bash
# Re-run startup script
pm2 startup
# Follow instructions

# Save process list
pm2 save

# Test dengan reboot
sudo reboot
```

### 5. Application Crashes

```bash
# Check error logs
pm2 logs klikwhatsapp-backend --err --lines 100

# Check restart count
pm2 show klikwhatsapp-backend | grep restart

# Check if max_restarts reached
pm2 info klikwhatsapp-backend
```

## 📋 Checklist Deploy

### Pre-Deployment
- [ ] Environment variables dikonfigurasi dengan benar
- [ ] Database sudah terhubung dan migrated
- [ ] Dependencies sudah diinstall (`npm install --production`)
- [ ] Test aplikasi berjalan dengan baik (`npm start`)

### Deployment
- [ ] PM2 terinstall (`pm2 --version`)
- [ ] File `ecosystem.config.js` sudah dikonfigurasi
- [ ] Start aplikasi dengan PM2 (`pm2 start ecosystem.config.js`)
- [ ] Verify aplikasi running (`pm2 status`)
- [ ] Test API endpoint (`curl http://localhost:3001/health`)

### Post-Deployment
- [ ] Setup auto-start on boot (`pm2 startup` + `pm2 save`)
- [ ] Setup log rotation (`pm2 install pm2-logrotate`)
- [ ] Monitor aplikasi (`pm2 monit`)
- [ ] Check logs (`pm2 logs`)

## 🎯 Best Practices

1. **Always use PM2 in production** untuk process management
2. **Use cluster mode** untuk load balancing jika diperlukan
3. **Setup log rotation** untuk menghindari log files terlalu besar
4. **Monitor memory usage** dan set `max_memory_restart` sesuai kebutuhan
5. **Use reload instead of restart** untuk zero downtime deployment
6. **Save PM2 configuration** setelah setiap perubahan
7. **Test auto-start** setelah setup startup script
8. **Regular monitoring** dengan `pm2 monit` atau PM2 Plus

## 📚 Referensi

- [PM2 Official Documentation](https://pm2.keymetrics.io/)
- [PM2 Ecosystem File](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)

---

**Status**: ✅ **READY FOR DEPLOYMENT** - Backend WA Gateway siap di-deploy dengan PM2 di Ubuntu server
