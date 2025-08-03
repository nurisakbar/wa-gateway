# WA Gateway Backend API

A comprehensive WhatsApp Gateway backend API built with Node.js, Express, and MySQL. This API provides a robust foundation for managing WhatsApp devices, sending messages, broadcasting, and handling real-time communications.

## 🚀 Features

### Core Features
- **Authentication & Authorization** - JWT-based authentication with role-based access control
- **Device Management** - WhatsApp device connection, QR code generation, status monitoring
- **Message Management** - Send individual and bulk messages with various media types
- **Contact Management** - CRUD operations for contacts with tagging and import/export
- **Broadcast System** - Mass messaging with scheduling and progress tracking
- **Template Management** - Message templates with variable substitution and approval workflow

### Advanced Features
- **Real-time Communication** - Socket.io integration for live updates
- **Analytics & Reporting** - Comprehensive statistics and data visualization
- **Notification System** - Multi-channel notifications (email, SMS, webhook)
- **Caching System** - Redis-based caching for improved performance
- **Background Jobs** - Queue system for asynchronous task processing
- **File Upload** - Media file handling with validation and storage
- **Rate Limiting** - API rate limiting and throttling
- **API Documentation** - Swagger/OpenAPI documentation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- Redis (v6.0 or higher)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd wa-gateway/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=wa_gateway
   DB_USER=root
   DB_PASSWORD=your_password

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h

   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0

   # Email Configuration
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Database Setup**
   ```bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE wa_gateway;"
   
   # Run migrations (if using Sequelize migrations)
   npm run migrate
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🧪 Testing

### Setup Test Environment
```bash
# Copy test environment file
cp env.test.example .env.test

# Create test database
mysql -u root -p -e "CREATE DATABASE wa_gateway_test;"
```

### Run Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:auth          # Authentication tests
npm run test:devices       # Device management tests
npm run test:messages      # Message management tests
npm run test:services      # Service layer tests

# Watch mode for development
npm run test:watch
```

### Test Coverage
The test suite includes:
- **Unit Tests** - Individual function and service testing
- **Integration Tests** - API endpoint and workflow testing
- **Service Tests** - Business logic and service layer testing
- **Authentication Tests** - JWT and authorization testing
- **Database Tests** - Model and data persistence testing

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Available Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user profile
- `POST /auth/refresh` - Refresh JWT token

#### Device Management
- `GET /devices` - Get all devices
- `POST /devices` - Create new device
- `GET /devices/:id` - Get specific device
- `PUT /devices/:id` - Update device
- `DELETE /devices/:id` - Delete device
- `POST /devices/:id/connect` - Connect device
- `POST /devices/:id/disconnect` - Disconnect device
- `GET /devices/:id/status` - Get device status

#### Message Management
- `POST /messages/send` - Send individual message
- `POST /messages/bulk-send` - Send bulk messages
- `GET /messages` - Get message history
- `GET /messages/:id` - Get specific message
- `DELETE /messages/:id` - Delete message
- `GET /messages/statistics` - Get message statistics

#### Contact Management
- `GET /contacts` - Get all contacts
- `POST /contacts` - Create new contact
- `GET /contacts/:id` - Get specific contact
- `PUT /contacts/:id` - Update contact
- `DELETE /contacts/:id` - Delete contact
- `POST /contacts/import` - Import contacts from CSV
- `GET /contacts/export` - Export contacts to CSV

#### Broadcast Management
- `POST /broadcasts/send` - Send broadcast message
- `POST /broadcasts/schedule` - Schedule broadcast
- `GET /broadcasts/:id/status` - Get broadcast status
- `DELETE /broadcasts/:id/cancel` - Cancel scheduled broadcast
- `GET /broadcasts/scheduled` - Get scheduled broadcasts
- `GET /broadcasts/contacts` - Get contacts for broadcast
- `GET /broadcasts/stats` - Get broadcast statistics

#### Template Management
- `GET /templates` - Get all templates
- `POST /templates` - Create new template
- `GET /templates/:id` - Get specific template
- `PUT /templates/:id` - Update template
- `DELETE /templates/:id` - Delete template
- `POST /templates/:id/approve` - Approve template
- `POST /templates/:id/reject` - Reject template

#### Analytics
- `GET /analytics/messages` - Message statistics
- `GET /analytics/devices` - Device statistics
- `GET /analytics/contacts` - Contact statistics
- `GET /analytics/users` - User activity report
- `GET /analytics/system` - System metrics

#### File Management
- `POST /files/upload` - Upload file
- `GET /files/:id` - Get file information
- `DELETE /files/:id` - Delete file

### Interactive API Documentation
Access the Swagger UI at: `http://localhost:3000/api-docs`

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── setup.js        # Test setup
├── uploads/            # File uploads
├── logs/               # Application logs
├── server.js           # Main server file
└── package.json        # Dependencies and scripts
```

### Available Scripts
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint issues
```

### Code Style
This project uses ESLint with Airbnb configuration. Run `npm run lint` to check code style and `npm run lint:fix` to automatically fix issues.

## 🚀 Deployment

### Production Setup
1. **Environment Configuration**
   ```bash
   NODE_ENV=production
   PORT=3000
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment
```bash
# Build Docker image
docker build -t wa-gateway-backend .

# Run container
docker run -p 3000:3000 --env-file .env wa-gateway-backend
```

### PM2 Deployment
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name "wa-gateway-backend"

# Monitor application
pm2 monit

# View logs
pm2 logs wa-gateway-backend
```

## 🔒 Security

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- SQL injection prevention
- XSS protection

### Environment Variables
Never commit sensitive information to version control. Use environment variables for:
- Database credentials
- JWT secrets
- API keys
- SMTP credentials
- Redis passwords

## 📊 Monitoring

### Logging
The application uses Winston for logging with different levels:
- `error` - Application errors
- `warn` - Warning messages
- `info` - General information
- `debug` - Debug information

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test files for usage examples

## 🔄 Changelog

### Version 1.0.0
- Initial release
- Complete API implementation
- Comprehensive test suite
- Documentation and deployment guides 