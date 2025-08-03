# WA Gateway Backend

Backend API untuk aplikasi WA Gateway menggunakan Node.js, Express.js, dan Baileys untuk integrasi WhatsApp.

## 🚀 Fitur

### Authentication System
- ✅ User registration dengan validasi
- ✅ User login dengan JWT
- ✅ Password hashing dengan bcrypt
- ✅ Role-based access control
- ✅ Account lockout protection
- ✅ Email verification (simulasi)
- ✅ Password reset (simulasi)
- ✅ Profile management

### Security Features
- ✅ JWT authentication
- ✅ Rate limiting
- ✅ Input validation
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Request logging

### Database
- ✅ MySQL dengan Sequelize ORM
- ✅ User model dengan associations
- ✅ Device model untuk WhatsApp sessions
- ✅ Database migration dan sync

## 📁 Struktur Project

```
backend/
├── src/
│   ├── controllers/
│   │   └── authController.js      # Authentication controller
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Device.js             # Device model
│   │   └── index.js              # Model associations
│   ├── routes/
│   │   └── auth.js               # Authentication routes
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── validation.js         # Input validation
│   ├── config/
│   │   └── database.js           # Database configuration
│   └── utils/
│       ├── logger.js             # Winston logger
│       └── helpers.js            # Utility functions
├── uploads/                      # File upload directory
├── sessions/                     # WhatsApp sessions
├── logs/                         # Application logs
├── package.json
├── server.js                     # Main server file
└── env.example                   # Environment variables example
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm atau yarn

### Installation

1. **Clone repository dan masuk ke folder backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
# Copy environment example
cp env.example .env

# Edit .env file sesuai konfigurasi database Anda
```

4. **Setup database**
```bash
# Buat database MySQL
mysql -u root -p
CREATE DATABASE wagateway;
```

5. **Jalankan server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔧 Environment Variables

Buat file `.env` dengan konfigurasi berikut:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wagateway
DB_USER=root
DB_PASSWORD=
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Development
DEBUG=true
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Password123",
  "full_name": "John Doe",
  "phone": "081234567890",
  "role": "operator"
}
```

#### Login User
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Updated",
  "phone": "081234567890",
  "bio": "My bio",
  "address": "My address"
}
```

#### Change Password
```http
PUT /api/v1/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "Password123",
  "newPassword": "NewPassword123"
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

### Response Format

Semua response menggunakan format JSON standar:

```json
{
  "error": false,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response

```json
{
  "error": true,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required",
      "value": ""
    }
  ]
}
```

## 🔐 Authentication

### JWT Token
- Access token berlaku 24 jam
- Refresh token berlaku 7 hari
- Token harus disertakan di header: `Authorization: Bearer <token>`

### Role Hierarchy
1. **super_admin** - Akses penuh
2. **admin** - Kelola user dan sistem
3. **manager** - Kelola device dan pesan
4. **operator** - Kirim pesan dan kelola kontak
5. **viewer** - Hanya lihat laporan

## 🗄️ Database Models

### User Model
- Authentication dan profile management
- Role-based access control
- Account security (lockout, verification)
- Password hashing otomatis

### Device Model
- WhatsApp session management
- Connection status tracking
- QR code generation
- Device settings dan metadata

## 🚀 Development

### Available Scripts
```bash
# Development mode dengan auto-reload
npm run dev

# Production mode
npm start

# Run tests
npm test

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Logging
- Winston logger untuk semua level
- File logging di `logs/` directory
- Console logging untuk development
- Request/response logging

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "version": "1.0.0"
}
```

## 📊 Monitoring

### API Documentation (Swagger)
Jika `ENABLE_SWAGGER=true`, dokumentasi tersedia di:
```
http://localhost:3000/api-docs
```

### Logs
- Error logs: `logs/error.log`
- Combined logs: `logs/combined.log`
- Console output untuk development

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 menit per IP
- **Speed Limiting**: Delay setelah 50 requests
- **Input Validation**: Express-validator untuk semua input
- **CORS**: Configurable origins
- **Helmet**: Security headers
- **JWT**: Secure token-based authentication
- **Password Hashing**: bcrypt dengan 12 rounds
- **Account Lockout**: 5 failed attempts = 15 menit lock

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Pastikan MySQL berjalan
   - Cek konfigurasi database di `.env`
   - Pastikan database `wagateway` sudah dibuat

2. **Port Already in Use**
   - Ganti port di `.env` file
   - Atau kill process yang menggunakan port 3000

3. **JWT Secret Not Set**
   - Pastikan `JWT_SECRET` dan `JWT_REFRESH_SECRET` sudah diset di `.env`

4. **CORS Issues**
   - Cek `CORS_ORIGIN` di `.env`
   - Pastikan frontend URL sudah ditambahkan

### Debug Mode
Set `DEBUG=true` di `.env` untuk mendapatkan log detail.

## 📝 Next Steps

### Phase 2: Core API Development
- [ ] Device management API
- [ ] Message sending API
- [ ] Contact management API
- [ ] File upload API
- [ ] WhatsApp integration dengan Baileys

### Phase 3: Advanced Features
- [ ] Auto-reply system
- [ ] Message templates
- [ ] Broadcast messages
- [ ] Webhook system
- [ ] Analytics API

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

---

**WA Gateway Backend** - Dibuat dengan ❤️ untuk bisnis modern 