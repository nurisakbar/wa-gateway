const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Webhook = sequelize.define('Webhook', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Human readable name for the webhook'
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Webhook URL endpoint'
  },
  events: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of events to listen for'
  },
  secret: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Webhook secret for signature verification'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this webhook is active'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    comment: 'Number of retry attempts for failed deliveries'
  },
  timeout: {
    type: DataTypes.INTEGER,
    defaultValue: 10000,
    comment: 'Timeout in milliseconds for webhook delivery'
  },
  last_delivery_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last successful delivery timestamp'
  },
  last_error_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last error timestamp'
  },
  last_error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Last error message'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'webhooks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['url']
    }
  ]
});

// Instance methods
Webhook.prototype.isValidUrl = function() {
  try {
    new URL(this.url);
    return true;
  } catch {
    return false;
  }
};

Webhook.prototype.shouldRetry = function() {
  return this.retry_count > 0;
};

Webhook.prototype.decrementRetryCount = function() {
  this.retry_count = Math.max(0, this.retry_count - 1);
};

// Static methods
Webhook.getActiveWebhooks = async function(userId, events = []) {
  const where = { user_id: userId, is_active: true };
  
  if (events.length > 0) {
    where.events = {
      [require('sequelize').Op.overlap]: events
    };
  }
  
  return await this.findAll({ where });
};

module.exports = Webhook; 