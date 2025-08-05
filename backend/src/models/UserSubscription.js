const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserSubscription = sequelize.define('UserSubscription', {
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
  plan_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'subscription_plans',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired', 'past_due', 'trialing'),
    defaultValue: 'active',
    comment: 'Subscription status'
  },
  current_period_start: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Start of current billing period'
  },
  current_period_end: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'End of current billing period'
  },
  trial_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Start of trial period'
  },
  trial_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'End of trial period'
  },
  cancel_at_period_end: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Cancel at end of current period'
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When subscription was cancelled'
  },
  payment_method_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment method ID from payment provider'
  },
  external_subscription_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'External subscription ID from payment provider'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional subscription metadata'
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
  tableName: 'user_subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['plan_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['external_subscription_id']
    },
    {
      fields: ['current_period_end']
    }
  ]
});

// Instance methods
UserSubscription.prototype.isActive = function() {
  return this.status === 'active' || this.status === 'trialing';
};

UserSubscription.prototype.isTrialing = function() {
  return this.status === 'trialing';
};

UserSubscription.prototype.isExpired = function() {
  return this.status === 'expired' || this.status === 'past_due';
};

UserSubscription.prototype.isCancelled = function() {
  return this.status === 'cancelled' || this.cancel_at_period_end;
};

UserSubscription.prototype.getDaysUntilExpiry = function() {
  const now = new Date();
  const end = new Date(this.current_period_end);
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

UserSubscription.prototype.getTrialDaysRemaining = function() {
  if (!this.trial_end) return 0;
  
  const now = new Date();
  const trialEnd = new Date(this.trial_end);
  const diffTime = trialEnd - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Static methods
UserSubscription.getActiveSubscription = async function(userId) {
  return await this.findOne({
    where: { 
      user_id: userId,
      status: ['active', 'trialing']
    },
    order: [['created_at', 'DESC']]
  });
};

UserSubscription.getExpiringSubscriptions = async function(days = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  
  return await this.findAll({
    where: {
      status: ['active', 'trialing'],
      current_period_end: {
        [require('sequelize').Op.lte]: expiryDate
      }
    }
  });
};

module.exports = UserSubscription; 