const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Broadcast = sequelize.define('Broadcast', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  device_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Broadcast name'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Broadcast message content'
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document'),
    allowNull: false,
    defaultValue: 'text'
  },
  file_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'files',
      key: 'id'
    }
  },
  total_contacts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of contacts'
  },
  sent_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of messages sent'
  },
  failed_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of failed messages'
  },
  status: {
    type: DataTypes.ENUM('draft', 'sending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the broadcast is scheduled to be sent'
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the broadcast started sending'
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the broadcast completed'
  }
}, {
  tableName: 'broadcast_campaigns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['device_id'] },
    { fields: ['status'] },
    { fields: ['scheduled_at'] },
    { fields: ['created_at'] },
    { fields: ['user_id', 'created_at'] },
    { fields: ['device_id', 'created_at'] }
  ]
});

// Instance methods
Broadcast.prototype.isDraft = function() {
  return this.status === 'draft';
};

Broadcast.prototype.isSending = function() {
  return this.status === 'sending';
};

Broadcast.prototype.isCompleted = function() {
  return this.status === 'completed';
};

Broadcast.prototype.isFailed = function() {
  return this.status === 'failed';
};

Broadcast.prototype.getSuccessRate = function() {
  if (this.sent_count === 0) return 0;
  const delivered = this.sent_count - this.failed_count;
  return Math.round((delivered / this.sent_count) * 100);
};

Broadcast.prototype.markAsSending = async function() {
  this.status = 'sending';
  this.started_at = new Date();
  await this.save();
};

Broadcast.prototype.markAsCompleted = async function() {
  this.status = 'completed';
  this.completed_at = new Date();
  await this.save();
};

Broadcast.prototype.markAsFailed = async function() {
  this.status = 'failed';
  this.completed_at = new Date();
  await this.save();
};

Broadcast.prototype.updateCounts = async function(sent, failed) {
  this.sent_count = sent;
  this.failed_count = failed;
  await this.save();
};

// Class methods
Broadcast.findByUserId = function(userId, options = {}) {
  const { limit = 50, offset = 0, status, device_id } = options;
  
  const where = { user_id: userId };
  if (status) where.status = status;
  if (device_id) where.device_id = device_id;
  
  return this.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [
      {
        model: require('./Device'),
        as: 'device',
        attributes: ['id', 'name', 'phone_number']
      }
    ]
  });
};

Broadcast.getStatsByUserId = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('total_contacts')), 'total_contacts'],
      [sequelize.fn('SUM', sequelize.col('sent_count')), 'total_sent'],
      [sequelize.fn('SUM', sequelize.col('failed_count')), 'total_failed']
    ],
    group: ['status']
  });
};

module.exports = Broadcast;
