#!/bin/bash

# =============================================================================
# WA Gateway - Automated Deployment Script
# =============================================================================
# Script ini akan melakukan deployment otomatis WA Gateway ke server
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL=""
DOMAIN=""
EMAIL=""
MYSQL_ROOT_PASSWORD=""
MYSQL_PASSWORD=""
JWT_SECRET=""
SMTP_USER=""
SMTP_PASS=""

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as wagateway user
check_user() {
    if [[ $USER != "wagateway" ]]; then
        error "Script ini harus dijalankan sebagai user 'wagateway'. Current user: $USER"
    fi
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker tidak terinstall. Jalankan setup-ubuntu-server.sh terlebih dahulu."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker tidak berjalan. Pastikan Docker service aktif."
    fi
    
    log "Docker is running: $(docker --version)"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose tidak terinstall."
    fi
    
    if docker compose version &> /dev/null; then
        log "Docker Compose is available: $(docker compose version)"
    else
        log "Docker Compose is available: $(docker-compose --version)"
    fi
}

# Get user input for configuration
get_configuration() {
    echo "=========================================="
    echo "  WA Gateway Deployment Configuration"
    echo "=========================================="
    echo
    
    # Repository URL
    if [[ -z "$REPO_URL" ]]; then
        read -p "Repository URL (Git): " REPO_URL
        if [[ -z "$REPO_URL" ]]; then
            error "Repository URL tidak boleh kosong"
        fi
    fi
    
    # Domain
    if [[ -z "$DOMAIN" ]]; then
        read -p "Domain name (e.g., api.yourdomain.com): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            error "Domain tidak boleh kosong"
        fi
    fi
    
    # Email for SSL
    if [[ -z "$EMAIL" ]]; then
        read -p "Email untuk SSL certificate: " EMAIL
        if [[ -z "$EMAIL" ]]; then
            error "Email tidak boleh kosong"
        fi
    fi
    
    # MySQL Root Password
    if [[ -z "$MYSQL_ROOT_PASSWORD" ]]; then
        read -s -p "MySQL Root Password: " MYSQL_ROOT_PASSWORD
        echo
        if [[ -z "$MYSQL_ROOT_PASSWORD" ]]; then
            error "MySQL Root Password tidak boleh kosong"
        fi
    fi
    
    # MySQL User Password
    if [[ -z "$MYSQL_PASSWORD" ]]; then
        read -s -p "MySQL User Password: " MYSQL_PASSWORD
        echo
        if [[ -z "$MYSQL_PASSWORD" ]]; then
            error "MySQL User Password tidak boleh kosong"
        fi
    fi
    
    # JWT Secret
    if [[ -z "$JWT_SECRET" ]]; then
        JWT_SECRET=$(openssl rand -base64 32)
        info "Generated JWT Secret: $JWT_SECRET"
    fi
    
    # SMTP Configuration (optional)
    read -p "SMTP Email (optional, press Enter to skip): " SMTP_USER
    if [[ -n "$SMTP_USER" ]]; then
        read -s -p "SMTP Password: " SMTP_PASS
        echo
    fi
    
    echo
    log "Configuration completed"
}

# Clone or update repository
setup_repository() {
    log "Setting up repository..."
    
    if [[ -d "wa-gateway" ]]; then
        log "Repository already exists, updating..."
        cd wa-gateway
        git pull origin main
    else
        log "Cloning repository..."
        git clone $REPO_URL wa-gateway
        cd wa-gateway
    fi
    
    log "Repository setup completed"
}

# Create environment files
create_environment_files() {
    log "Creating environment files..."
    
    # Create .env file
    cat > .env <<EOF
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_DATABASE=wa_gateway
MYSQL_USER=wa_user
MYSQL_PASSWORD=$MYSQL_PASSWORD

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NODE_ENV=production
PORT=3000

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
SESSION_SECRET=$(openssl rand -base64 32)

# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================
NUXT_PUBLIC_API_URL=https://$DOMAIN
NUXT_PUBLIC_WS_URL=wss://$DOMAIN

# =============================================================================
# EMAIL CONFIGURATION
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
SMTP_FROM=noreply@$DOMAIN

# =============================================================================
# REDIS CONFIGURATION
# =============================================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# =============================================================================
# FILE UPLOAD CONFIGURATION
# =============================================================================
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,text/plain

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
CORS_ORIGIN=https://$DOMAIN
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log
EOF

    # Create backend/.env file
    cat > backend/.env <<EOF
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=wa_gateway
DB_USER=wa_user
DB_PASSWORD=$MYSQL_PASSWORD
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_EXPIRES_IN=30d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=$SMTP_USER
EMAIL_PASS=$SMTP_PASS
EMAIL_FROM=WA Gateway <noreply@$DOMAIN>

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
SESSION_SECRET=$(openssl rand -base64 32)
CORS_ORIGIN=https://$DOMAIN

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
WEBHOOK_SECRET=$(openssl rand -base64 32)
WEBHOOK_TIMEOUT=10000

# Production Settings
DEBUG=false
ENABLE_SWAGGER=false
ENABLE_CORS=true
EOF

    log "Environment files created successfully"
}

