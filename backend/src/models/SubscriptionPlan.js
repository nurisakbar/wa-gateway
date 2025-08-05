const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Plan name (e.g., Basic, Pro, Enterprise)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Plan description'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Monthly price in USD'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    comment: 'Currency code'
  },
  billing_cycle: {
    type: DataTypes.ENUM('monthly', 'yearly'),
    defaultValue: 'monthly',
    comment: 'Billing cycle'
  },
  features: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Plan features and limits'
  },
  limits: {
    type: DataTypes.JSON,
    defaultValue: {
      messages_per_month: 1000,
      api_requests_per_month: 10000,
      devices: 1,
      webhooks: 5,
      storage_gb: 1,
      support_level: 'email'
    },
    comment: 'Usage limits for this plan'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether this plan is available for subscription'
  },
  is_popular: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Mark as popular plan'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Display order'
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
  tableName: 'subscription_plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['name'],
      unique: true
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['sort_order']
    }
  ]
});

// Instance methods
SubscriptionPlan.prototype.getFeature = function(featureName) {
  return this.features[featureName] || null;
};

SubscriptionPlan.prototype.getLimit = function(limitName) {
  return this.limits[limitName] || 0;
};

SubscriptionPlan.prototype.hasFeature = function(featureName) {
  return this.features[featureName] === true;
};

// Static methods
SubscriptionPlan.getActivePlans = async function() {
  return await this.findAll({
    where: { is_active: true },
    order: [['sort_order', 'ASC'], ['price', 'ASC']]
  });
};

SubscriptionPlan.getPopularPlans = async function() {
  return await this.findAll({
    where: { is_active: true, is_popular: true },
    order: [['sort_order', 'ASC']]
  });
};

module.exports = SubscriptionPlan; 