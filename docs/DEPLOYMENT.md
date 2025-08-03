# WA Gateway - Deployment Guide

## 🚀 Deployment Options

### 1. Local Development (XAMPP)
### 2. VPS/Cloud Server
### 3. Docker Container
### 4. Shared Hosting

## 📋 Prerequisites

### System Requirements
- **Node.js**: 16.x atau lebih tinggi
- **MySQL**: 8.0 atau lebih tinggi
- **npm** atau **yarn**
- **Git**

### Minimum Server Specs
- **CPU**: 1 core
- **RAM**: 2GB
- **Storage**: 10GB
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server

## 🔧 Local Development Setup (XAMPP)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd wagateway
```

### Step 2: Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

### Step 3: Configure Environment
Edit file `.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wagateway
DB_USER=root
DB_PASSWORD=

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=16777216
ALLOWED_FILE_TYPES=image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar

# WhatsApp Configuration
WHATSAPP_SESSION_PATH=./sessions
WHATSAPP_QR_TIMEOUT=60000

# Webhook Configuration
WEBHOOK_TIMEOUT=10000
WEBHOOK_RETRY_ATTEMPTS=3

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log
```

### Step 4: Database Setup
```bash
# Start XAMPP MySQL
# Import database schema
mysql -u root -p < ../database/schema.sql
```

### Step 5: Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit frontend `.env`:
```env
NUXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NUXT_PUBLIC_WS_URL=ws://localhost:3001
```

### Step 6: Start Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

## 🌐 VPS/Cloud Server Deployment

### Step 1: Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### Step 2: Application Setup
```bash
# Clone repository
git clone <repository-url>
cd wagateway

# Setup backend
cd backend
npm install --production
cp .env.example .env
# Configure .env for production

# Setup frontend
cd ../frontend
npm install --production
# Build untuk SSR (recommended) atau static generation
npm run build
# Atau untuk static site: npm run generate
# Nuxt.js akan generate files di .output/
```

### Step 3: Database Setup
```bash
# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE wagateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'wagateway'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON wagateway.* TO 'wagateway'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u wagateway -p wagateway < database/schema.sql
```

### Step 4: PM2 Configuration
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'wagateway-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Step 5: Nginx Configuration
Create `/etc/nginx/sites-available/wagateway`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/wagateway/frontend/.output/public;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
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

    # WebSocket
    location /socket {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads {
        alias /var/www/wagateway/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/wagateway /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Copy frontend build
sudo cp -r frontend/.output/public /var/www/wagateway/
sudo chown -R www-data:www-data /var/www/wagateway/
```

## 🐳 Docker Deployment

### Step 1: Create Dockerfile
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

### Step 2: Create docker-compose.yml
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: wagateway
      MYSQL_USER: wagateway
      MYSQL_PASSWORD: wagatewaypass
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=wagateway
      - DB_USER=wagateway
      - DB_PASSWORD=wagatewaypass
    volumes:
      - uploads_data:/app/uploads
      - sessions_data:/app/sessions
    ports:
      - "3001:3001"
    depends_on:
      - mysql

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  mysql_data:
  uploads_data:
  sessions_data:
```

### Step 3: Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 Monitoring & Logs

### PM2 Monitoring
```bash
# View status
pm2 status

# View logs
pm2 logs wagateway-backend

# Monitor resources
pm2 monit
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### Application Logs
```bash
# View application logs
tail -f logs/app.log
tail -f logs/error.log
```

## 🔄 Backup Strategy

### Database Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u wagateway -p wagateway > backup_$DATE.sql
gzip backup_$DATE.sql
EOF

chmod +x backup.sh

# Schedule daily backup
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### File Backup
```bash
# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup sessions
tar -czf sessions_backup_$(date +%Y%m%d).tar.gz sessions/
```

## 🚨 Troubleshooting

### Common Issues

#### 1. WhatsApp Connection Failed
```bash
# Check session files
ls -la sessions/

# Clear sessions
rm -rf sessions/*

# Check logs
tail -f logs/app.log
```

#### 2. Database Connection Error
```bash
# Test database connection
mysql -u wagateway -p -h localhost wagateway

# Check MySQL status
sudo systemctl status mysql
```

#### 3. File Upload Issues
```bash
# Check upload directory permissions
ls -la uploads/

# Fix permissions
chmod 755 uploads/
chown -R node:node uploads/
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h

# Restart application
pm2 restart wagateway-backend
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_messages_timestamp ON messages(timestamp);
CREATE INDEX idx_files_user_created ON files(user_id, created_at);

-- Optimize tables
OPTIMIZE TABLE messages;
OPTIMIZE TABLE files;
```

### Application Optimization
```javascript
// Enable compression
app.use(compression());

// Enable caching
app.use(express.static('public', {
  maxAge: '1d'
}));
```

### Nginx Optimization
```nginx
# Enable gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🔐 Security Checklist

- [ ] Change default admin password
- [ ] Enable firewall (UFW)
- [ ] Configure SSL/HTTPS
- [ ] Set up regular backups
- [ ] Enable fail2ban
- [ ] Update system regularly
- [ ] Monitor logs for suspicious activity
- [ ] Use strong JWT secrets
- [ ] Validate file uploads
- [ ] Implement rate limiting 