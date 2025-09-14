# 📚 WA Gateway - Deployment Documentation Index

Index lengkap semua dokumentasi deployment dan maintenance WA Gateway.

## 🚀 Quick Start

### [UBUNTU_QUICK_START.md](../UBUNTU_QUICK_START.md)
**Panduan cepat deployment dalam 3 langkah**
- Setup server Ubuntu
- Deploy aplikasi
- Verifikasi deployment

## 📖 Panduan Lengkap

### [UBUNTU_DEPLOYMENT.md](UBUNTU_DEPLOYMENT.md)
**Panduan lengkap deployment ke Ubuntu server**
- Persyaratan sistem
- Persiapan server Ubuntu
- Installasi dependencies
- Setup database
- Konfigurasi environment
- Deploy dengan Docker
- Setup SSL dengan Let's Encrypt
- Setup monitoring
- Backup dan maintenance
- Troubleshooting

### [SSL_SETUP_GUIDE.md](SSL_SETUP_GUIDE.md)
**Panduan khusus setup SSL dengan Let's Encrypt**
- Persyaratan SSL
- Installasi Certbot
- Setup domain dan DNS
- Generate SSL certificate
- Konfigurasi Nginx
- Auto-renewal
- Troubleshooting SSL
- Security hardening

### [MONITORING_BACKUP_GUIDE.md](MONITORING_BACKUP_GUIDE.md)
**Panduan monitoring dan backup**
- Monitoring system
- Application monitoring
- Database backup
- File backup
- Log management
- Alert system
- Maintenance scripts

## 🛠️ Scripts

### [scripts/README.md](../scripts/README.md)
**Dokumentasi semua scripts deployment**
- setup-ubuntu-server.sh
- deploy.sh
- Maintenance commands
- Troubleshooting

### [scripts/setup-ubuntu-server.sh](../scripts/setup-ubuntu-server.sh)
**Script otomatis setup server Ubuntu**
- Install Docker & Docker Compose
- Install Node.js 18.x
- Install Nginx
- Install Certbot
- Setup firewall
- Setup fail2ban
- Setup monitoring & backup

### [scripts/deploy.sh](../scripts/deploy.sh)
**Script otomatis deployment WA Gateway**
- Clone/update repository
- Setup environment files
- Konfigurasi Nginx
- Deploy dengan Docker
- Setup SSL
- Run migrations
- Verifikasi deployment

## 📋 Checklist Deployment

### Prerequisites
- [ ] Ubuntu 20.04/22.04/24.04 LTS
- [ ] Minimum 4GB RAM (8GB recommended)
- [ ] Minimum 50GB SSD storage
- [ ] Domain name yang valid
- [ ] DNS A record mengarah ke server IP
- [ ] Port 80 dan 443 terbuka

### Setup Server
- [ ] Update sistem Ubuntu
- [ ] Install Docker & Docker Compose
- [ ] Install Node.js 18.x
- [ ] Install Nginx
- [ ] Install Certbot
- [ ] Setup firewall (UFW)
- [ ] Setup fail2ban
- [ ] Create user 'wagateway'

### Deploy Application
- [ ] Clone repository
- [ ] Setup environment files
- [ ] Konfigurasi Nginx
- [ ] Deploy dengan Docker
- [ ] Run database migrations
- [ ] Setup SSL certificate
- [ ] Verifikasi deployment

### Post-Deployment
- [ ] Setup monitoring scripts
- [ ] Setup backup scripts
- [ ] Setup log rotation
- [ ] Test semua endpoints
- [ ] Setup alert system
- [ ] Dokumentasi deployment

## 🔧 Maintenance

### Daily Tasks
- [ ] Monitor system resources
- [ ] Check application logs
- [ ] Verify backup status
- [ ] Check SSL certificate status

### Weekly Tasks
- [ ] Review security logs
- [ ] Update system packages
- [ ] Clean old backup files
- [ ] Test disaster recovery

### Monthly Tasks
- [ ] Review performance metrics
- [ ] Update application dependencies
- [ ] Security audit
- [ ] Capacity planning

## 🚨 Emergency Procedures

### Server Down
1. Check server status: `sudo systemctl status nginx`
2. Check Docker: `docker compose ps`
3. Restart services: `docker compose restart`
4. Check logs: `docker compose logs -f`

### Database Corruption
1. Stop application: `docker compose stop backend`
2. Restore from backup: `./backup-db.sh`
3. Restart services: `docker compose start backend`

### SSL Certificate Expired
1. Renew certificate: `sudo certbot renew`
2. Restart Nginx: `sudo systemctl restart nginx`
3. Check status: `sudo certbot certificates`

## 📊 Monitoring Dashboard

Jalankan monitoring dashboard untuk melihat status sistem:

```bash
sudo /usr/local/bin/monitoring-dashboard.sh
```

## 🔍 Troubleshooting

### Common Issues
- [Container tidak bisa start](UBUNTU_DEPLOYMENT.md#troubleshooting)
- [Database connection error](UBUNTU_DEPLOYMENT.md#troubleshooting)
- [SSL certificate issues](SSL_SETUP_GUIDE.md#troubleshooting)
- [Port sudah digunakan](UBUNTU_DEPLOYMENT.md#troubleshooting)

### Log Files
- Application logs: `docker compose logs`
- System logs: `/var/log/wa-gateway/`
- Nginx logs: `/var/log/nginx/`
- SSL logs: `sudo certbot certificates`

## 📞 Support

Jika mengalami masalah:

1. **Check logs** terlebih dahulu
2. **Baca dokumentasi** yang relevan
3. **Search issues** di repository
4. **Buat issue baru** jika belum ada solusi

## 🔄 Update Documentation

Untuk update dokumentasi ke versi terbaru:

```bash
git pull origin main
```

## 📝 Changelog

### v1.0.0
- ✅ Initial release
- ✅ Ubuntu deployment guide
- ✅ SSL setup guide
- ✅ Monitoring & backup guide
- ✅ Automated deployment scripts
- ✅ Comprehensive documentation

---

**Catatan**: Semua dokumentasi ini dibuat untuk memudahkan deployment dan maintenance WA Gateway di Ubuntu server.
