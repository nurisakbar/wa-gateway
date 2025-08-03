const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Device Model
 * Handles WhatsApp device sessions and connections
 */
const Device = sequelize.define('Device', {
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
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^(\+62|62|0)8[1-9][0-9]{6,9}$/
    }
  },
  session_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('disconnected', 'connecting', 'connected', 'error'),
    defaultValue: 'disconnected',
    allowNull: false
  },
  qr_code: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: true
  },
  connection_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional connection information like device info, platform, etc.'
  },
  settings: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Device-specific settings like auto-reply, webhook URL, etc.'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional metadata for the device'
  }
}, {
  tableName: 'devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['session_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['phone_number']
    }
  ]
});

/**
 * Instance methods
 */
Device.prototype.isConnected = function() {
  return this.status === 'connected';
};

Device.prototype.isConnecting = function() {
  return this.status === 'connecting';
};

Device.prototype.isDisconnected = function() {
  return this.status === 'disconnected';
};

Device.prototype.hasError = function() {
  return this.status === 'error';
};

Device.prototype.updateStatus = async function(status) {
  this.status = status;
  if (status === 'connected') {
    this.last_activity = new Date();
  }
  await this.save();
};

Device.prototype.updateActivity = async function() {
  this.last_activity = new Date();
  await this.save();
};

Device.prototype.setQRCode = async function(qrCode) {
  this.qr_code = qrCode;
  this.status = 'connecting';
  await this.save();
};

Device.prototype.clearQRCode = async function() {
  this.qr_code = null;
  await this.save();
};

Device.prototype.setConnectionInfo = async function(info) {
  this.connection_info = info;
  await this.save();
};

Device.prototype.getSetting = function(key, defaultValue = null) {
  return this.settings?.[key] ?? defaultValue;
};

Device.prototype.setSetting = async function(key, value) {
  if (!this.settings) {
    this.settings = {};
  }
  this.settings[key] = value;
  await this.save();
};

Device.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  // Don't include QR code in JSON response for security
  delete values.qr_code;
  return values;
};

/**
 * Class methods
 */
Device.findBySessionId = function(sessionId) {
  return this.findOne({ where: { session_id: sessionId } });
};

Device.findByPhoneNumber = function(phoneNumber) {
  return this.findOne({ where: { phone_number: phoneNumber } });
};

Device.findConnectedByUserId = function(userId) {
  return this.findAll({ 
    where: { 
      user_id: userId,
      status: 'connected'
    } 
  });
};

Device.findByUserId = function(userId) {
  return this.findAll({ 
    where: { user_id: userId },
    order: [['created_at', 'DESC']]
  });
};

Device.createDevice = async function(deviceData) {
  const device = await this.create(deviceData);
  return device.toJSON();
};

Device.updateDeviceStatus = async function(deviceId, status) {
  return this.update(
    { 
      status,
      ...(status === 'connected' && { last_activity: new Date() })
    },
    { where: { id: deviceId } }
  );
};

Device.updateLastActivity = async function(deviceId) {
  return this.update(
    { last_activity: new Date() },
    { where: { id: deviceId } }
  );
};

Device.getConnectedDevices = function() {
  return this.findAll({ 
    where: { status: 'connected' },
    order: [['last_activity', 'DESC']]
  });
};

Device.getDeviceStats = async function() {
  const stats = await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status']
  });
  
  const result = {
    total: 0,
    connected: 0,
    connecting: 0,
    disconnected: 0,
    error: 0
  };
  
  stats.forEach(stat => {
    const count = parseInt(stat.getDataValue('count'));
    const status = stat.getDataValue('status');
    result.total += count;
    result[status] = count;
  });
  
  return result;
};

/**
 * Scopes
 */
Device.addScope('active', {
  where: {
    status: ['connected', 'connecting']
  }
});

Device.addScope('connected', {
  where: {
    status: 'connected'
  }
});

Device.addScope('byUser', (userId) => ({
  where: { user_id: userId }
}));

/**
 * Associations
 */
// Device.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
// Device.hasMany(Message, { foreignKey: 'device_id', as: 'messages' });
// Device.hasMany(AutoReply, { foreignKey: 'device_id', as: 'autoReplies' });

module.exports = Device; 