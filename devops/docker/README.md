# 🐳 Docker Deployment Scripts

Script untuk menjalankan aplikasi WA Gateway menggunakan Docker dan Docker Compose.

## 📋 Script yang Tersedia

### `docker-start.sh` - Docker Management
Script utama untuk mengelola Docker containers dengan berbagai command.

**Usage:**
```bash
./docker-start.sh start production    # Start production
./docker-start.sh start development   # Start development
./docker-start.sh stop                # Stop services
./docker-start.sh restart production  # Restart services
./docker-start.sh status              # Check status
./docker-start.sh logs backend        # View logs
./docker-start.sh cleanup             # Cleanup semua
./docker-start.sh help                # Show help
```

### `docker-run.sh` - Interactive Runner
Menu-based interactive script untuk menjalankan Docker.

**Usage:**
```bash
./docker-run.sh
# Akan menampilkan menu interaktif
```

### `start-dev.sh` - Quick Start Development
Quick start untuk development environment dengan Docker Compose.

**Usage:**
```bash
./start-dev.sh
```

### `start-prod.sh` - Quick Start Production
Quick start untuk production environment dengan Docker Compose.

**Usage:**
```bash
./start-prod.sh
```

## 📦 Prerequisites

1. **Docker** terinstall dan running
   ```bash
   docker --version
   docker info
   ```

2. **Docker Compose** terinstall
   ```bash
   docker-compose --version
   # atau
   docker compose version
   ```

3. **Environment file** (.env) di project root
   - Copy dari `docker.env.example` jika belum ada
   - Script akan otomatis membuat jika tidak ada

## 🚀 Quick Start

### Development Mode
```bash
cd devops/docker
./start-dev.sh
# atau
./docker-start.sh start development
```

### Production Mode
```bash
cd devops/docker
./start-prod.sh
# atau
./docker-start.sh start production
```

### Interactive Menu
```bash
cd devops/docker
./docker-run.sh
```

## 🐳 Docker Compose Commands

Setelah containers running, Anda bisa menggunakan Docker Compose commands:

```bash
# Status
docker compose ps
# atau
docker ps

# Logs
docker compose logs -f              # Follow semua logs
docker compose logs -f backend      # Backend only
docker compose logs -f frontend    # Frontend only

# Stop
docker compose stop                 # Stop containers
docker compose down                 # Stop dan remove containers

# Restart
docker compose restart              # Restart semua
docker compose restart backend      # Restart backend only

# Rebuild
docker compose up -d --build        # Rebuild dan start

# Cleanup
docker compose down -v              # Remove containers dan volumes
docker system prune -a              # Cleanup semua unused
```

## 📊 Services

Aplikasi terdiri dari beberapa services:

- **backend**: Node.js backend API (port 3001)
- **frontend**: Nuxt.js frontend (port 3000)
- **mysql**: MySQL database (port 3306)
- **redis**: Redis cache (port 6379)
- **nginx**: (optional) Reverse proxy

## 🔧 Configuration

### Environment Files
- **`.env`** di project root (untuk docker-compose)
- **`backend/.env`** untuk backend configuration
- Copy dari `docker.env.example` untuk template

### Docker Compose Files
- **`docker-compose.yml`** - Production configuration
- **`docker-compose.dev.yml`** - Development configuration

## 🌐 Access URLs

Setelah containers running:

**Development:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs
- phpMyAdmin: http://localhost:8080 (jika enabled)
- Redis Commander: http://localhost:8081 (jika enabled)

**Production:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

## 🆘 Troubleshooting

### Containers Won't Start
```bash
# Check logs
docker compose logs

# Check if ports are in use
docker compose ps
lsof -i :3000
lsof -i :3001

# Rebuild containers
docker compose down
docker compose up -d --build
```

### Database Connection Issues
```bash
# Check MySQL container
docker compose logs mysql
docker compose exec mysql mysql -u root -p

# Wait for MySQL to be ready
docker compose exec mysql mysqladmin ping -h localhost
```

### Cleanup Everything
```bash
# Remove all containers and volumes
docker compose down -v

# Remove unused images
docker system prune -a

# Full cleanup
docker compose down -v --rmi all
```

### Port Conflicts
```bash
# Use cleanup script
./../../devops/utils/cleanup-ports.sh

# Or manually
docker compose down
# Change ports in docker-compose.yml if needed
```

## 📝 Notes

- Semua script otomatis detect project root
- Environment file (.env) akan dibuat otomatis jika tidak ada
- Docker Compose file ada di project root
- Untuk development, gunakan `docker-compose.dev.yml`
- Containers akan otomatis restart jika crash (restart policy)

