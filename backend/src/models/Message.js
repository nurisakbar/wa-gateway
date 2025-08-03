const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  device_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'devices',
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
  message_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'WhatsApp message ID'
  },
  direction: {
    type: DataTypes.ENUM('incoming', 'outgoing'),
    allowNull: false,
    defaultValue: 'outgoing'
  },
  message_type: {
    type: DataTypes.ENUM('text', 'image', 'video', 'audio', 'document', 'location', 'contact', 'sticker'),
    allowNull: false,
    defaultValue: 'text'
  },
  from_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Sender phone number (for incoming messages)'
  },
  to_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Recipient phone number (for outgoing messages)'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Message content or description'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'received'),
    allowNull: false,
    defaultValue: 'pending'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional message metadata (file info, location data, etc.)'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the message was sent'
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the message was delivered'
  },
  read_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the message was read'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if message failed'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['device_id'] },
    { fields: ['user_id'] },
    { fields: ['message_id'] },
    { fields: ['direction'] },
    { fields: ['message_type'] },
    { fields: ['status'] },
    { fields: ['from_number'] },
    { fields: ['to_number'] },
    { fields: ['created_at'] },
    { fields: ['device_id', 'created_at'] },
    { fields: ['user_id', 'created_at'] }
  ]
});

// Instance methods
Message.prototype.isIncoming = function() {
  return this.direction === 'incoming';
};

Message.prototype.isOutgoing = function() {
  return this.direction === 'outgoing';
};

Message.prototype.isText = function() {
  return this.message_type === 'text';
};

Message.prototype.isMedia = function() {
  return ['image', 'video', 'audio', 'document'].includes(this.message_type);
};

Message.prototype.isDelivered = function() {
  return this.status === 'delivered' || this.status === 'read';
};

Message.prototype.isRead = function() {
  return this.status === 'read';
};

Message.prototype.isFailed = function() {
  return this.status === 'failed';
};

Message.prototype.markAsDelivered = async function() {
  this.status = 'delivered';
  this.delivered_at = new Date();
  await this.save();
};

Message.prototype.markAsRead = async function() {
  this.status = 'read';
  this.read_at = new Date();
  await this.save();
};

Message.prototype.markAsFailed = async function(errorMessage) {
  this.status = 'failed';
  this.error_message = errorMessage;
  await this.save();
};

// Class methods
Message.findByMessageId = function(messageId) {
  return this.findOne({ where: { message_id: messageId } });
};

Message.findByDeviceId = function(deviceId, options = {}) {
  return this.findAll({
    where: { device_id: deviceId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Message.findByUserId = function(userId, options = {}) {
  return this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    ...options
  });
};

Message.getStats = async function(deviceId, period = '30d') {
  const startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return await this.findAll({
    where: {
      device_id: deviceId,
      created_at: { [require('sequelize').Op.gte]: startDate }
    },
    attributes: [
      'message_type',
      'direction',
      'status',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['message_type', 'direction', 'status']
  });
};

Message.getDailyStats = async function(deviceId, period = '30d') {
  const startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  return await this.findAll({
    where: {
      device_id: deviceId,
      created_at: { [require('sequelize').Op.gte]: startDate }
    },
    attributes: [
      [require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'date'],
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: [require('sequelize').fn('DATE', require('sequelize').col('created_at'))],
    order: [[require('sequelize').fn('DATE', require('sequelize').col('created_at')), 'ASC']]
  });
};

module.exports = Message; 