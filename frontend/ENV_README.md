# Environment Variables Configuration

File ini menjelaskan cara mengatur environment variables untuk aplikasi WA Gateway frontend.

## 📁 File Environment

### 1. `env.example` - Template untuk semua environment
- Berisi semua variabel yang diperlukan
- Copy file ini untuk membuat environment file yang sesuai

### 2. `.env.local` - Development environment
- Untuk development lokal
- Sudah dibuat otomatis dari `env.example`

### 3. `env.staging` - Staging environment
- Untuk testing di staging server
- Copy ke `.env.staging` untuk digunakan

### 4. `env.production` - Production environment
- Untuk production server
- Copy ke `.env.production` untuk digunakan

## 🔧 Cara Menggunakan

### Development
```bash
# File .env.local sudah dibuat otomatis
# Edit sesuai kebutuhan:
nano .env.local
```

### Staging
```bash
# Copy template staging
cp env.staging .env.staging

# Edit URL sesuai staging server
nano .env.staging
```

### Production
```bash
# Copy template production
cp env.production .env.production

# Edit URL sesuai production server
nano .env.production
```

## 📋 Variabel yang Tersedia

| Variabel | Deskripsi | Default |
|----------|-----------|---------|
| `NUXT_PUBLIC_API_BASE` | URL backend API | `http://localhost:3001/api/v1` |
| `NUXT_PUBLIC_SOCKET_URL` | URL socket server | `http://localhost:3001` |
| `NUXT_PUBLIC_APP_NAME` | Nama aplikasi | `WA Gateway` |
| `NUXT_PUBLIC_APP_VERSION` | Versi aplikasi | `1.0.0` |
| `NUXT_PUBLIC_API_KEY` | API key untuk WhatsApp | `wg_b4df277cf780df75227236e35b048975708affe0d1dcc1eaa5a443d356fec3b9` |
| `NUXT_PUBLIC_NODE_ENV` | Environment mode | `development` |

## 🚀 Deployment

### Development
```bash
npm run dev
# Menggunakan .env.local
```

### Staging
```bash
cp env.staging .env.staging
npm run build
npm run preview
# Menggunakan .env.staging
```

### Production
```bash
cp env.production .env.production
npm run build
npm run start
# Menggunakan .env.production
```

## ⚠️ Catatan Penting

1. **Jangan commit file `.env.*`** ke repository (kecuali `.env.example`)
2. **Ganti API key** untuk production dan staging
3. **Update URL** sesuai dengan server yang digunakan
4. **Restart aplikasi** setelah mengubah environment variables

## 🔒 Keamanan

- File `.env.*` sudah ditambahkan ke `.gitignore`
- API key production harus berbeda dari development
- Jangan share file environment ke public
