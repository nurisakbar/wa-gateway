const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Template = sequelize.define('Template', {
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
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  
  category: {
    type: DataTypes.ENUM('marketing', 'utility', 'authentication'),
    allowNull: false,
    defaultValue: 'utility'
  },
  
  language: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'en'
  },
  
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  variables: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'JSON array of variable names used in template'
  },
  
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'draft'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  usage_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  rejected_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  rejected_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'templates',
  timestamps: false,
  indexes: [
    {
      name: 'idx_templates_user_id',
      fields: ['user_id']
    },
    {
      name: 'idx_templates_status',
      fields: ['status']
    },
    {
      name: 'idx_templates_category',
      fields: ['category']
    },
    {
      name: 'idx_templates_language',
      fields: ['language']
    },
    {
      name: 'idx_templates_name_user',
      fields: ['name', 'user_id'],
      unique: true
    }
  ]
});

// Instance methods
Template.prototype.incrementUsage = function() {
  this.usage_count += 1;
  return this.save();
};

Template.prototype.approve = function(adminUserId) {
  this.status = 'approved';
  this.approved_by = adminUserId;
  this.approved_at = new Date();
  this.updated_at = new Date();
  return this.save();
};

Template.prototype.reject = function(adminUserId, reason = '') {
  this.status = 'rejected';
  this.rejected_by = adminUserId;
  this.rejected_at = new Date();
  this.rejection_reason = reason;
  this.updated_at = new Date();
  return this.save();
};

// Class methods
Template.findByUserAndName = function(userId, name) {
  return this.findOne({
    where: { user_id: userId, name: name }
  });
};

Template.findApprovedByUser = function(userId) {
  return this.findAll({
    where: { user_id: userId, status: 'approved' },
    order: [['name', 'ASC']]
  });
};

Template.findPendingApproval = function() {
  return this.findAll({
    where: { status: 'pending' },
    order: [['created_at', 'ASC']]
  });
};

module.exports = Template; 