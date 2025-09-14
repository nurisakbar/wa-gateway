#!/bin/bash

# =============================================================================
# WA Gateway - Ubuntu Server Setup Script
# =============================================================================
# Script ini akan menginstall semua dependencies yang diperlukan untuk
# menjalankan WA Gateway di Ubuntu server
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "Script ini tidak boleh dijalankan sebagai root. Silakan jalankan sebagai user biasa dengan sudo access."
    fi
}

# Check Ubuntu version
check_ubuntu_version() {
    if ! command -v lsb_release &> /dev/null; then
        sudo apt update
        sudo apt install -y lsb-release
    fi
    
    UBUNTU_VERSION=$(lsb_release -rs)
    UBUNTU_CODENAME=$(lsb_release -cs)
    
    log "Detected Ubuntu version: $UBUNTU_VERSION ($UBUNTU_CODENAME)"
    
    # Check if version is supported
    if [[ "$UBUNTU_VERSION" != "20.04" && "$UBUNTU_VERSION" != "22.04" && "$UBUNTU_VERSION" != "24.04" ]]; then
        warn "Ubuntu version $UBUNTU_VERSION belum diuji. Versi yang didukung: 20.04, 22.04, 24.04"
        read -p "Lanjutkan? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Update system packages
update_system() {
    log "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    log "System packages updated successfully"
}

# Install essential packages
install_essential_packages() {
    log "Installing essential packages..."
    sudo apt install -y \
        curl \
        wget \
        git \
        vim \
        nano \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        logrotate \
        cron \
        build-essential \
        python3 \
        python3-pip
    log "Essential packages installed successfully"
}

# Setup firewall
setup_firewall() {
    log "Setting up UFW firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH (check current SSH port)
    SSH_PORT=$(sudo grep -oP '^Port \K\d+' /etc/ssh/sshd_config 2>/dev/null || echo "22")
    sudo ufw allow $SSH_PORT/tcp comment 'SSH'
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp comment 'HTTP'
    sudo ufw allow 443/tcp comment 'HTTPS'
    
    # Allow development ports (optional)
    sudo ufw allow 3000/tcp comment 'Backend Dev'
    sudo ufw allow 3001/tcp comment 'Frontend Dev'
    
    # Show status
    sudo ufw status
    log "Firewall configured successfully"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Remove old Docker installations
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Install prerequisites
    sudo apt install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package list
    sudo apt update
    
    # Install Docker
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    # Enable and start Docker service
    sudo systemctl enable docker
    sudo systemctl start docker
    
    # Verify installation
    if docker --version &> /dev/null; then
        log "Docker installed successfully: $(docker --version)"
    else
        error "Docker installation failed"
    fi
    
    # Install Docker Compose (standalone)
    sudo apt install -y docker-compose
    
    if docker-compose --version &> /dev/null; then
        log "Docker Compose installed successfully: $(docker-compose --version)"
    else
        error "Docker Compose installation failed"
    fi
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js 18.x..."
    
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    
    # Install Node.js
    sudo apt install -y nodejs
    
    # Verify installation
    if node --version &> /dev/null && npm --version &> /dev/null; then
        log "Node.js installed successfully: $(node --version)"
        log "npm installed successfully: $(npm --version)"
    else
        error "Node.js installation failed"
    fi
}

# Install Nginx
install_nginx() {
    log "Installing Nginx..."
    
    sudo apt install -y nginx
    
    # Enable and start Nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    # Verify installation
    if sudo systemctl is-active --quiet nginx; then
        log "Nginx installed and started successfully"
    else
        error "Nginx installation failed"
    fi
}

# Install Certbot for SSL
install_certbot() {
    log "Installing Certbot for SSL certificates..."
    
    sudo apt install -y certbot python3-certbot-nginx
    
    if certbot --version &> /dev/null; then
        log "Certbot installed successfully: $(certbot --version)"
    else
        error "Certbot installation failed"
    fi
}

# Setup fail2ban
setup_fail2ban() {
    log "Setting up fail2ban..."
    
    # Create fail2ban configuration
    sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
EOF

    # Enable and start fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    
    log "fail2ban configured and started successfully"
}

# Create application user
create_app_user() {
    log "Creating application user 'wagateway'..."
    
    # Check if user already exists
    if id "wagateway" &>/dev/null; then
        warn "User 'wagateway' already exists"
    else
        # Create user
        sudo useradd -m -s /bin/bash wagateway
        sudo usermod -aG sudo wagateway
        sudo usermod -aG docker wagateway
        
        # Set password (optional)
        info "Setting up password for user 'wagateway'..."
        sudo passwd wagateway
        
        log "User 'wagateway' created successfully"
    fi
}

# Setup log directories
setup_log_directories() {
    log "Setting up log directories..."
    
    sudo mkdir -p /var/log/wa-gateway
    sudo chown wagateway:wagateway /var/log/wa-gateway
    sudo chmod 755 /var/log/wa-gateway
    
    log "Log directories created successfully"
}

# Setup logrotate
setup_logrotate() {
    log "Setting up logrotate for WA Gateway..."
    
    sudo tee /etc/logrotate.d/wa-gateway > /dev/null <<EOF
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
EOF

    log "Logrotate configured successfully"
}

# Create monitoring script
create_monitoring_script() {
    log "Creating monitoring script..."
    
    sudo tee /usr/local/bin/wa-gateway-monitor > /dev/null <<'EOF'
#!/bin/bash

# WA Gateway Monitoring Script
LOG_FILE="/var/log/wa-gateway/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === WA Gateway System Status ===" >> $LOG_FILE

# Check Docker containers
echo "[$DATE] === Docker Containers ===" >> $LOG_FILE
if [ -f /home/wagateway/wa-gateway/docker-compose.yml ]; then
    cd /home/wagateway/wa-gateway
    docker compose ps >> $LOG_FILE 2>&1
else
    echo "[$DATE] WA Gateway not found in /home/wagateway/wa-gateway" >> $LOG_FILE
fi

# Check system resources
echo "[$DATE] === System Resources ===" >> $LOG_FILE
echo "CPU Usage:" >> $LOG_FILE
top -bn1 | grep "Cpu(s)" >> $LOG_FILE
echo "Memory Usage:" >> $LOG_FILE
free -h >> $LOG_FILE
echo "Disk Usage:" >> $LOG_FILE
df -h >> $LOG_FILE

# Check application logs (last 5 lines)
echo "[$DATE] === Application Logs (Last 5 lines) ===" >> $LOG_FILE
if [ -f /home/wagateway/wa-gateway/docker-compose.yml ]; then
    cd /home/wagateway/wa-gateway
    docker compose logs --tail=5 backend >> $LOG_FILE 2>&1
fi

echo "[$DATE] === End of Status Check ===" >> $LOG_FILE
echo "" >> $LOG_FILE
EOF

    sudo chmod +x /usr/local/bin/wa-gateway-monitor
    
    # Add to crontab for daily monitoring
    (sudo crontab -l 2>/dev/null; echo "0 9 * * * /usr/local/bin/wa-gateway-monitor") | sudo crontab -
    
    log "Monitoring script created and scheduled successfully"
}

# Create backup script
create_backup_script() {
    log "Creating backup script..."
    
    sudo tee /usr/local/bin/wa-gateway-backup > /dev/null <<'EOF'
#!/bin/bash

# WA Gateway Backup Script
BACKUP_DIR="/home/wagateway/backups"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/wa-gateway/backup.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting backup..." >> $LOG_FILE

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
if [ -f /home/wagateway/wa-gateway/docker-compose.yml ]; then
    cd /home/wagateway/wa-gateway
    
    # Get MySQL root password from .env file
    MYSQL_ROOT_PASSWORD=$(grep MYSQL_ROOT_PASSWORD .env | cut -d '=' -f2)
    
    if [ ! -z "$MYSQL_ROOT_PASSWORD" ]; then
        BACKUP_FILE="wa_gateway_db_backup_$DATE.sql"
        docker compose exec -T mysql mysqldump -u root -p$MYSQL_ROOT_PASSWORD wa_gateway > $BACKUP_DIR/$BACKUP_FILE 2>>$LOG_FILE
        
        if [ $? -eq 0 ]; then
            gzip $BACKUP_DIR/$BACKUP_FILE
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database backup completed: $BACKUP_FILE.gz" >> $LOG_FILE
        else
            echo "[$(date '+%Y-%m-%d %H:%M:%S')] Database backup failed" >> $LOG_FILE
        fi
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] MySQL root password not found in .env file" >> $LOG_FILE
    fi
    
    # File backup
    BACKUP_FILE="wa_gateway_files_$DATE.tar.gz"
    tar -czf $BACKUP_DIR/$BACKUP_FILE \
        backend/uploads \
        backend/sessions \
        backend/logs \
        2>>$LOG_FILE
    
    if [ $? -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] File backup completed: $BACKUP_FILE" >> $LOG_FILE
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] File backup failed" >> $LOG_FILE
    fi
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WA Gateway not found in /home/wagateway/wa-gateway" >> $LOG_FILE
fi

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete 2>/dev/null
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete 2>/dev/null

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed" >> $LOG_FILE
EOF

    sudo chmod +x /usr/local/bin/wa-gateway-backup
    
    # Add to crontab for daily backup
    (sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/wa-gateway-backup") | sudo crontab -
    
    log "Backup script created and scheduled successfully"
}

