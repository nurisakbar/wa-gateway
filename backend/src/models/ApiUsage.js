const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ApiUsage = sequelize.define('ApiUsage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  api_key_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'api_keys',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  endpoint: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'API endpoint that was called'
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: 'HTTP method (GET, POST, etc.)'
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'HTTP status code'
  },
  response_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Response time in milliseconds'
  },
  request_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Request size in bytes'
  },
  response_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Response size in bytes'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'Client IP address'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if request failed'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional request metadata'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'api_usage',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['api_key_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['endpoint']
    },
    {
      fields: ['status_code']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['api_key_id', 'created_at']
    }
  ]
});

// Instance methods
ApiUsage.prototype.isSuccess = function() {
  return this.status_code >= 200 && this.status_code < 300;
};

ApiUsage.prototype.isError = function() {
  return this.status_code >= 400;
};

// Static methods
ApiUsage.getUserStats = async function(userId, startDate, endDate) {
  const where = { user_id: userId };
  if (startDate && endDate) {
    where.created_at = {
      [require('sequelize').Op.between]: [startDate, endDate]
    };
  }

  const stats = await this.findAll({
    where,
    attributes: [
      'status_code',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time'],
      [sequelize.fn('SUM', sequelize.col('request_size')), 'total_request_size'],
      [sequelize.fn('SUM', sequelize.col('response_size')), 'total_response_size']
    ],
    group: ['status_code']
  });

  return stats;
};

ApiUsage.getApiKeyStats = async function(apiKeyId, startDate, endDate) {
  const where = { api_key_id: apiKeyId };
  if (startDate && endDate) {
    where.created_at = {
      [require('sequelize').Op.between]: [startDate, endDate]
    };
  }

  const stats = await this.findAll({
    where,
    attributes: [
      'endpoint',
      'status_code',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('AVG', sequelize.col('response_time')), 'avg_response_time']
    ],
    group: ['endpoint', 'status_code'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
  });

  return stats;
};

module.exports = ApiUsage; 