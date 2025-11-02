const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invoice = sequelize.define('Invoice', {
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
  subscription_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'user_subscriptions',
      key: 'id'
    }
  },
  invoice_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Human readable invoice number'
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending', 'payment_confirmed', 'paid', 'failed', 'cancelled'),
    defaultValue: 'draft',
    comment: 'Invoice status'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Total amount in cents'
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'USD',
    comment: 'Currency code'
  },
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Subtotal before tax'
  },
  tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Tax amount'
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: 'Discount amount'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Total amount after tax and discount'
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Due date for payment'
  },
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When invoice was paid'
  },
  payment_confirmation: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Payment confirmation details from user'
  },
  admin_confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When admin confirmed the payment'
  },
  admin_confirmed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'Admin user who confirmed the payment'
  },
  external_invoice_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'External invoice ID from payment provider'
  },
  payment_method: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Payment method used'
  },
  items: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Invoice line items'
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Additional invoice metadata'
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
  tableName: 'invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['subscription_id']
    },
    {
      fields: ['invoice_number'],
      unique: true
    },
    {
      fields: ['status']
    },
    {
      fields: ['due_date']
    },
    {
      fields: ['external_invoice_id']
    }
  ]
});

// Instance methods
Invoice.prototype.isPaid = function() {
  return this.status === 'paid';
};

Invoice.prototype.isPaymentConfirmed = function() {
  return this.status === 'payment_confirmed';
};

Invoice.prototype.isPendingPayment = function() {
  return this.status === 'pending';
};

Invoice.prototype.isOverdue = function() {
  if (this.isPaid()) return false;
  return new Date() > new Date(this.due_date);
};

Invoice.prototype.getDaysOverdue = function() {
  if (!this.isOverdue()) return 0;
  
  const now = new Date();
  const dueDate = new Date(this.due_date);
  const diffTime = now - dueDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

Invoice.prototype.getTotalAmount = function() {
  return parseFloat(this.subtotal) + parseFloat(this.tax) - parseFloat(this.discount);
};

// Static methods
Invoice.generateInvoiceNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  
  // Get count of invoices for this month
  const startOfMonth = new Date(year, date.getMonth(), 1);
  const endOfMonth = new Date(year, date.getMonth() + 1, 0);
  
  const count = await this.count({
    where: {
      created_at: {
        [require('sequelize').Op.between]: [startOfMonth, endOfMonth]
      }
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

Invoice.getOverdueInvoices = async function() {
  return await this.findAll({
    where: {
      status: ['draft', 'open'],
      due_date: {
        [require('sequelize').Op.lt]: new Date()
      }
    }
  });
};

Invoice.getUserInvoices = async function(userId, limit = 10) {
  return await this.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: limit
  });
};

module.exports = Invoice; 