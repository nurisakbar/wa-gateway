# WA Gateway - Troubleshooting Guide

## 🚨 Common Issues & Solutions

### 1. WhatsApp Connection Issues

#### Problem: QR Code tidak muncul
**Symptoms:**
- QR code tidak generate
- Error "Failed to generate QR code"
- Device stuck di status "connecting"

**Solutions:**
```bash
# 1. Clear session files
rm -rf sessions/*

# 2. Restart WhatsApp service
pm2 restart wagateway-backend

# 3. Check logs
tail -f logs/app.log | grep -i qr

# 4. Verify Baileys version
npm list @whiskeysockets/baileys
```

**Prevention:**
- Pastikan WhatsApp Web tidak login di browser lain
- Gunakan nomor yang belum terdaftar di WhatsApp Web
- Tunggu 2-3 menit sebelum scan QR code

#### Problem: Device terputus setelah scan QR
**Symptoms:**
- Device connected lalu disconnected
- Error "Connection lost"
- Status berubah ke "error"

**Solutions:**
```bash
# 1. Check session validity
ls -la sessions/

# 2. Clear and regenerate session
rm -rf sessions/device_*
pm2 restart wagateway-backend

# 3. Check WhatsApp Web status
# Pastikan tidak ada login di browser lain
```

#### Problem: Message tidak terkirim
**Symptoms:**
- Message stuck di status "pending"
- Error "Message failed to send"
- No delivery confirmation

**Solutions:**
```bash
# 1. Check device status
curl http://localhost:3001/api/v1/devices/status

# 2. Verify phone number format
# Pastikan format: 6281234567890 (tanpa +)

# 3. Check message logs
tail -f logs/app.log | grep -i message

# 4. Restart device connection
curl -X POST http://localhost:3001/api/v1/devices/reconnect
```

### 2. File Upload Issues

#### Problem: File upload gagal
**Symptoms:**
- Error "File too large"
- Error "Invalid file type"
- Upload stuck di progress

**Solutions:**
```bash
# 1. Check file size limit
# Default: 16MB (WhatsApp limit)
# Edit .env: MAX_FILE_SIZE=16777216

# 2. Check allowed file types
# Edit .env: ALLOWED_FILE_TYPES=image/*,video/*,audio/*,.pdf,.doc,.docx

# 3. Check upload directory permissions
ls -la uploads/
chmod 755 uploads/
chown -R node:node uploads/

# 4. Check disk space
df -h
```

#### Problem: File tidak terkirim via WhatsApp
**Symptoms:**
- File uploaded tapi tidak terkirim
- Error "File not found"
- File corrupted

**Solutions:**
```bash
# 1. Verify file exists
ls -la uploads/

# 2. Check file permissions
chmod 644 uploads/*

# 3. Verify file integrity
file uploads/filename.ext

# 4. Check file size vs WhatsApp limit
# WhatsApp limit: 16MB untuk file, 100MB untuk video
```

### 3. Database Issues

#### Problem: Database connection failed
**Symptoms:**
- Error "ECONNREFUSED"
- Error "Access denied"
- Application tidak bisa start

**Solutions:**
```bash
# 1. Check MySQL status
sudo systemctl status mysql

# 2. Start MySQL if stopped
sudo systemctl start mysql

# 3. Test connection
mysql -u wagateway -p -h localhost wagateway

# 4. Check credentials in .env
cat .env | grep DB_
```

#### Problem: Database queries slow
**Symptoms:**
- API response lambat
- Timeout errors
- High CPU usage

**Solutions:**
```sql
-- 1. Check slow queries
SHOW PROCESSLIST;

-- 2. Add missing indexes
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_files_user_created ON files(user_id, created_at);

-- 3. Optimize tables
OPTIMIZE TABLE messages;
OPTIMIZE TABLE files;

-- 4. Check table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'wagateway';
```

### 4. API Issues

#### Problem: Authentication failed
**Symptoms:**
- Error "Unauthorized"
- Token expired
- Login tidak berhasil

**Solutions:**
```bash
# 1. Check JWT secret
cat .env | grep JWT_SECRET

# 2. Verify token format
# Format: Bearer <token>

# 3. Check token expiration
# Default: 7 days, edit JWT_EXPIRES_IN di .env

# 4. Clear browser cache/cookies
```

#### Problem: API rate limiting
**Symptoms:**
- Error "Too many requests"
- API calls blocked
- Slow response

**Solutions:**
```javascript
// 1. Check rate limit configuration
// Edit rate limit settings in middleware

// 2. Implement exponential backoff
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 3. Use bulk endpoints for multiple operations
```

### 5. Frontend Issues

#### Problem: React app tidak load
**Symptoms:**
- White screen
- Console errors
- Network errors

**Solutions:**
```bash
# 1. Check API URL configuration
cat frontend/.env | grep REACT_APP_API_URL

# 2. Verify backend is running
curl http://localhost:3001/api/v1/health

# 3. Clear browser cache
# Ctrl+Shift+R (hard refresh)

# 4. Check console errors
# F12 -> Console tab
```

#### Problem: WebSocket connection failed
**Symptoms:**
- Real-time updates tidak work
- Connection errors
- Status tidak update

