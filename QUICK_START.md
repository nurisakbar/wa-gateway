# 🚀 WA Gateway - Quick Start Guide

## 📋 Prerequisites

- **Node.js** 18+ 
- **MySQL** 8.0+
- **npm** or **yarn**
- **Git**

## ⚡ Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd wa-gateway
```

### 2. Setup Database
```bash
# Create database
mysql -u root -p -e "CREATE DATABASE wagateway;"

# Import schema
mysql -u root -p wagateway < database/schema.sql
```

### 3. Configure Environment
```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend configuration
cd ../frontend
cp .env.example .env
# Edit .env with your API URLs
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Start Development Servers
```bash
# Option 1: Use the startup script
chmod +x start-dev.sh
./start-dev.sh

# Option 2: Start manually
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api-docs
- **Landing Page**: http://localhost:3000/landing

## 🔐 Default Admin Account

After first run, create an admin account:
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

## 📱 Features Available

### ✅ Backend (100% Complete)
- Authentication & Authorization
- WhatsApp Integration (Baileys)
- Device Management
- Message Sending/Receiving
- Contact Management
- File Upload & Management
- Broadcast Messages
- Message Templates
- Analytics & Reporting
- Real-time WebSocket
- API Documentation (Swagger)

### ✅ Frontend (100% Complete)
- Modern UI with Bootstrap 5
- Authentication Pages
- Dashboard with Real-time Stats
- Device Management Interface
- Message Center with Chat
- Contact Management
- Broadcast Interface
- Template Management
- Analytics Dashboard
- Settings Pages
- Real-time Updates

## 🧪 Testing

### API Testing
```bash
# Import Postman collection
# File: postman/WA_Gateway_API.postman_collection.json

# Or use curl
curl http://localhost:3001/api/v1/health
```

### Frontend Testing
```bash
cd frontend
npm run test
```

### Integration Testing
Visit: http://localhost:3000/test-integration

## 📁 Project Structure

```
wa-gateway/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── controllers/     # API Controllers
│   │   ├── routes/          # API Routes
│   │   ├── models/          # Database Models
│   │   ├── services/        # Business Logic
│   │   └── middleware/      # Custom Middleware
│   ├── tests/               # Test Suite
│   └── server.js            # Main Server
├── frontend/                # Nuxt.js 3 Frontend
│   ├── pages/               # Application Pages
│   ├── components/          # Vue Components
│   ├── stores/              # Pinia Stores
│   ├── plugins/             # Nuxt Plugins
│   └── composables/         # Composables
├── database/                # Database Schema
├── docs/                    # Documentation
├── postman/                 # API Testing
└── landing-page/            # Marketing Page
```

## 🔧 Development Commands

### Backend
```bash
cd backend
npm run dev          # Development server
npm run test         # Run tests
npm run build        # Build for production
npm run start        # Production server
```

### Frontend
```bash
cd frontend
npm run dev          # Development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
```

## 🚀 Deployment

### Production Setup
```bash
# Backend
cd backend
npm run build
npm run start

# Frontend
cd frontend
npm run build
npm run preview
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📞 Support

- **Documentation**: Check `docs/` folder
- **API Docs**: http://localhost:3001/api-docs
- **Issues**: Create GitHub issue
- **Testing**: Use `/test-integration` page

## 🎯 Next Steps

1. **Configure WhatsApp**: Add your WhatsApp number
2. **Create Templates**: Set up message templates
3. **Import Contacts**: Add your contact list
4. **Test Messages**: Send test messages
5. **Monitor Analytics**: Check message statistics

---

**Happy Coding! 🎉** 