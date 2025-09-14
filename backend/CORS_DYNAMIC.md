# 🌐 Dynamic CORS Configuration

## 📋 Konfigurasi CORS Dinamis

CORS configuration sekarang mendukung environment variables untuk origins yang dinamis.

### **Fixed Origins (Hardcoded)**
```javascript
const whitelist = [
  'http://103.125.181.245:3000',
  'http://wafe.klikmedis.com'
]
```

### **Dynamic Origins (Environment Variables)**
```javascript
// Tambahkan origins dari environment variables
...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [])
```

## 🔧 Environment Variables

### **File .env**
```env
ENABLE_CORS=true
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### **Cara Menambah Origins**
```env
# Tambahkan origins baru dengan dipisahkan koma
CORS_ORIGINS=http://localhost:3000,http://localhost:3001,https://newdomain.com,https://anotherdomain.com
```

## 🎯 Total Allowed Origins

Dengan konfigurasi saat ini, origins yang diizinkan:

1. **Fixed Origins:**
   - ✅ `http://103.125.181.245:3000`
   - ✅ `http://wafe.klikmedis.com`

2. **Dynamic Origins (dari .env):**
   - ✅ `http://localhost:3000`
   - ✅ `http://localhost:3001`

## 🚀 Cara Menggunakan

### **Development**
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### **Staging**
```env
CORS_ORIGINS=https://staging.yourdomain.com,https://staging-api.yourdomain.com
```

### **Production**
```env
CORS_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

## 🔄 Restart Server

Setelah mengubah environment variables, restart server:
```bash
npm run dev
# atau
npm start
```

---

**Status**: ✅ **DYNAMIC CORS CONFIGURED** - Origins dapat dikonfigurasi melalui environment variables