**Solutions:**
```bash
# 1. Check WebSocket URL
cat frontend/.env | grep REACT_APP_WS_URL

# 2. Verify Socket.io server
curl http://localhost:3001/socket.io/

# 3. Check firewall settings
sudo ufw status

# 4. Test WebSocket connection
wscat -c ws://localhost:3001/socket
```

### 6. Performance Issues

#### Problem: High memory usage
**Symptoms:**
- Application crash
- Slow response
- Memory leaks

**Solutions:**
```bash
# 1. Check memory usage
free -h
top -p $(pgrep node)

# 2. Restart application
pm2 restart wagateway-backend

# 3. Check for memory leaks
# Monitor memory usage over time

# 4. Optimize database queries
# Use pagination, limit results
```

#### Problem: Slow file uploads
**Symptoms:**
- Upload timeout
- Progress stuck
- Network errors

**Solutions:**
```bash
# 1. Check network speed
speedtest-cli

# 2. Increase timeout settings
# Edit .env: UPLOAD_TIMEOUT=300000

# 3. Use chunked uploads
# Implement file chunking

# 4. Check server resources
htop
```

## 🔧 Debug Commands

### Check Application Status
```bash
# Check all services
pm2 status
systemctl status mysql
systemctl status nginx

# Check ports
netstat -tulpn | grep :3001
netstat -tulpn | grep :3306

# Check logs
tail -f logs/app.log
tail -f logs/error.log
```

### Database Debug
```sql
-- Check table sizes
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables 
WHERE table_schema = 'wagateway'
ORDER BY (data_length + index_length) DESC;

-- Check slow queries
SHOW PROCESSLIST;

-- Check table status
CHECK TABLE messages;
CHECK TABLE files;
```

### Network Debug
```bash
# Test API endpoints
curl -X GET http://localhost:3001/api/v1/health
curl -X GET http://localhost:3001/api/v1/devices

# Test WebSocket
wscat -c ws://localhost:3001/socket

# Check DNS
nslookup your-domain.com

# Test SSL
openssl s_client -connect your-domain.com:443
```

## 📊 Monitoring Commands

### System Resources
```bash
# CPU and Memory
htop
top -p $(pgrep node)

# Disk usage
df -h
du -sh uploads/
du -sh sessions/

# Network
iftop
netstat -i
```

### Application Metrics
```bash
# PM2 monitoring
pm2 monit
pm2 logs wagateway-backend --lines 100

# Database connections
mysql -e "SHOW PROCESSLIST;" wagateway

# File count
find uploads/ -type f | wc -l
find sessions/ -type f | wc -l
```

## 🚨 Emergency Procedures

### Application Crash
```bash
# 1. Stop all services
pm2 stop all
sudo systemctl stop nginx

# 2. Check error logs
tail -f logs/error.log

# 3. Restart services
pm2 start ecosystem.config.js
sudo systemctl start nginx

# 4. Verify status
pm2 status
curl http://localhost:3001/api/v1/health
```

### Database Corruption
```bash
# 1. Stop application
pm2 stop wagateway-backend

# 2. Backup current data
mysqldump -u wagateway -p wagateway > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Repair database
mysqlcheck -u wagateway -p --repair wagateway

# 4. Restart application
pm2 start wagateway-backend
```

### Security Breach
```bash
# 1. Stop all services
pm2 stop all
sudo systemctl stop nginx

# 2. Change passwords
mysql -u root -p -e "ALTER USER 'wagateway'@'localhost' IDENTIFIED BY 'new_password';"

# 3. Regenerate JWT secret
# Edit .env: JWT_SECRET=new-secret-key

# 4. Check for suspicious activity
grep -i "error\|failed\|unauthorized" logs/app.log

# 5. Restart with new credentials
pm2 start ecosystem.config.js
```

## 📞 Support Contacts

### Log Files Location
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Nginx logs: `/var/log/nginx/`
- MySQL logs: `/var/log/mysql/`

### Useful Commands
```bash
# View real-time logs
tail -f logs/app.log

# Search for specific errors
grep -i "error" logs/app.log

# Check disk space
df -h

# Monitor system resources
htop

# Check network connectivity
ping google.com
```

### Emergency Contacts
- **System Administrator**: admin@wagateway.com
- **Database Admin**: db-admin@wagateway.com
- **Security Team**: security@wagateway.com

## 🔄 Recovery Procedures

### From Backup
```bash
# 1. Stop application
pm2 stop wagateway-backend

# 2. Restore database
mysql -u wagateway -p wagateway < backup_20231201_120000.sql

# 3. Restore files
tar -xzf uploads_backup_20231201.tar.gz
tar -xzf sessions_backup_20231201.tar.gz

# 4. Restart application
pm2 start wagateway-backend
```

### Fresh Installation
```bash
# 1. Backup current data
mysqldump -u wagateway -p wagateway > final_backup.sql

# 2. Clean installation
rm -rf node_modules/
rm -rf uploads/*
rm -rf sessions/*

# 3. Reinstall dependencies
npm install

# 4. Restore data
mysql -u wagateway -p wagateway < final_backup.sql
``` 