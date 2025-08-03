# 🐳 WA Gateway - Docker Deployment Guide

## 📋 Prerequisites

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git**

## ⚡ Quick Start with Docker

### 1. Clone Repository
```bash
git clone <repository-url>
cd wa-gateway
```

### 2. Setup Environment
```bash
# Copy environment template
cp docker.env.example .env

# Edit environment variables (optional)
nano .env
```

### 3. Start with Docker
```bash
# Make script executable
chmod +x docker-start.sh

# Start in production mode
./docker-start.sh start production

# Or start in development mode
./docker-start.sh start development
```

## 🚀 Docker Commands

### Using the Management Script
```bash
# Start services
./docker-start.sh start production
./docker-start.sh start development

# Stop services
./docker-start.sh stop production
./docker-start.sh stop development

# Restart services
./docker-start.sh restart production

# Check status
./docker-start.sh status production

# View logs
./docker-start.sh logs backend production
./docker-start.sh logs frontend development

# Cleanup everything
./docker-start.sh cleanup

# Show help
./docker-start.sh help
```

### Using Docker Compose Directly
```bash
# Production mode
docker-compose up -d
docker-compose down

# Development mode
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check status
docker-compose ps
```

## 🌐 Access Points

### Production Mode
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs

### Development Mode
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **phpMyAdmin**: http://localhost:8080
- **Redis Commander**: http://localhost:8081

## 📁 Docker Configuration Files

### Production Configuration
- `docker-compose.yml` - Main production configuration
- `backend/Dockerfile` - Backend production image
- `frontend/Dockerfile` - Frontend production image

### Development Configuration
- `docker-compose.dev.yml` - Development configuration
- `backend/Dockerfile.dev` - Backend development image
- `frontend/Dockerfile.dev` - Frontend development image

### Environment Configuration
- `docker.env.example` - Environment template
- `.env` - Your environment variables (create from template)

## 🔧 Services Overview

### Core Services
- **mysql** - MySQL 8.0 database
- **redis** - Redis 7 cache
- **backend** - Node.js API server
- **frontend** - Nuxt.js web application

### Optional Services
- **nginx** - Reverse proxy with SSL (production profile)
- **phpmyadmin** - Database management (development profile)
- **redis-commander** - Redis management (development profile)

## 🛠️ Development Mode

Development mode includes:
- Hot reload for both frontend and backend
- Volume mounting for live code changes
- Development tools (phpMyAdmin, Redis Commander)
- Debug-friendly configuration

```bash
# Start development environment
./docker-start.sh start development

# View development logs
./docker-start.sh logs backend development
```

## 🚀 Production Mode

Production mode includes:
- Optimized Docker images
- Production-ready configuration
- Health checks
- Proper logging

```bash
# Start production environment
./docker-start.sh start production

# Monitor production logs
./docker-start.sh logs backend production
```

## 🔐 Environment Variables

### Required Variables
```bash
# Database
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=wagateway
MYSQL_USER=wagateway
MYSQL_PASSWORD=wagateway123

# JWT
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# Application
NODE_ENV=production
PORT=3001
```

### Optional Variables
```bash
# Frontend URLs
NUXT_PUBLIC_API_URL=http://localhost:3001
NUXT_PUBLIC_WS_URL=ws://localhost:3001

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 📊 Monitoring & Logs

### View Service Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Using management script
./docker-start.sh logs backend production
```

### Health Checks
All services include health checks:
- **MySQL**: Database connectivity
- **Redis**: Cache connectivity
- **Backend**: API health endpoint
- **Frontend**: Web server response

### Resource Monitoring
```bash
# View resource usage
docker stats

# View container details
docker inspect wagateway-backend
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001

# Stop conflicting services
sudo systemctl stop apache2  # if using Apache
sudo systemctl stop nginx    # if using Nginx
```

#### 2. Database Connection Issues
```bash
# Check MySQL container
docker-compose logs mysql

# Connect to MySQL directly
docker-compose exec mysql mysql -u wagateway -p wagateway
```

#### 3. Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Fix Docker volume permissions
docker-compose down
sudo chown -R $USER:$USER ./uploads ./logs ./sessions
```

#### 4. Memory Issues
```bash
# Increase Docker memory limit
# Edit Docker Desktop settings or docker daemon config

# Clean up Docker resources
docker system prune -a
docker volume prune
```

### Reset Everything
```bash
# Complete cleanup
./docker-start.sh cleanup

# Rebuild images
docker-compose build --no-cache

# Start fresh
./docker-start.sh start production
```

## 🔒 Security Considerations

### Production Security
1. **Change default passwords** in `.env`
2. **Use strong JWT secrets**
3. **Enable SSL/TLS** with proper certificates
4. **Configure firewall rules**
5. **Regular security updates**

### SSL Configuration
```bash
# Generate SSL certificates
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Start with SSL
docker-compose --profile production up -d
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3

# Scale frontend services
docker-compose up -d --scale frontend=2
```

### Load Balancing
Use Nginx or Traefik for load balancing:
```bash
# Start with load balancer
docker-compose --profile production up -d
```

## 🔄 Updates & Maintenance

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Backups
```bash
# Create backup
docker-compose exec mysql mysqldump -u wagateway -p wagateway > backup.sql

# Restore backup
docker-compose exec -T mysql mysql -u wagateway -p wagateway < backup.sql
```

### Log Rotation
```bash
# Configure log rotation in docker-compose.yml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 📞 Support

### Getting Help
1. Check logs: `./docker-start.sh logs [service] [mode]`
2. Check status: `./docker-start.sh status [mode]`
3. Review configuration files
4. Check Docker documentation

### Useful Commands
```bash
# Enter container shell
docker-compose exec backend sh
docker-compose exec frontend sh

# View container resources
docker stats

# Check network connectivity
docker-compose exec backend ping mysql
docker-compose exec frontend ping backend
```

---

**Happy Dockerizing! 🐳** 