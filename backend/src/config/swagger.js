const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'WA Gateway API',
      version: '1.0.0',
      description: 'WhatsApp Gateway API for managing WhatsApp devices, messages, contacts, and broadcasts',
      contact: {
        name: 'WA Gateway Support',
        email: 'support@wagateway.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.wagateway.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        // User schemas
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string', minLength: 3, maxLength: 50 },
            email: { type: 'string', format: 'email' },
            full_name: { type: 'string', maxLength: 100 },
            role: { 
              type: 'string', 
              enum: ['super_admin', 'admin', 'manager', 'operator', 'viewer'] 
            },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        
        // Device schemas
        Device: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            phone_number: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['disconnected', 'connecting', 'connected', 'error'] 
            },
            is_active: { type: 'boolean' },
            last_activity: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        // Message schemas
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            device_id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            to_number: { type: 'string' },
            from_number: { type: 'string' },
            message_type: { 
              type: 'string', 
              enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker'] 
            },
            content: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['pending', 'sent', 'delivered', 'read', 'failed'] 
            },
            message_id: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        // Contact schemas
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', maxLength: 100 },
            phone_number: { type: 'string' },
            email: { type: 'string', format: 'email' },
            tags: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        // Template schemas
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            name: { type: 'string', maxLength: 100 },
            category: { 
              type: 'string', 
              enum: ['marketing', 'utility', 'authentication'] 
            },
            language: { type: 'string', maxLength: 10 },
            content: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
            status: { 
              type: 'string', 
              enum: ['draft', 'pending', 'approved', 'rejected'] 
            },
            description: { type: 'string' },
            usage_count: { type: 'integer', minimum: 0 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },

        // Broadcast schemas
        Broadcast: {
          type: 'object',
          properties: {
            broadcast_id: { type: 'string' },
            device_id: { type: 'string', format: 'uuid' },
            total_contacts: { type: 'integer', minimum: 0 },
            sent: { type: 'integer', minimum: 0 },
            failed: { type: 'integer', minimum: 0 },
            pending: { type: 'integer', minimum: 0 },
            status: { 
              type: 'string', 
              enum: ['pending', 'processing', 'completed', 'failed'] 
            },
            scheduled_at: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // Error schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },

        // Success response schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/controllers/*.js'
  ]
};

module.exports = swaggerJsdoc(options); 