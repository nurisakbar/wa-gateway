const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

/**
 * User Model
 * Handles user authentication and profile management
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  full_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: /^(\+62|62|0)8[1-9][0-9]{6,9}$/
    }
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'manager', 'operator', 'viewer'),
    defaultValue: 'operator',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'suspended', 'banned'),
    defaultValue: 'pending',
    allowNull: false
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  phone_verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_login_ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  two_factor_secret: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  remember_token: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['username']
    },
    {
      fields: ['status']
    },
    {
      fields: ['role']
    }
  ],
  hooks: {
    // Hash password before saving
    beforeCreate: async (user) => {
      if (user.password) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
      }
    }
  }
});

/**
 * Instance methods
 */
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isEmailVerified = function() {
  return this.email_verified_at !== null;
};

User.prototype.isPhoneVerified = function() {
  return this.phone_verified_at !== null;
};

User.prototype.isActive = function() {
  return this.status === 'active';
};

User.prototype.isLocked = function() {
  if (!this.locked_until) return false;
  return new Date() < this.locked_until;
};

User.prototype.canLogin = function() {
  return this.isActive() && !this.isLocked();
};

User.prototype.hasRole = function(role) {
  const roleHierarchy = {
    'super_admin': 5,
    'admin': 4,
    'manager': 3,
    'operator': 2,
    'viewer': 1
  };
  
  const userLevel = roleHierarchy[this.role] || 0;
  const requiredLevel = roleHierarchy[role] || 0;
  
  return userLevel >= requiredLevel;
};

User.prototype.incrementLoginAttempts = async function() {
  this.login_attempts += 1;
  
  // Lock account after 5 failed attempts for 15 minutes
  if (this.login_attempts >= 5) {
    this.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  }
  
  await this.save();
};

User.prototype.resetLoginAttempts = async function() {
  this.login_attempts = 0;
  this.locked_until = null;
  await this.save();
};

User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.two_factor_secret;
  delete values.remember_token;
  return values;
};

/**
 * Class methods
 */
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findByUsername = function(username) {
  return this.findOne({ where: { username } });
};

User.findActiveByEmail = function(email) {
  return this.findOne({ 
    where: { 
      email,
      status: 'active'
    } 
  });
};

User.createUser = async function(userData) {
  const user = await this.create(userData);
  return user.toJSON();
};

User.updateLastLogin = async function(userId, ipAddress) {
  return this.update(
    {
      last_login_at: new Date(),
      last_login_ip: ipAddress
    },
    {
      where: { id: userId }
    }
  );
};

/**
 * Associations (will be defined when other models are created)
 */
// User.hasMany(Device, { foreignKey: 'user_id', as: 'devices' });
// User.hasMany(Message, { foreignKey: 'user_id', as: 'messages' });
// User.hasMany(Contact, { foreignKey: 'user_id', as: 'contacts' });
// User.hasMany(File, { foreignKey: 'user_id', as: 'files' });
// User.hasMany(Webhook, { foreignKey: 'user_id', as: 'webhooks' });

module.exports = User; 