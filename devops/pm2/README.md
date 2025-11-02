# 🚀 PM2 Deployment Scripts

Script untuk menjalankan aplikasi WA Gateway menggunakan PM2 process manager (Linux/Mac).

## 📋 Script yang Tersedia

### `start.sh` - Start Application
Start aplikasi dalam development atau production mode.

**Usage:**
```bash
./start.sh              # Development mode (default)
./start.sh production    # Production mode
./start.sh dev          # Development mode (explicit)
```

### `prod.sh` - Production Mode
Start aplikasi khusus untuk production mode dengan optimasi.

**Usage:**
```bash
./prod.sh
```

### `dev.sh` - Development Mode
Start aplikasi khusus untuk development mode dengan hot reload.

**Usage:**
```bash
./dev.sh
```

### `stop.sh` - Stop Application
Stop semua aplikasi yang berjalan dengan PM2.

**Usage:**
```bash
./stop.sh               # Stop semua (tetap di PM2)
./stop.sh --delete      # Stop dan hapus dari PM2
```

### `restart.sh` - Restart Application
Restart aplikasi dengan zero downtime (reload).

**Usage:**
```bash
./restart.sh            # Restart semua
./restart.sh production # Restart dengan mode production
./restart.sh dev        # Restart dengan mode development
```

### `status.sh` - Check Status
Cek status aplikasi yang berjalan.

**Usage:**
```bash
./status.sh
```

### `cleanup-pm2.sh` - Cleanup Duplicates
Membersihkan proses PM2 yang duplikat.

**Usage:**
```bash
./cleanup-pm2.sh
```

## 📦 Prerequisites

1. **Node.js dan npm** terinstall
2. **PM2** terinstall:
   ```bash
   npm install -g pm2
   ```
3. **Backend dependencies** terinstall:
   ```bash
   cd ../../backend && npm install
   ```
4. **Frontend dependencies** terinstall:
   ```bash
   cd ../../frontend && npm install
   ```

## 🚀 Quick Start

### Development
```bash
cd devops/pm2
./start.sh dev
```

### Production
```bash
cd devops/pm2
./prod.sh
# atau
./start.sh production
```

### Stop Application
```bash
cd devops/pm2
./stop.sh
```

### Check Status
```bash
cd devops/pm2
./status.sh
# atau langsung
pm2 status
```

## 📊 PM2 Commands

Setelah aplikasi running, Anda bisa menggunakan PM2 commands langsung:

```bash
# Status
pm2 status
pm2 list

# Logs
pm2 logs                # Semua logs
pm2 logs wa-gateway-be  # Backend only
pm2 logs wa-gateway-fe  # Frontend only
pm2 logs --lines 100    # Last 100 lines

# Monitoring
pm2 monit               # Real-time monitoring

# Restart
pm2 restart wa-gateway-be
pm2 reload wa-gateway-be  # Zero downtime

# Stop
pm2 stop wa-gateway-be
pm2 stop all

# Delete
pm2 delete wa-gateway-be
pm2 delete all

# Save & Startup
pm2 save               # Save current process list
pm2 startup            # Setup auto-start on boot
```

## 🔧 Configuration

Konfigurasi PM2 ada di `backend/ecosystem.config.js`:
- **instances**: 1 (single instance)
- **exec_mode**: fork
- **max_memory_restart**: 1G
- **watch**: false (untuk production)

## 🆘 Troubleshooting

### Multiple Instances Running
```bash
./cleanup-pm2.sh
# atau
pm2 delete all
pm2 kill
```

### Application Won't Start
```bash
# Check logs
pm2 logs wa-gateway-be --err

# Check if ports are available
./../../devops/utils/cleanup-ports.sh

# Restart PM2 daemon
pm2 kill
pm2 resurrect
```

### Port Already in Use
```bash
# Check what's using the port
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Kill process or use cleanup script
./../../devops/utils/cleanup-ports.sh
```

## 📝 Notes

- Semua script otomatis detect project root, jadi bisa dijalankan dari folder `devops/pm2/`
- Script akan otomatis stop/delete proses yang sudah ada sebelum membuat yang baru
- Backend menggunakan `ecosystem.config.js` jika tersedia
- PM2 akan auto-save process list setelah start
- Untuk auto-start on boot, jalankan: `pm2 startup` lalu `pm2 save`

