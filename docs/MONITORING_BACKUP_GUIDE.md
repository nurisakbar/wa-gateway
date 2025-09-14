# 📊 Panduan Monitoring dan Backup WA Gateway

Panduan lengkap untuk setup monitoring, backup, dan maintenance WA Gateway di Ubuntu server.

## 📋 Daftar Isi

1. [Monitoring System](#monitoring-system)
2. [Application Monitoring](#application-monitoring)
3. [Database Backup](#database-backup)
4. [File Backup](#file-backup)
5. [Log Management](#log-management)
6. [Alert System](#alert-system)
7. [Maintenance Scripts](#maintenance-scripts)

## 🖥️ Monitoring System

### 1. System Resource Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs sysstat

# Create system monitoring script
sudo nano /usr/local/bin/system-monitor.sh
```

```bash
#!/bin/bash

LOG_FILE="/var/log/wa-gateway/system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === System Resource Status ===" >> $LOG_FILE

# CPU Usage
echo "[$DATE] CPU Usage:" >> $LOG_FILE
top -bn1 | grep "Cpu(s)" >> $LOG_FILE

# Memory Usage
echo "[$DATE] Memory Usage:" >> $LOG_FILE
free -h >> $LOG_FILE

# Disk Usage
echo "[$DATE] Disk Usage:" >> $LOG_FILE
df -h >> $LOG_FILE

# Load Average
echo "[$DATE] Load Average:" >> $LOG_FILE
uptime >> $LOG_FILE

# Network Usage
echo "[$DATE] Network Usage:" >> $LOG_FILE
ss -tuln >> $LOG_FILE

echo "[$DATE] === End System Status ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/system-monitor.sh

# Schedule monitoring (every 5 minutes)
sudo crontab -e
# Add: */5 * * * * /usr/local/bin/system-monitor.sh
```

### 2. Docker Container Monitoring

```bash
# Create Docker monitoring script
sudo nano /usr/local/bin/docker-monitor.sh
```

```bash
#!/bin/bash

LOG_FILE="/var/log/wa-gateway/docker-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === Docker Container Status ===" >> $LOG_FILE

# Check if WA Gateway containers are running
cd /home/wagateway/wa-gateway 2>/dev/null || {
    echo "[$DATE] WA Gateway directory not found" >> $LOG_FILE
    exit 1
}

# Container status
echo "[$DATE] Container Status:" >> $LOG_FILE
docker compose ps >> $LOG_FILE 2>&1

# Container resource usage
echo "[$DATE] Container Resource Usage:" >> $LOG_FILE
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" >> $LOG_FILE 2>&1

# Check for failed containers
FAILED_CONTAINERS=$(docker compose ps --filter "status=exited" --format "{{.Name}}" 2>/dev/null)
if [ ! -z "$FAILED_CONTAINERS" ]; then
    echo "[$DATE] WARNING: Failed containers detected: $FAILED_CONTAINERS" >> $LOG_FILE
fi

echo "[$DATE] === End Docker Status ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/docker-monitor.sh

# Schedule monitoring (every 10 minutes)
sudo crontab -e
# Add: */10 * * * * /usr/local/bin/docker-monitor.sh
```

## 📱 Application Monitoring

### 1. API Health Check

```bash
# Create API health check script
sudo nano /usr/local/bin/api-health-check.sh
```

```bash
#!/bin/bash

LOG_FILE="/var/log/wa-gateway/api-health-check.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === API Health Check ===" >> $LOG_FILE

# Check backend API
if curl -s -f http://localhost:3000/api/health > /dev/null; then
    echo "[$DATE] Backend API: OK" >> $LOG_FILE
else
    echo "[$DATE] Backend API: FAILED" >> $LOG_FILE
fi

# Check frontend
if curl -s -f http://localhost:3001 > /dev/null; then
    echo "[$DATE] Frontend: OK" >> $LOG_FILE
else
    echo "[$DATE] Frontend: FAILED" >> $LOG_FILE
fi

# Check Nginx
if curl -s -f http://localhost > /dev/null; then
    echo "[$DATE] Nginx: OK" >> $LOG_FILE
else
    echo "[$DATE] Nginx: FAILED" >> $LOG_FILE
fi

# Check SSL (if configured)
if curl -s -f https://localhost > /dev/null; then
    echo "[$DATE] SSL: OK" >> $LOG_FILE
else
    echo "[$DATE] SSL: FAILED" >> $LOG_FILE
fi

echo "[$DATE] === End API Health Check ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/api-health-check.sh

# Schedule health check (every 2 minutes)
sudo crontab -e
# Add: */2 * * * * /usr/local/bin/api-health-check.sh
```

### 2. Database Monitoring

```bash
# Create database monitoring script
sudo nano /usr/local/bin/db-monitor.sh
```

```bash
#!/bin/bash

LOG_FILE="/var/log/wa-gateway/db-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === Database Status ===" >> $LOG_FILE

cd /home/wagateway/wa-gateway 2>/dev/null || {
    echo "[$DATE] WA Gateway directory not found" >> $LOG_FILE
    exit 1
}

# Check MySQL container
if docker compose ps mysql | grep -q "Up"; then
    echo "[$DATE] MySQL Container: Running" >> $LOG_FILE
    
    # Get MySQL root password
    MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)
    
    if [ ! -z "$MYSQL_ROOT_PASSWORD" ]; then
        # Check database connection
        if docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT 1;" > /dev/null 2>&1; then
            echo "[$DATE] MySQL Connection: OK" >> $LOG_FILE
            
            # Check database size
            DB_SIZE=$(docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='wa_gateway';" 2>/dev/null | tail -1)
            echo "[$DATE] Database Size: ${DB_SIZE} MB" >> $LOG_FILE
            
            # Check table count
            TABLE_COUNT=$(docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='wa_gateway';" 2>/dev/null | tail -1)
            echo "[$DATE] Table Count: $TABLE_COUNT" >> $LOG_FILE
        else
            echo "[$DATE] MySQL Connection: FAILED" >> $LOG_FILE
        fi
    else
        echo "[$DATE] MySQL Root Password: Not found in .env" >> $LOG_FILE
    fi
else
    echo "[$DATE] MySQL Container: NOT RUNNING" >> $LOG_FILE
fi

echo "[$DATE] === End Database Status ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/db-monitor.sh

# Schedule database monitoring (every 15 minutes)
sudo crontab -e
# Add: */15 * * * * /usr/local/bin/db-monitor.sh
```

## 💾 Database Backup

### 1. Automated Database Backup

```bash
# Create database backup script
sudo nano /usr/local/bin/db-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/wagateway/backups/database"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/wa-gateway/db-backup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..." >> $LOG_FILE

# Create backup directory
mkdir -p $BACKUP_DIR

cd /home/wagateway/wa-gateway 2>/dev/null || {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WA Gateway directory not found" >> $LOG_FILE
    exit 1
}

# Get MySQL root password
MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MySQL root password not found in .env" >> $LOG_FILE
    exit 1
fi

# Create database backup
BACKUP_FILE="wa_gateway_db_backup_$DATE.sql"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating database backup: $BACKUP_FILE" >> $LOG_FILE

if docker compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --complete-insert \
    wa_gateway > $BACKUP_DIR/$BACKUP_FILE 2>>$LOG_FILE; then
    
    # Compress backup
    gzip $BACKUP_DIR/$BACKUP_FILE
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database backup completed: $BACKUP_FILE.gz" >> $LOG_FILE
    
    # Get backup size
    BACKUP_SIZE=$(du -h $BACKUP_DIR/$BACKUP_FILE.gz | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup size: $BACKUP_SIZE" >> $LOG_FILE
    
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database backup failed" >> $LOG_FILE
    exit 1
fi

# Remove backups older than 30 days
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning old backups..." >> $LOG_FILE
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete 2>/dev/null

# Count remaining backups
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/*.sql.gz 2>/dev/null | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Remaining backups: $BACKUP_COUNT" >> $LOG_FILE

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database backup completed successfully" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/db-backup.sh

# Schedule daily backup at 2 AM
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/db-backup.sh
```

### 2. Database Restore Script

```bash
# Create database restore script
sudo nano /usr/local/bin/db-restore.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/wagateway/backups/database"
LOG_FILE="/var/log/wa-gateway/db-restore.log"

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la $BACKUP_DIR/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database restore from: $BACKUP_FILE" >> $LOG_FILE

cd /home/wagateway/wa-gateway 2>/dev/null || {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WA Gateway directory not found" >> $LOG_FILE
    exit 1
}

# Get MySQL root password
MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] MySQL root password not found in .env" >> $LOG_FILE
    exit 1
fi

# Create backup before restore
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating backup before restore..." >> $LOG_FILE
/usr/local/bin/db-backup.sh

# Restore database
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restoring database..." >> $LOG_FILE

if zcat $BACKUP_FILE | docker compose exec -T mysql mysql -u root -p$MYSQL_ROOT_PASSWORD wa_gateway 2>>$LOG_FILE; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database restore completed successfully" >> $LOG_FILE
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database restore failed" >> $LOG_FILE
    exit 1
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/db-restore.sh
```

## 📁 File Backup

### 1. Application Files Backup

```bash
# Create file backup script
sudo nano /usr/local/bin/files-backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/wagateway/backups/files"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/wa-gateway/files-backup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting files backup..." >> $LOG_FILE

# Create backup directory
mkdir -p $BACKUP_DIR

cd /home/wagateway/wa-gateway 2>/dev/null || {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WA Gateway directory not found" >> $LOG_FILE
    exit 1
}

# Create files backup
BACKUP_FILE="wa_gateway_files_$DATE.tar.gz"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating files backup: $BACKUP_FILE" >> $LOG_FILE

# Backup important directories
tar -czf $BACKUP_DIR/$BACKUP_FILE \
    backend/uploads \
    backend/sessions \
    backend/logs \
    .env \
    backend/.env \
    docker-compose.yml \
    2>>$LOG_FILE

if [ $? -eq 0 ]; then
    # Get backup size
    BACKUP_SIZE=$(du -h $BACKUP_DIR/$BACKUP_FILE | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Files backup completed: $BACKUP_FILE ($BACKUP_SIZE)" >> $LOG_FILE
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Files backup failed" >> $LOG_FILE
    exit 1
fi

# Remove backups older than 30 days
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaning old backups..." >> $LOG_FILE
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete 2>/dev/null

# Count remaining backups
BACKUP_COUNT=$(ls -1 $BACKUP_DIR/*.tar.gz 2>/dev/null | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Remaining backups: $BACKUP_COUNT" >> $LOG_FILE

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Files backup completed successfully" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/files-backup.sh

# Schedule weekly backup on Sunday at 3 AM
sudo crontab -e
# Add: 0 3 * * 0 /usr/local/bin/files-backup.sh
```

## 📝 Log Management

### 1. Log Rotation Setup

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
        # Restart Docker containers if needed
        if [ -f /home/wagateway/wa-gateway/docker-compose.yml ]; then
            cd /home/wagateway/wa-gateway
            docker compose restart backend 2>/dev/null || true
        fi
    endscript
}

/home/wagateway/wa-gateway/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 wagateway wagateway
    postrotate
        # Restart backend container
        if [ -f /home/wagateway/wa-gateway/docker-compose.yml ]; then
            cd /home/wagateway/wa-gateway
            docker compose restart backend 2>/dev/null || true
        fi
    endscript
}
```

### 2. Log Analysis Script

```bash
# Create log analysis script
sudo nano /usr/local/bin/log-analysis.sh
```

```bash
#!/bin/bash

LOG_DIR="/var/log/wa-gateway"
LOG_FILE="/var/log/wa-gateway/log-analysis.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === Log Analysis ===" >> $LOG_FILE

# Analyze error logs
echo "[$DATE] Error Analysis:" >> $LOG_FILE
find $LOG_DIR -name "*.log" -exec grep -l "ERROR\|FATAL\|CRITICAL" {} \; | while read file; do
    ERROR_COUNT=$(grep -c "ERROR\|FATAL\|CRITICAL" "$file" 2>/dev/null || echo "0")
    echo "[$DATE] $file: $ERROR_COUNT errors" >> $LOG_FILE
done

# Analyze warning logs
echo "[$DATE] Warning Analysis:" >> $LOG_FILE
find $LOG_DIR -name "*.log" -exec grep -l "WARNING\|WARN" {} \; | while read file; do
    WARN_COUNT=$(grep -c "WARNING\|WARN" "$file" 2>/dev/null || echo "0")
    echo "[$DATE] $file: $WARN_COUNT warnings" >> $LOG_FILE
done

# Check log file sizes
echo "[$DATE] Log File Sizes:" >> $LOG_FILE
find $LOG_DIR -name "*.log" -exec du -h {} \; >> $LOG_FILE 2>/dev/null

echo "[$DATE] === End Log Analysis ===" >> $LOG_FILE
echo "" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/log-analysis.sh

# Schedule daily log analysis at 6 AM
sudo crontab -e
# Add: 0 6 * * * /usr/local/bin/log-analysis.sh
```

## 🚨 Alert System

### 1. Email Alert Script

```bash
# Create email alert script
sudo nano /usr/local/bin/send-alert.sh
```

```bash
#!/bin/bash

# Email configuration
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
ALERT_EMAIL="admin@yourdomain.com"

# Function to send email
send_email() {
    local subject="$1"
    local message="$2"
    
    # Create email content
    cat > /tmp/alert_email.txt <<EOF
To: $ALERT_EMAIL
From: $SMTP_USER
Subject: WA Gateway Alert: $subject
Content-Type: text/plain; charset=UTF-8

$message

---
WA Gateway Monitoring System
$(date)
EOF

    # Send email using curl
    curl -s --url "smtp://$SMTP_SERVER:$SMTP_PORT" \
        --ssl-reqd \
        --mail-from "$SMTP_USER" \
        --mail-rcpt "$ALERT_EMAIL" \
        --user "$SMTP_USER:$SMTP_PASS" \
        --upload-file /tmp/alert_email.txt
    
    rm -f /tmp/alert_email.txt
}

# Check for critical errors
check_critical_errors() {
    local error_count=$(find /var/log/wa-gateway -name "*.log" -exec grep -c "FATAL\|CRITICAL" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum}')
    
    if [ "$error_count" -gt 0 ]; then
        send_email "Critical Errors Detected" "Found $error_count critical errors in the system logs. Please check immediately."
    fi
}

# Check container status
check_container_status() {
    cd /home/wagateway/wa-gateway 2>/dev/null || return
    
    local failed_containers=$(docker compose ps --filter "status=exited" --format "{{.Name}}" 2>/dev/null)
    
    if [ ! -z "$failed_containers" ]; then
        send_email "Container Failure" "The following containers have failed: $failed_containers"
    fi
}

# Check disk space
check_disk_space() {
    local disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -gt 90 ]; then
        send_email "Disk Space Warning" "Disk usage is at ${disk_usage}%. Please free up space immediately."
    fi
}

# Check memory usage
check_memory_usage() {
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    
    if [ "$memory_usage" -gt 90 ]; then
        send_email "Memory Warning" "Memory usage is at ${memory_usage}%. Please check system resources."
    fi
}

# Run all checks
check_critical_errors
check_container_status
check_disk_space
check_memory_usage
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/send-alert.sh

# Schedule hourly alerts
sudo crontab -e
# Add: 0 * * * * /usr/local/bin/send-alert.sh
```

## 🔧 Maintenance Scripts

### 1. System Update Script

```bash
# Create system update script
sudo nano /usr/local/bin/system-update.sh
```

```bash
#!/bin/bash

LOG_FILE="/var/log/wa-gateway/system-update.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting system update..." >> $LOG_FILE

# Update package list
apt update >> $LOG_FILE 2>&1

# Upgrade packages
apt upgrade -y >> $LOG_FILE 2>&1

# Remove unused packages
apt autoremove -y >> $LOG_FILE 2>&1

# Clean package cache
apt autoclean >> $LOG_FILE 2>&1

# Update Docker images
if command -v docker &> /dev/null; then
    docker system prune -f >> $LOG_FILE 2>&1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] System update completed" >> $LOG_FILE
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/system-update.sh

# Schedule weekly updates on Sunday at 4 AM
sudo crontab -e
# Add: 0 4 * * 0 /usr/local/bin/system-update.sh
```

### 2. Application Update Script

```bash
# Create application update script
sudo nano /usr/local/bin/app-update.sh
```

```bash
#!/bin/bash

LOG_FILE="/var/log/wa-gateway/app-update.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting application update..." >> $LOG_FILE

cd /home/wagateway/wa-gateway 2>/dev/null || {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WA Gateway directory not found" >> $LOG_FILE
    exit 1
}

# Create backup before update
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Creating backup before update..." >> $LOG_FILE
/usr/local/bin/db-backup.sh
/usr/local/bin/files-backup.sh

# Pull latest changes
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Pulling latest changes..." >> $LOG_FILE
git pull origin main >> $LOG_FILE 2>&1

# Rebuild and restart containers
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Rebuilding containers..." >> $LOG_FILE
docker compose down >> $LOG_FILE 2>&1
docker compose up -d --build >> $LOG_FILE 2>&1

# Wait for services to start
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Waiting for services to start..." >> $LOG_FILE
sleep 30

# Check if services are running
if docker compose ps | grep -q "Up"; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application update completed successfully" >> $LOG_FILE
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Application update failed - some containers not running" >> $LOG_FILE
    exit 1
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/app-update.sh
```

## 📊 Monitoring Dashboard

### 1. Create Monitoring Dashboard Script

```bash
# Create monitoring dashboard
sudo nano /usr/local/bin/monitoring-dashboard.sh
```

```bash
#!/bin/bash

# Clear screen
clear

echo "=========================================="
echo "  WA Gateway Monitoring Dashboard"
echo "=========================================="
echo "Last Updated: $(date)"
echo

# System Status
echo "=== System Status ==="
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory Usage: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"
echo

# Docker Status
echo "=== Docker Status ==="
cd /home/wagateway/wa-gateway 2>/dev/null && docker compose ps || echo "WA Gateway not found"
echo

# Service Health
echo "=== Service Health ==="
echo -n "Backend API: "
curl -s -f http://localhost:3000/api/health > /dev/null && echo "✅ OK" || echo "❌ FAILED"

echo -n "Frontend: "
curl -s -f http://localhost:3001 > /dev/null && echo "✅ OK" || echo "❌ FAILED"

echo -n "Nginx: "
curl -s -f http://localhost > /dev/null && echo "✅ OK" || echo "❌ FAILED"
echo

# Recent Logs
echo "=== Recent Errors (Last 10) ==="
find /var/log/wa-gateway -name "*.log" -exec grep -l "ERROR\|FATAL\|CRITICAL" {} \; | head -1 | xargs tail -10 2>/dev/null || echo "No recent errors found"
echo

# Backup Status
echo "=== Backup Status ==="
echo "Database Backups: $(ls -1 /home/wagateway/backups/database/*.sql.gz 2>/dev/null | wc -l)"
echo "File Backups: $(ls -1 /home/wagateway/backups/files/*.tar.gz 2>/dev/null | wc -l)"
echo "Last DB Backup: $(ls -t /home/wagateway/backups/database/*.sql.gz 2>/dev/null | head -1 | xargs ls -la 2>/dev/null | awk '{print $6, $7, $8}' || echo 'No backups found')"
echo

echo "=========================================="
echo "Press Ctrl+C to exit"
echo "=========================================="

# Auto-refresh every 30 seconds
sleep 30
exec $0
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/monitoring-dashboard.sh
```

## 🎯 Kesimpulan

Panduan ini memberikan sistem monitoring dan backup yang komprehensif untuk WA Gateway. Pastikan untuk:

1. **Monitoring**: Setup monitoring untuk system, application, dan database
2. **Backup**: Implement backup otomatis untuk database dan files
3. **Logs**: Manage log files dengan rotation dan analysis
4. **Alerts**: Setup alert system untuk notifikasi masalah
5. **Maintenance**: Schedule maintenance tasks secara otomatis

Untuk menjalankan monitoring dashboard:
```bash
sudo /usr/local/bin/monitoring-dashboard.sh
```

Semua script sudah dijadwalkan dengan crontab untuk berjalan otomatis sesuai kebutuhan.
