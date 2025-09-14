# 🔒 Panduan Setup SSL dengan Let's Encrypt untuk WA Gateway

Panduan lengkap untuk mengatur SSL certificate menggunakan Let's Encrypt pada server Ubuntu untuk WA Gateway.

## 📋 Daftar Isi

1. [Persyaratan](#persyaratan)
2. [Installasi Certbot](#installasi-certbot)
3. [Setup Domain dan DNS](#setup-domain-dan-dns)
4. [Generate SSL Certificate](#generate-ssl-certificate)
5. [Konfigurasi Nginx](#konfigurasi-nginx)
6. [Auto-Renewal](#auto-renewal)
7. [Troubleshooting](#troubleshooting)
8. [Security Hardening](#security-hardening)

## ✅ Persyaratan

### Server Requirements
- Ubuntu 20.04 LTS atau 22.04 LTS
- Nginx terinstall dan berjalan
- Domain name yang valid
- DNS record mengarah ke server IP
- Port 80 dan 443 terbuka

### Domain Requirements
- Domain name yang sudah terdaftar
- DNS A record mengarah ke server IP
- Subdomain (opsional) untuk API

## 🔧 Installasi Certbot

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Certbot

```bash
# Install Certbot dan plugin Nginx
sudo apt install -y certbot python3-certbot-nginx

# Verify installation
certbot --version
```

### 3. Install Snapd (Alternative Method)

```bash
# Install snapd
sudo apt install -y snapd

# Install certbot via snap
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

## 🌐 Setup Domain dan DNS

### 1. Konfigurasi DNS Records

Pastikan DNS records sudah dikonfigurasi dengan benar:

```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check if domain points to your server
curl -I http://yourdomain.com
```

### 2. DNS Records yang Diperlukan

```
Type    Name                Value
A       yourdomain.com      YOUR_SERVER_IP
A       www.yourdomain.com  YOUR_SERVER_IP
A       api.yourdomain.com  YOUR_SERVER_IP (optional)
```

### 3. Test Domain Access

```bash
# Test HTTP access
curl -I http://yourdomain.com
curl -I http://www.yourdomain.com

# Should return HTTP 200 or 301/302
```

## 🔐 Generate SSL Certificate

### Method 1: Standalone (Recommended untuk pertama kali)

```bash
# Stop Nginx sementara
sudo systemctl stop nginx

# Generate certificate
sudo certbot certonly --standalone \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive

# Start Nginx kembali
sudo systemctl start nginx
```

### Method 2: Nginx Plugin (Untuk update)

```bash
# Generate certificate dengan Nginx plugin
sudo certbot --nginx \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

### Method 3: Manual dengan Webroot

```bash
# Create webroot directory
sudo mkdir -p /var/www/html

# Generate certificate
sudo certbot certonly --webroot \
    -w /var/www/html \
    -d yourdomain.com \
    -d www.yourdomain.com \
    --email your-email@example.com \
    --agree-tos \
    --non-interactive
```

### 4. Verify Certificate

```bash
# Check certificate files
sudo ls -la /etc/letsencrypt/live/yourdomain.com/

# Test certificate
sudo certbot certificates

# Test SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## ⚙️ Konfigurasi Nginx

### 1. Create Nginx Configuration

```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/wa-gateway
```

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.io connections
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

    # Frontend application
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

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

### 2. Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/wa-gateway /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 3. Update Nginx Main Configuration

```bash
# Edit main Nginx configuration
sudo nano /etc/nginx/nginx.conf
```

```nginx
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # File upload size
    client_max_body_size 100M;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;

    # MIME Types
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

## 🔄 Auto-Renewal

### 1. Test Auto-Renewal

```bash
# Test renewal process
sudo certbot renew --dry-run

# If successful, you should see:
# "Congratulations, all simulated renewals succeeded"
```

### 2. Setup Crontab

```bash
# Edit crontab
sudo crontab -e

# Add this line for daily check at 2 AM
0 2 * * * /usr/bin/certbot renew --quiet && /bin/systemctl reload nginx
```

### 3. Alternative: Systemd Timer

```bash
# Create systemd timer
sudo nano /etc/systemd/system/certbot-renewal.timer
```

```ini
[Unit]
Description=Certbot Renewal

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
# Create systemd service
sudo nano /etc/systemd/system/certbot-renewal.service
```

```ini
[Unit]
Description=Certbot Renewal
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/certbot renew --quiet
ExecStartPost=/bin/systemctl reload nginx
```

```bash
# Enable and start timer
sudo systemctl enable certbot-renewal.timer
sudo systemctl start certbot-renewal.timer

# Check status
sudo systemctl status certbot-renewal.timer
```

### 4. Monitor Renewal

```bash
# Check renewal status
sudo certbot certificates

# Check renewal logs
sudo journalctl -u certbot-renewal.service

# Check crontab logs
sudo grep certbot /var/log/syslog
```

## 🔧 Troubleshooting

### 1. Common Issues

#### Certificate generation fails
```bash
# Check domain resolution
nslookup yourdomain.com

# Check if port 80 is accessible
sudo netstat -tulpn | grep :80

# Check Nginx status
sudo systemctl status nginx

# Check firewall
sudo ufw status
```

#### Nginx configuration errors
```bash
# Test configuration
sudo nginx -t

# Check syntax
sudo nginx -T

# View error logs
sudo tail -f /var/log/nginx/error.log
```

#### SSL handshake errors
```bash
# Test SSL connection
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check certificate chain
openssl s_client -connect yourdomain.com:443 -showcerts

# Test with curl
curl -I https://yourdomain.com
```

### 2. Debug Commands

```bash
# Check certificate details
sudo certbot certificates

# Check certificate expiration
sudo certbot certificates | grep -A 2 "yourdomain.com"

# Test SSL configuration
sudo nginx -t

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check system logs
sudo journalctl -u nginx -f
```

### 3. Force Renewal

```bash
# Force renewal (if needed)
sudo certbot renew --force-renewal

# Renew specific domain
sudo certbot renew --cert-name yourdomain.com --force-renewal
```

## 🛡️ Security Hardening

### 1. SSL Security Headers

```nginx
# Add to server block
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;" always;
```

### 2. SSL Configuration Hardening

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### 3. Rate Limiting

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=static:10m rate=30r/s;

# Apply rate limiting
location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... proxy configuration
}

location /login {
    limit_req zone=login burst=5 nodelay;
    # ... proxy configuration
}
```

### 4. Hide Nginx Version

```nginx
# In nginx.conf
server_tokens off;
```

### 5. SSL Test Tools

```bash
# Test SSL configuration online
# Visit: https://www.ssllabs.com/ssltest/

# Test locally
curl -I https://yourdomain.com

# Test SSL grade
nmap --script ssl-enum-ciphers -p 443 yourdomain.com
```

## 📊 Monitoring SSL

### 1. Certificate Monitoring Script

```bash
# Create monitoring script
sudo nano /usr/local/bin/ssl-monitor.sh
```

```bash
#!/bin/bash

DOMAIN="yourdomain.com"
EMAIL="admin@yourdomain.com"
LOG_FILE="/var/log/ssl-monitor.log"

# Check certificate expiration
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

echo "[$(date)] Certificate expires in $DAYS_UNTIL_EXPIRY days" >> $LOG_FILE

# Alert if certificate expires in less than 30 days
if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "[$(date)] WARNING: Certificate expires in $DAYS_UNTIL_EXPIRY days" >> $LOG_FILE
    # Send email notification (if mail is configured)
    # echo "SSL Certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days" | mail -s "SSL Certificate Expiry Warning" $EMAIL
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/ssl-monitor.sh

# Add to crontab
sudo crontab -e

# Add this line for daily check
0 9 * * * /usr/local/bin/ssl-monitor.sh
```

### 2. SSL Health Check

```bash
# Create health check script
sudo nano /usr/local/bin/ssl-health-check.sh
```

```bash
#!/bin/bash

DOMAIN="yourdomain.com"
LOG_FILE="/var/log/ssl-health-check.log"

# Test SSL connection
if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN < /dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "[$(date)] SSL connection successful" >> $LOG_FILE
else
    echo "[$(date)] SSL connection failed" >> $LOG_FILE
fi

# Test HTTP to HTTPS redirect
if curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN | grep -q "301\|302"; then
    echo "[$(date)] HTTP to HTTPS redirect working" >> $LOG_FILE
else
    echo "[$(date)] HTTP to HTTPS redirect failed" >> $LOG_FILE
fi

# Test HTTPS response
if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200"; then
    echo "[$(date)] HTTPS response successful" >> $LOG_FILE
else
    echo "[$(date)] HTTPS response failed" >> $LOG_FILE
fi
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/ssl-health-check.sh

# Add to crontab for hourly check
0 * * * * /usr/local/bin/ssl-health-check.sh
```

## 🎯 Kesimpulan

Panduan ini memberikan langkah-langkah lengkap untuk setup SSL dengan Let's Encrypt pada WA Gateway. Pastikan untuk:

1. **Domain Setup**: Pastikan domain dan DNS sudah dikonfigurasi dengan benar
2. **Certificate Generation**: Gunakan method yang sesuai dengan environment Anda
3. **Nginx Configuration**: Konfigurasi Nginx dengan security headers yang tepat
4. **Auto-Renewal**: Setup auto-renewal untuk mencegah certificate expired
5. **Monitoring**: Monitor certificate status dan SSL health secara berkala
6. **Security**: Implement security hardening untuk melindungi aplikasi

Untuk pertanyaan atau bantuan lebih lanjut, silakan buat issue di repository atau hubungi tim support.

---

**Catatan**: Ganti semua placeholder seperti `yourdomain.com` dan `your-email@example.com` dengan nilai yang sesuai dengan environment Anda.
