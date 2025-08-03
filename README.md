# WA Gateway - WhatsApp Gateway Application

## 📋 Overview
WA Gateway adalah aplikasi untuk mengelola dan mengirim pesan WhatsApp secara otomatis dengan dukungan pengiriman file, media, dan dokumen.

## 🚀 Fitur Utama

### Core Features
- ✅ **Multi-device Management** - Kelola multiple WhatsApp sessions
- ✅ **Message Sending** - Text, media, documents, location, contacts
- ✅ **File Upload & Send** - Support berbagai format file
- ✅ **Message Receiving** - Auto-reply, webhook notifications
- ✅ **Contact Management** - Import/export contacts
- ✅ **Group Management** - Create, join, leave groups
- ✅ **Broadcast Messages** - Send to multiple contacts
- ✅ **Message Templates** - Pre-defined message formats

### Advanced Features
- 🔄 **Auto-reply System** - Bot responses berdasarkan keywords
- 📊 **Message Analytics** - Track sent/received messages
- 🔐 **API Authentication** - Secure endpoints dengan JWT
- 📱 **QR Code Generation** - Easy device connection
- 📚 **Message History** - Store dan retrieve conversations
- ⚡ **Webhook Integration** - Real-time notifications
- 📁 **File Management** - Upload, store, dan send files
- 🎯 **Scheduled Messages** - Kirim pesan terjadwal

## 🏗️ Arsitektur Sistem

```
Frontend (Nuxt.js):
├── Dashboard
│   ├── Device Status
│   ├── Message Statistics
│   └── Quick Actions
├── Message Center
│   ├── Send Messages
│   ├── File Upload
│   ├── Message History
│   └── Templates
├── Contact Management
│   ├── Contact List
│   ├── Import/Export
│   └── Groups
├── Settings
│   ├── Auto-reply Rules
│   ├── Webhook Configuration
│   └── API Keys
└── Analytics
    ├── Message Reports
    ├── Delivery Status
    └── Usage Statistics

Backend (Node.js + Express):
├── WhatsApp Service (Baileys)
│   ├── Connection Manager
│   ├── Message Handler
│   ├── File Handler
│   └── Event Listener
├── API Routes
│   ├── Auth Routes
│   ├── Message Routes
│   ├── Contact Routes
│   ├── File Routes
│   └── Webhook Routes
├── Database (MySQL)
│   ├── Users
│   ├── Devices
│   ├── Messages
│   ├── Contacts
│   └── Files
├── WebSocket (Socket.io)
│   ├── Real-time Updates
│   └── Connection Status
└── File Upload Handler
    ├── Multer Middleware
    ├── File Validation
    └── Storage Management
```

## 📁 Struktur Project

```
wagateway/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── messageController.js
│   │   │   ├── contactController.js
│   │   │   ├── fileController.js
│   │   │   └── webhookController.js
│   │   ├── services/
│   │   │   ├── whatsappService.js
│   │   │   ├── fileService.js
│   │   │   └── notificationService.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── messages.js
│   │   │   ├── contacts.js
│   │   │   ├── files.js
│   │   │   └── webhooks.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── validation.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Device.js
│   │   │   ├── Message.js
│   │   │   ├── Contact.js
│   │   │   └── File.js
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── whatsapp.js
│   │   └── utils/
│   │       ├── logger.js
│   │       └── helpers.js
│   ├── uploads/
│   ├── sessions/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── Messages/
│   │   ├── Contacts/
│   │   ├── Files/
│   │   └── Settings/
│   ├── pages/
│   ├── layouts/
│   ├── middleware/
│   ├── plugins/
│   ├── composables/
│   ├── utils/
│   ├── server/
│   │   ├── api/
│   │   └── middleware/
│   ├── public/
│   ├── nuxt.config.ts
│   └── package.json
├── database/
│   └── schema.sql
└── docs/
    ├── API.md
    ├── DEPLOYMENT.md
    └── TROUBLESHOOTING.md
```

## 🔧 Teknologi yang Digunakan

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Baileys** - WhatsApp Web library
- **MySQL** - Database
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **JWT** - Authentication
- **Cors** - Cross-origin resource sharing

### Frontend
- **Nuxt.js 3** - Full-stack Vue.js framework
- **Axios** - HTTP client
- **Socket.io-client** - Real-time updates
- **Nuxt Router** - Auto-generated routing
- **Bootstrap 5** - CSS framework
- **Vue Dropzone** - File upload UI
- **Chart.js** - Analytics charts
- **Nuxt Auth** - Authentication module
- **Nuxt Content** - Content management