# Setup system optimization
setup_system_optimization() {
    log "Setting up system optimization..."
    
    # Optimize system limits
    sudo tee -a /etc/security/limits.conf > /dev/null <<EOF

# WA Gateway optimizations
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

    # Optimize kernel parameters
    sudo tee -a /etc/sysctl.conf > /dev/null <<EOF

# WA Gateway kernel optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 10
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_tw_buckets = 5000
vm.swappiness = 10
EOF

    # Apply sysctl changes
    sudo sysctl -p
    
    log "System optimization configured successfully"
}

# Create update script
create_update_script() {
    log "Creating system update script..."
    
    sudo tee /usr/local/bin/system-update > /dev/null <<'EOF'
#!/bin/bash

# System Update Script
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
EOF

    sudo chmod +x /usr/local/bin/system-update
    
    # Add to crontab for weekly updates
    (sudo crontab -l 2>/dev/null; echo "0 3 * * 0 /usr/local/bin/system-update") | sudo crontab -
    
    log "System update script created and scheduled successfully"
}

# Main installation function
main() {
    echo "=========================================="
    echo "  WA Gateway Ubuntu Server Setup Script"
    echo "=========================================="
    echo
    
    # Check prerequisites
    check_root
    check_ubuntu_version
    
    # Confirm installation
    echo "Script ini akan menginstall:"
    echo "- Docker & Docker Compose"
    echo "- Node.js 18.x"
    echo "- Nginx"
    echo "- Certbot (SSL)"
    echo "- fail2ban (Security)"
    echo "- Monitoring & Backup scripts"
    echo "- System optimizations"
    echo
    read -p "Lanjutkan dengan instalasi? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Instalasi dibatalkan."
        exit 0
    fi
    
    # Start installation
    log "Starting WA Gateway server setup..."
    
    update_system
    install_essential_packages
    setup_firewall
    install_docker
    install_nodejs
    install_nginx
    install_certbot
    setup_fail2ban
    create_app_user
    setup_log_directories
    setup_logrotate
    create_monitoring_script
    create_backup_script
    setup_system_optimization
    create_update_script
    
    # Final steps
    log "Setup completed successfully!"
    echo
    echo "=========================================="
    echo "  Setup Summary"
    echo "=========================================="
    echo "✅ System updated and optimized"
    echo "✅ Docker & Docker Compose installed"
    echo "✅ Node.js 18.x installed"
    echo "✅ Nginx installed and configured"
    echo "✅ Certbot installed for SSL"
    echo "✅ fail2ban configured for security"
    echo "✅ User 'wagateway' created"
    echo "✅ Monitoring script scheduled (daily at 9 AM)"
    echo "✅ Backup script scheduled (daily at 2 AM)"
    echo "✅ System update script scheduled (weekly on Sunday at 3 AM)"
    echo "✅ Log rotation configured"
    echo "✅ Firewall configured"
    echo
    echo "Next steps:"
    echo "1. Logout and login again to apply Docker group changes"
    echo "2. Switch to user 'wagateway': su - wagateway"
    echo "3. Clone WA Gateway repository"
    echo "4. Configure environment files"
    echo "5. Deploy with Docker Compose"
    echo
    echo "For detailed deployment instructions, see:"
    echo "docs/UBUNTU_DEPLOYMENT.md"
    echo
    warn "IMPORTANT: Please logout and login again to apply Docker group changes!"
}

# Run main function
main "$@"
