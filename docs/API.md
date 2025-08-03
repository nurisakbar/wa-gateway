# WA Gateway API Documentation

## 🔐 Authentication
Semua API endpoints (kecuali login/register) memerlukan JWT token di header:
```
Authorization: Bearer <jwt_token>
```

## 📋 Base URL
```
http://localhost:3001/api/v1
```

## 🔑 Authentication Endpoints

### POST /auth/register
Register user baru
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "fullName": "string"
}
```

### POST /auth/login
Login user
```json
{
  "email": "string",
  "password": "string"
}
```

### POST /auth/logout
Logout user (invalidate token)

### GET /auth/profile
Get user profile

## 📱 WhatsApp Device Management

### GET /devices
Get semua device yang terdaftar

### POST /devices/create
Buat device baru
```json
{
  "name": "string",
  "description": "string"
}
```

### GET /devices/:id/qr
Generate QR code untuk device

### GET /devices/:id/status
Check status device

### DELETE /devices/:id
Hapus device

## 💬 Message Endpoints

### POST /messages/send
Kirim pesan text
```json
{
  "deviceId": "string",
  "to": "6281234567890",
  "message": "string",
  "type": "text"
}
```

### POST /messages/send-media
Kirim pesan dengan media
```json
{
  "deviceId": "string",
  "to": "6281234567890",
  "message": "string",
  "type": "image|video|audio|document",
  "fileId": "string"
}
```

### POST /messages/broadcast
Kirim pesan ke multiple contacts
```json
{
  "deviceId": "string",
  "contacts": ["6281234567890", "6281234567891"],
  "message": "string",
  "type": "text|image|video|audio|document",
  "fileId": "string"
}
```

### GET /messages/history
Get message history
```
Query Parameters:
- deviceId: string
- contact: string (optional)
- limit: number (default: 50)
- offset: number (default: 0)
- type: string (optional)
```

### GET /messages/:id
Get detail message

## 📁 File Management

### POST /files/upload
Upload file
```
Content-Type: multipart/form-data
Body:
- file: File
- type: string (image|video|audio|document)
```

### GET /files
Get semua file
```
Query Parameters:
- type: string (optional)
- limit: number (default: 20)
- offset: number (default: 0)
```

### GET /files/:id
Get file detail

### DELETE /files/:id
Hapus file

### GET /files/:id/download
Download file

## 👥 Contact Management

### GET /contacts
Get semua contacts
```
Query Parameters:
- search: string (optional)
- limit: number (default: 50)
- offset: number (default: 0)
```

### POST /contacts
Tambah contact baru
```json
{
  "name": "string",
  "phone": "6281234567890",
  "email": "string (optional)",
  "notes": "string (optional)"
}
```

### POST /contacts/import
Import contacts dari CSV
```
Content-Type: multipart/form-data
Body:
- file: CSV file
```

### GET /contacts/export
Export contacts ke CSV

### PUT /contacts/:id
Update contact
```json
{
  "name": "string",
  "phone": "6281234567890",
  "email": "string",
  "notes": "string"
}
```

### DELETE /contacts/:id
Hapus contact

## 🏷️ Message Templates

### GET /templates
Get semua templates

### POST /templates
Buat template baru
```json
{
  "name": "string",
  "content": "string",
  "variables": ["name", "company"],
  "category": "string"
}
```

### PUT /templates/:id
Update template

### DELETE /templates/:id
Hapus template

## 🔄 Auto-reply System

### GET /auto-replies
Get semua auto-reply rules

### POST /auto-replies
Buat auto-reply rule
```json
{
  "keyword": "string",
  "response": "string",
  "isActive": true,
  "deviceId": "string"
}
```

### PUT /auto-replies/:id
Update auto-reply rule

### DELETE /auto-replies/:id
Hapus auto-reply rule

## 📊 Analytics

### GET /analytics/messages
Get message statistics
```
Query Parameters:
- deviceId: string (optional)
- startDate: string (YYYY-MM-DD)
- endDate: string (YYYY-MM-DD)
```

### GET /analytics/devices
Get device usage statistics

### GET /analytics/files
Get file upload statistics

## 🔗 Webhook Management

### GET /webhooks
Get semua webhook configurations

### POST /webhooks
Buat webhook baru
```json
{
  "url": "string",
  "events": ["message", "status", "contact"],
  "isActive": true,
  "secret": "string"
}
```

### PUT /webhooks/:id
Update webhook

### DELETE /webhooks/:id
Hapus webhook

### POST /webhooks/test/:id
Test webhook

## 📈 Real-time Events (WebSocket)

### Connection
```
ws://localhost:3001/socket
```

### Events
- `device_status` - Device connection status
- `message_received` - New message received
- `message_sent` - Message sent successfully
- `file_uploaded` - File upload completed
- `error` - Error notifications

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "string"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## 🔢 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## 📋 Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid JWT token
- `DEVICE_NOT_FOUND` - Device not found
- `DEVICE_NOT_CONNECTED` - Device not connected
- `INVALID_PHONE` - Invalid phone number
- `FILE_TOO_LARGE` - File size exceeds limit
- `INVALID_FILE_TYPE` - File type not supported
- `CONTACT_NOT_FOUND` - Contact not found
- `MESSAGE_FAILED` - Message sending failed

## 🧪 Testing

### Postman Collection
Import file `postman/WA_Gateway_API.postman_collection.json` ke Postman untuk testing.

### cURL Examples

#### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

#### Send Message
```bash
curl -X POST http://localhost:3001/api/v1/messages/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"device_id","to":"6281234567890","message":"Hello!","type":"text"}'
```

#### Upload File
```bash
curl -X POST http://localhost:3001/api/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.jpg" \
  -F "type=image"
``` 