## 📋 Modul Pengembangan

### Phase 1: Backend Foundation (Week 1-2)
- [ ] Project setup dan struktur backend
- [ ] Database schema design dan setup
- [ ] Basic Express server dengan middleware
- [ ] WhatsApp connection dengan Baileys
- [ ] **Authentication System (JWT)**
  - [ ] User registration dengan validasi
  - [ ] User login dengan password hashing
  - [ ] JWT token generation dan validation
  - [ ] Password reset functionality
  - [ ] Email verification system
  - [ ] Session management
  - [ ] Logout dan token blacklisting
- [ ] Basic API endpoints (auth, health check)

### Phase 2: Core API Development (Week 3-4)
- [ ] Device management API
- [ ] Message sending API (text only)
- [ ] Message receiving dan storage
- [ ] Contact management API
- [ ] File upload API
- [ ] WebSocket setup untuk real-time

### Phase 3: Advanced API Features (Week 5-6)
- [ ] File sending via WhatsApp API
- [ ] Auto-reply system API
- [ ] Message templates API
- [ ] Broadcast messages API
- [ ] Group management API
- [ ] Message history API

### Phase 4: API Integration & Testing (Week 7-8)
- [ ] Webhook system
- [ ] Message analytics API
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Error handling & logging
- [ ] API testing dengan Postman
- [ ] Performance optimization

### Phase 5: Frontend Development (Week 9-10)
- [ ] Nuxt.js project setup
- [ ] **Authentication UI & User Management**
  - [ ] Registration form dengan validasi
  - [ ] Login form dengan remember me
  - [ ] Password reset form
  - [ ] Email verification page
  - [ ] User profile management
  - [ ] Account settings page
  - [ ] Logout functionality
  - [ ] Protected route middleware
- [ ] Dashboard components
- [ ] Message management UI
- [ ] File upload interface
- [ ] Real-time integration

### Phase 6: Frontend Integration & Polish (Week 11-12)
- [ ] Complete UI/UX implementation
- [ ] API integration testing
- [ ] Real-time features
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Deployment preparation

## 📊 Database Schema

### Tables
1. **users** - User authentication dan profile
2. **devices** - WhatsApp device sessions
3. **messages** - Message history
4. **contacts** - Contact list
5. **files** - File storage metadata
6. **auto_replies** - Auto-reply rules
7. **message_templates** - Message templates
8. **webhooks** - Webhook configurations

## 🔐 Security Features
- JWT authentication
- API rate limiting
- File upload validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 📱 File Support
### Supported Formats
- **Images**: JPG, PNG, GIF, WEBP
- **Documents**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Videos**: MP4, AVI, MOV, 3GP
- **Audio**: MP3, WAV, OGG, M4A
- **Archives**: ZIP, RAR, 7Z

### File Limits
- **Max Size**: 16MB (WhatsApp limit)
- **Storage**: Local filesystem + database metadata
- **Cleanup**: Automatic cleanup untuk temporary files

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MySQL 8.0+
- npm atau yarn

### Installation
```bash
# Clone repository
git clone <repository-url>
cd wagateway

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure .env file

# Frontend setup
cd ../frontend
npm install
# Nuxt.js akan auto-generate struktur folder

# Database setup
mysql -u root -p < database/schema.sql
```

### Running
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## 📝 Documentation
- **Backend API Development**: Lihat file `docs/BACKEND_API_DEVELOPMENT.md` untuk panduan pengembangan backend API-first
- **API Documentation**: Lihat file `docs/API.md` untuk dokumentasi lengkap API endpoints
- **Authentication System**: Lihat file `docs/AUTHENTICATION_SYSTEM.md` untuk sistem autentikasi lengkap
- **Nuxt.js Setup**: Lihat file `docs/NUXT_SETUP.md` untuk panduan setup frontend Nuxt.js
- **Bootstrap Setup**: Lihat file `docs/BOOTSTRAP_SETUP.md` untuk panduan setup Bootstrap 5
- **Deployment Guide**: Lihat file `docs/DEPLOYMENT.md` untuk panduan deployment
- **Troubleshooting**: Lihat file `docs/TROUBLESHOOTING.md` untuk troubleshooting
- **Postman Collection**: Import file `postman/WA_Gateway_API.postman_collection.json` untuk testing API
- **Landing Page**: Lihat folder `landing-page/` untuk landing page promosi layanan

## 🤝 Contributing
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License
MIT License - lihat file LICENSE untuk detail.

## 🆘 Support
Untuk bantuan dan pertanyaan, buat issue di repository ini. 