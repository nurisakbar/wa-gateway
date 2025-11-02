# 🛠️ Utility Scripts

Utility scripts untuk maintenance dan troubleshooting aplikasi WA Gateway.

## 📋 Script yang Tersedia

### `cleanup-ports.sh` - Cleanup Ports
Membersihkan port yang digunakan oleh aplikasi (3000, 3001, 3306, 6379, dll).

**Usage:**
```bash
./cleanup-ports.sh
```

**What it does:**
- Check dan kill processes yang menggunakan port:
  - 3000 (Frontend)
  - 3001 (Backend)
  - 3306 (MySQL)
  - 6379 (Redis)
- Cleanup PM2 processes jika ada
- Cleanup Docker containers jika ada

**Warning:** Script ini akan kill processes yang menggunakan port tersebut. Pastikan tidak ada aplikasi lain yang penting menggunakan port tersebut.

## 🚀 Usage

### From Project Root
```bash
./devops/utils/cleanup-ports.sh
```

### From Scripts Directory
```bash
cd devops/utils
./cleanup-ports.sh
```

## ⚠️ Warning

Script ini akan:
- **Kill processes** yang menggunakan port aplikasi
- **Stop PM2 processes** jika ada
- **Stop Docker containers** jika ada

**Pastikan:**
- Tidak ada aplikasi penting menggunakan port tersebut
- Sudah save semua work yang penting
- Backend/frontend yang running memang ingin di-stop

## 🔧 Troubleshooting

### Script Won't Run
```bash
# Make sure script is executable
chmod +x cleanup-ports.sh

# Check if running from correct directory
pwd
```

### Permission Denied
```bash
# Some ports might need sudo
sudo ./cleanup-ports.sh
```

## 📝 Notes

- Script menggunakan `lsof` untuk check port (Mac/Linux)
- Untuk Windows, gunakan `netstat` atau taskkill
- Script akan prompt untuk confirmation sebelum kill processes
- PM2 processes akan di-stop sebelum kill processes
- Docker containers akan di-stop jika menggunakan port tersebut

