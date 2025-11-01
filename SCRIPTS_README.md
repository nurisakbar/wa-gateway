# 🚀 WA Gateway - Scripts Management

Koleksi script untuk menjalankan dan mengelola backend dan frontend WA Gateway.

## 📁 Daftar Scripts

### 1. `start.sh` - Start Application
Script utama untuk menjalankan backend dan frontend.

**Usage:**
```bash
# Development mode (default)
./start.sh

# Development mode (explicit)
./start.sh dev

# Production mode
./start.sh production

# Production mode dengan PM2
./start.sh production true
```

**Fitur:**
- ✅ Auto install dependencies jika belum ada
- ✅ Start backend dan frontend secara berurutan
- ✅ Support PM2 untuk production
- ✅ Health check setelah start
- ✅ Menampilkan status dan URL

### 2. `stop.sh` - Stop Application
Script untuk menghentikan backend dan frontend.

**Usage:**
```bash
./stop.sh
```

**Fitur:**
- ✅ Stop PM2 processes
- ✅ Stop processes menggunakan PID file
- ✅ Kill processes secara graceful
- ✅ Cleanup PID files

### 3. `restart.sh` - Restart Application
Script untuk restart aplikasi.

**Usage:**
```bash
# Restart dalam development mode
./restart.sh

# Restart dalam production mode
./restart.sh production

# Restart dengan PM2
./restart.sh production true
```

### 4. `dev.sh` - Development Mode
Script shortcut untuk development mode.

**Usage:**
```bash
./dev.sh
```

**Equivalent to:**
```bash
./start.sh dev false
```

### 5. `prod.sh` - Production Mode
Script shortcut untuk production mode dengan PM2.

**Usage:**
```bash
./prod.sh
```

**Equivalent to:**
```bash
./start.sh production true
```

### 6. `status.sh` - Check Status
Script untuk mengecek status aplikasi.

**Usage:**
```bash
./status.sh
```

**Fitur:**
- ✅ Check backend status (PM2 atau process)
- ✅ Check frontend status
- ✅ Health check API
- ✅ Health check frontend web

## 🔧 Setup

### 1. Make Scripts Executable
```bash
chmod +x start.sh
chmod +x stop.sh
chmod +x restart.sh
chmod +x dev.sh
chmod +x prod.sh
chmod +x status.sh

# Atau semua sekaligus
chmod +x *.sh
```

### 2. Install Prerequisites

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

**PM2 (untuk production):**
```bash
npm install -g pm2
```

## 🚀 Quick Start

### Development Mode
```bash
# Start aplikasi
./dev.sh

# Atau
./start.sh dev

# Check status
./status.sh

# Stop aplikasi
./stop.sh
```

### Production Mode
```bash
# Start dengan PM2
./prod.sh

# Atau
./start.sh production true

# Check status
./status.sh

# Stop aplikasi
./stop.sh
```

## 📋 Workflow

### Development Workflow
```bash
# 1. Start development server
./dev.sh

# 2. Monitor logs (terminal terpisah)
tail -f backend/logs/combined.log
tail -f frontend/.nuxt/dev.log

# 3. Check status
./status.sh

# 4. Stop when done
./stop.sh
```

### Production Workflow
```bash
# 1. Deploy code
git pull origin main

# 2. Start dengan PM2
./prod.sh

# 3. Monitor dengan PM2
pm2 monit
pm2 logs klikwhatsapp-backend

# 4. Check status
./status.sh

# 5. Update dan restart
git pull origin main
cd backend && npm install --production
cd ../frontend && npm install --production
cd ..
./restart.sh production true
```

## 🔍 Monitoring

### Backend Monitoring

**With PM2:**
```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs klikwhatsapp-backend

# View info
pm2 info klikwhatsapp-backend

# View status
pm2 status
```

**Without PM2:**
```bash
# View logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Check process
ps aux | grep node
```

### Frontend Monitoring

```bash
# View logs (development)
tail -f frontend/.nuxt/dev.log

# Check process
ps aux | grep nuxt
```

## 🛠️ Troubleshooting

### Backend Tidak Start

```bash
# Check logs
tail -f backend/logs/error.log

# Check port availability
sudo netstat -tulpn | grep 3001

# Check database connection
cd backend
npm run test-connection
```

### Frontend Tidak Start

```bash
# Check logs
tail -f frontend/.nuxt/dev.log

# Check port availability
sudo netstat -tulpn | grep 3000

# Clear cache dan restart
cd frontend
rm -rf .nuxt .output node_modules/.cache
npm install
npm run dev
```

### Port Already in Use

```bash
# Kill process on port 3001 (backend)
sudo lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
sudo lsof -ti:3000 | xargs kill -9
```

### PM2 Issues

```bash
# Stop all PM2 processes
pm2 stop all
pm2 delete all

# Kill PM2 daemon
pm2 kill

# Restart PM2
pm2 resurrect
```

## 📊 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wa_gateway
DB_USER=root
DB_PASSWORD=your_password
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Frontend (.env)
```env
NUXT_PUBLIC_API_BASE=http://localhost:3001/api/v1
NUXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

## 🎯 Best Practices

1. **Development**: Gunakan `./dev.sh` untuk development lokal
2. **Production**: Gunakan `./prod.sh` dengan PM2 untuk production
3. **Monitoring**: Selalu monitor logs dan status setelah start
4. **Updates**: Selalu stop aplikasi sebelum update dependencies
5. **Backup**: Backup environment files sebelum perubahan besar
6. **Logs**: Monitor logs secara berkala untuk error detection

## 📚 Related Documentation

- [PM2 Deployment Guide](docs/PM2_DEPLOYMENT.md) - Panduan lengkap deploy dengan PM2
- [Backend README](backend/README.md) - Dokumentasi backend
- [Frontend README](frontend/README.md) - Dokumentasi frontend

---

**Status**: ✅ **READY** - Scripts siap digunakan untuk development dan production