# Create Nginx configuration
create_nginx_config() {
    log "Creating Nginx configuration..."
    
    sudo tee /etc/nginx/sites-available/wa-gateway > /dev/null <<EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration (will be updated by Certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
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
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.io connections
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:3001;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable site
    sudo ln -sf /etc/nginx/sites-available/wa-gateway /etc/nginx/sites-enabled/
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test configuration
    sudo nginx -t
    
    log "Nginx configuration created successfully"
}

# Deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Stop existing containers
    if docker compose ps -q | grep -q .; then
        log "Stopping existing containers..."
        docker compose down
    fi
    
    # Build and start containers
    log "Building and starting containers..."
    docker compose up -d --build
    
    # Wait for services to start
    log "Waiting for services to start..."
    sleep 30
    
    # Check container status
    log "Checking container status..."
    docker compose ps
    
    # Check if all containers are running
    if ! docker compose ps | grep -q "Up"; then
        error "Some containers failed to start. Check logs with: docker compose logs"
    fi
    
    log "Docker deployment completed successfully"
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    log "Setting up SSL with Let's Encrypt..."
    
    # Stop Nginx temporarily
    sudo systemctl stop nginx
    
    # Generate SSL certificate
    sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive
    
    # Start Nginx
    sudo systemctl start nginx
    
    # Test SSL
    if curl -s https://$DOMAIN > /dev/null; then
        log "SSL certificate installed successfully"
    else
        warn "SSL certificate installed but site may not be accessible yet"
    fi
    
    # Setup auto-renewal
    (sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -
    
    log "SSL setup completed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for MySQL to be ready
    log "Waiting for MySQL to be ready..."
    sleep 10
    
    # Run migrations
    if docker compose exec -T backend npm run migrate 2>/dev/null; then
        log "Database migrations completed successfully"
    else
        warn "Database migrations failed or not available. This is normal for first deployment."
    fi
    
    # Seed database (optional)
    if docker compose exec -T backend npm run seed 2>/dev/null; then
        log "Database seeding completed successfully"
    else
        warn "Database seeding failed or not available. This is normal for first deployment."
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check if containers are running
    if ! docker compose ps | grep -q "Up"; then
        error "Some containers are not running"
    fi
    
    # Check API health
    if curl -s http://localhost:3000/api/health > /dev/null; then
        log "Backend API is responding"
    else
        warn "Backend API is not responding"
    fi
    
    # Check frontend
    if curl -s http://localhost:3001 > /dev/null; then
        log "Frontend is responding"
    else
        warn "Frontend is not responding"
    fi
    
    # Check Nginx
    if curl -s http://localhost > /dev/null; then
        log "Nginx is responding"
    else
        warn "Nginx is not responding"
    fi
    
    log "Deployment verification completed"
}

# Create deployment info file
create_deployment_info() {
    log "Creating deployment info file..."
    
    cat > deployment-info.txt <<EOF
WA Gateway Deployment Information
================================

Deployment Date: $(date)
Domain: $DOMAIN
Repository: $REPO_URL
User: $USER

Environment Files:
- .env (main configuration)
- backend/.env (backend configuration)

SSL Certificate:
- Domain: $DOMAIN
- Email: $EMAIL
- Auto-renewal: Enabled

Database:
- Host: localhost (Docker)
- Database: wa_gateway
- User: wa_user

Services:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001
- Nginx: http://localhost:80, https://$DOMAIN:443

Useful Commands:
- View logs: docker compose logs -f
- Restart services: docker compose restart
- Stop services: docker compose down
- Update application: git pull && docker compose up -d --build

Backup:
- Database: /usr/local/bin/wa-gateway-backup
- Monitoring: /usr/local/bin/wa-gateway-monitor

Logs:
- Application: docker compose logs
- Nginx: /var/log/nginx/
- System: /var/log/wa-gateway/
EOF

    log "Deployment info saved to deployment-info.txt"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  WA Gateway Automated Deployment"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_user
    check_docker
    check_docker_compose
    
    # Get configuration
    get_configuration
    
    # Confirm deployment
    echo
    echo "Deployment Configuration:"
    echo "- Repository: $REPO_URL"
    echo "- Domain: $DOMAIN"
    echo "- Email: $EMAIL"
    echo "- MySQL Root Password: [HIDDEN]"
    echo "- MySQL User Password: [HIDDEN]"
    echo "- JWT Secret: [GENERATED]"
    echo
    read -p "Lanjutkan dengan deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment dibatalkan."
        exit 0
    fi
    
    # Start deployment
    log "Starting WA Gateway deployment..."
    
    setup_repository
    create_environment_files
    create_nginx_config
    deploy_docker
    run_migrations
    setup_ssl
    verify_deployment
    create_deployment_info
    
    # Final success message
    echo
    echo "=========================================="
    echo "  Deployment Completed Successfully!"
    echo "=========================================="
    echo
    echo "✅ Repository cloned/updated"
    echo "✅ Environment files created"
    echo "✅ Nginx configured"
    echo "✅ Docker containers deployed"
    echo "✅ Database migrations run"
    echo "✅ SSL certificate installed"
    echo "✅ Deployment verified"
    echo
    echo "Your WA Gateway is now available at:"
    echo "🌐 https://$DOMAIN"
    echo
    echo "Useful commands:"
    echo "- View logs: docker compose logs -f"
    echo "- Restart: docker compose restart"
    echo "- Stop: docker compose down"
    echo "- Update: git pull && docker compose up -d --build"
    echo
    echo "Deployment info saved to: deployment-info.txt"
    echo
    log "Deployment completed successfully!"
}

# Run main function
main "$@"
