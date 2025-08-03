# WA Gateway Docker Scripts Guide

This guide explains how to use the various Docker scripts available for running WA Gateway.

## Available Scripts

### Linux/macOS Scripts
- `start-dev.sh` - Start development environment with Docker Compose
- `start-prod.sh` - Start production environment with Docker Compose
- `docker-start.sh` - Comprehensive Docker management script

### Windows Scripts
- `start-dev.bat` - Start development environment with Docker Compose (Windows)
- `start-prod.bat` - Start production environment with Docker Compose (Windows)

## Quick Start

### Development Environment

**Linux/macOS:**
```bash
./start-dev.sh
```

**Windows:**
```cmd
start-dev.bat
```

### Production Environment

**Linux/macOS:**
```bash
./start-prod.sh
```

**Windows:**
```cmd
start-prod.bat
```

## Comprehensive Docker Management

The `docker-start.sh` script provides a comprehensive set of commands for managing your Docker environment:

### Basic Commands

```bash
# Start services
./docker-start.sh start production
./docker-start.sh start development

# Stop services
./docker-start.sh stop production
./docker-start.sh stop development

# Restart services
./docker-start.sh restart production
./docker-start.sh restart development

# Check status
./docker-start.sh status production
./docker-start.sh status development

# View logs
./docker-start.sh logs backend development
./docker-start.sh logs frontend production

# Clean up (removes all containers, networks, and volumes)
./docker-start.sh cleanup

# Show help
./docker-start.sh help
```

## Environment Configuration

All scripts will automatically create a `.env` file if it doesn't exist. The scripts will:

1. Check for `docker.env.example` and copy it to `.env`
2. If no example file exists, create a basic `.env` file with default values

### Important Environment Variables

```env
# Database Configuration
MYSQL_ROOT_PASSWORD=your-secure-root-password
MYSQL_DATABASE=wagateway
MYSQL_USER=wagateway
MYSQL_PASSWORD=your-secure-password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret

# Environment
NODE_ENV=production
```

## Service URLs

Once the services are running, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **phpMyAdmin** (Development): http://localhost:8080
- **Redis Commander** (Development): http://localhost:8081

## Development vs Production

### Development Mode
- Uses `docker-compose.dev.yml`
- Includes development tools (phpMyAdmin, Redis Commander)
- Hot reload enabled for code changes
- Debug-friendly configuration

### Production Mode
- Uses `docker-compose.yml`
- Optimized for production performance
- No development tools included
- Secure configuration

## Troubleshooting

### Common Issues

1. **Docker not installed**
   - Install Docker Desktop for Windows/macOS
   - Install Docker Engine for Linux

2. **Docker Compose not found**
   - Docker Compose is included with Docker Desktop
   - For Linux, install separately: `sudo apt-get install docker-compose`

3. **Port conflicts**
   - Check if ports 3000, 3001, 3306, 6379, 8080, 8081 are available
   - Stop conflicting services or modify ports in docker-compose files

4. **Permission denied (Linux/macOS)**
   - Make scripts executable: `chmod +x *.sh`

### Useful Commands

```bash
# View all running containers
docker ps

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Remove all containers and volumes
docker compose down -v

# Rebuild images
docker compose build --no-cache

# Check disk usage
docker system df

# Clean up unused resources
docker system prune
```

## File Structure

```
wa-gateway/
├── start-dev.sh          # Development startup script (Linux/macOS)
├── start-prod.sh         # Production startup script (Linux/macOS)
├── start-dev.bat         # Development startup script (Windows)
├── start-prod.bat        # Production startup script (Windows)
├── docker-start.sh       # Comprehensive Docker management script
├── docker-compose.yml    # Production Docker Compose configuration
├── docker-compose.dev.yml # Development Docker Compose configuration
├── docker.env.example    # Environment variables template
└── .env                  # Environment variables (created automatically)
```

## Security Notes

- Always change default passwords in production
- Use strong JWT secrets
- Keep your `.env` file secure and never commit it to version control
- Regularly update Docker images for security patches

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs: `docker compose logs -f`
3. Ensure all prerequisites are installed
4. Verify your `.env` file configuration 