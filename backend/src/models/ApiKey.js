const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const ApiKey = sequelize.define('ApiKey', {
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
  device_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'devices',
      key: 'id'
    },
    comment: 'If set, this API key is bound to a specific device'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Human readable name for the API key'
  },
  key_hash: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Hashed version of the API key'
  },
  key_prefix: {
    type: DataTypes.STRING(8),
    allowNull: false,
    comment: 'First 8 characters of the API key for identification'
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: {
      read: true,
      write: true,
      admin: false
    },
    comment: 'Permissions for this API key'
  },
  rate_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 1000,
    comment: 'Rate limit per hour for this API key'
  },
  ip_whitelist: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of allowed IP addresses (empty = all allowed)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this API key is active'
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this API key was used'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Expiration date (null = never expires)'
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
  tableName: 'api_keys',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['device_id']
    },
    {
      fields: ['key_hash'],
      unique: true
    },
    {
      fields: ['is_active']
    }
  ]
});

// Instance methods
ApiKey.prototype.generateKey = function() {
  const key = `wg_${crypto.randomBytes(32).toString('hex')}`;
  // Store the full key as base64 in key_hash for easy retrieval
  this.key_hash = Buffer.from(key).toString('base64');
  this.key_prefix = key.substring(0, 8);
  return key;
};

ApiKey.prototype.isExpired = function() {
  if (!this.expires_at) return false;
  return new Date() > this.expires_at;
};

ApiKey.prototype.canAccess = function(permission) {
  return this.permissions[permission] === true;
};

ApiKey.prototype.isIpAllowed = function(ip) {
  if (!this.ip_whitelist || this.ip_whitelist.length === 0) return true;
  return this.ip_whitelist.includes(ip);
};

// Method to get the full API key by decoding the stored key_hash
ApiKey.prototype.getFullKey = function() {
  try {
    return Buffer.from(this.key_hash, 'base64').toString('utf8');
  } catch (error) {
    return null;
  }
};

// Method to verify API key (for authentication)
ApiKey.prototype.verifyKey = function(inputKey) {
  try {
    const storedKey = this.getFullKey();
    return storedKey === inputKey;
  } catch (error) {
    return false;
  }
};


// Static methods
ApiKey.findByKey = async function(key) {
  // Find by comparing with decoded key_hash values
  const apiKeys = await this.findAll({
    where: { is_active: true }
  });
  
  for (const apiKey of apiKeys) {
    if (apiKey.verifyKey(key)) {
      return apiKey;
    }
  }
  
  return null;
};

ApiKey.generateNewKey = function(userId, name, permissions = {}) {
  const apiKey = this.build({
    user_id: userId,
    name: name,
    permissions: {
      read: true,
      write: true,
      admin: false,
      ...permissions
    }
  });
  
  const key = apiKey.generateKey();
  return { apiKey, key };
};

module.exports = ApiKey; 