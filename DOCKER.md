# 🐳 WA Gateway Docker Setup for macOS

This guide will help you run the complete WA Gateway application using Docker on macOS.

## 📋 Prerequisites

### 1. Install Docker Desktop for macOS
- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Ensure Docker is running (check the whale icon in your menu bar)

### 2. Install Docker Compose
Docker Compose usually comes with Docker Desktop, but you can verify with:
```bash
docker-compose --version
```

## 🚀 Quick Start

### Option 1: Using the Automated Script (Recommended)

1. **Make the script executable:**
   ```bash
   chmod +x docker-run.sh
   ```

2. **Start WA Gateway:**
   ```bash
   ./docker-run.sh start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/api-docs

### Option 2: Manual Docker Commands

1. **Create necessary directories:**
   ```bash
   mkdir -p backend/uploads backend/logs nginx/logs nginx/ssl
   ```

2. **Generate SSL certificate (for HTTPS):**
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout nginx/ssl/key.pem \
     -out nginx/ssl/cert.pem \
     -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
   ```

3. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

4. **Check service status:**
   ```bash
   docker-compose ps
   ```

## 🏗️ Architecture

The Docker setup includes the following services:

### Services Overview
- **MySQL (Port 3306)** - Database
- **Redis (Port 6379)** - Caching and queues
- **Backend (Port 3000)** - Node.js API server
- **Frontend (Port 3001)** - Nuxt.js web application
- **Nginx (Port 80/443)** - Reverse proxy and load balancer

### Network Configuration
- All services communicate through the `wa-gateway-network`
- Nginx acts as a reverse proxy for both frontend and backend
- WebSocket connections are properly handled for real-time features

## 📁 Directory Structure

```
wa-gateway/
├── docker-compose.yml          # Main Docker Compose configuration
├── docker-run.sh              # Automated setup script
├── backend/
│   ├── Dockerfile             # Backend container configuration
│   ├── uploads/               # File uploads (mounted volume)
│   └── logs/                  # Application logs (mounted volume)
├── frontend/
│   └── Dockerfile             # Frontend container configuration
└── nginx/
    ├── nginx.conf             # Nginx configuration
    ├── ssl/                   # SSL certificates
    └── logs/                  # Nginx logs (mounted volume)
```

## ⚙️ Configuration

### Environment Variables

The application uses the following environment variables (configured in `docker-compose.yml`):

#### Database
- `DB_HOST=mysql`
- `DB_PORT=3306`
- `DB_NAME=wa_gateway`
- `DB_USER=wa_user`
- `DB_PASSWORD=wa_password`

#### Redis
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`

#### JWT
- `JWT_SECRET=your-super-secret-jwt-key-change-this-in-production`

#### SMTP (Email)
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_USER=your-email@gmail.com`
- `SMTP_PASS=your-app-password`

### Customizing Configuration

1. **Edit docker-compose.yml** to modify environment variables
2. **Update nginx/nginx.conf** for custom proxy rules
3. **Modify Dockerfiles** for additional dependencies

## 🛠️ Management Commands

### Using the Script
```bash
# Start services
./docker-run.sh start

# Stop services
./docker-run.sh stop

# Show status
./docker-run.sh status

# View logs
./docker-run.sh logs

# Restart services
./docker-run.sh restart

# Cleanup everything
./docker-run.sh cleanup
```

### Using Docker Compose Directly
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and start
docker-compose up -d --build

# Stop and remove volumes
docker-compose down -v
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Stop conflicting services or change ports in docker-compose.yml
```

#### 2. Permission Issues
```bash
# Fix directory permissions
sudo chown -R $USER:$USER backend/uploads backend/logs nginx/logs nginx/ssl
```

#### 3. Docker Not Running
```bash
# Start Docker Desktop
open -a Docker
```

#### 4. Services Not Starting
```bash
# Check logs
docker-compose logs

# Check specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql
```

#### 5. Database Connection Issues
```bash
# Wait for MySQL to be ready
docker-compose exec mysql mysqladmin ping -h"localhost"

# Check MySQL logs
docker-compose logs mysql
```

### Health Checks

The application includes health check endpoints:

- **Backend Health**: http://localhost:3000/api/health
- **Nginx Health**: http://localhost/health
- **Frontend**: http://localhost:3001

## 🔒 Security Considerations

### Development vs Production

#### Development (Current Setup)
- Self-signed SSL certificates
- Default passwords
- Debug logging enabled
- No rate limiting on some endpoints

#### Production Recommendations
1. **Use real SSL certificates** (Let's Encrypt or commercial)
2. **Change default passwords** in docker-compose.yml
3. **Enable proper rate limiting**
4. **Use environment files** for sensitive data
5. **Enable security headers**
6. **Regular security updates**

### Environment File Setup

Create `.env` file for production:
```bash
# Database
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=wa_gateway
MYSQL_USER=wa_user
MYSQL_PASSWORD=your-secure-password

# JWT
JWT_SECRET=your-super-secure-jwt-secret

# SMTP
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📊 Monitoring

### View Resource Usage
```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

### Log Management
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs -f backend

# Export logs
docker-compose logs > wa-gateway-logs.txt
```

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Backups
```bash
# Create backup
docker-compose exec mysql mysqldump -u root -p wa_gateway > backup.sql

# Restore backup
docker-compose exec -T mysql mysql -u root -p wa_gateway < backup.sql
```

### Cleanup
```bash
# Remove unused containers, networks, and images
docker system prune

# Remove everything including volumes
docker system prune -a --volumes
```

## 🎯 Next Steps

1. **Configure your domain** and update nginx configuration
2. **Set up SSL certificates** for production
3. **Configure email settings** for notifications
4. **Set up monitoring** and alerting
5. **Implement backup strategies**
6. **Configure CI/CD pipelines**

## 📞 Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker info`
3. Check service status: `docker-compose ps`
4. Review this documentation
5. Check the main README.md for additional information

---

**Happy Dockerizing! 🐳** 