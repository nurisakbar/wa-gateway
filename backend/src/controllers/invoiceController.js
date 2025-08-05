const { Invoice, UserSubscription, User } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Get user's invoices
const getUserInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const whereClause = { user_id: userId };
    if (status) {
      whereClause.status = status;
    }

    const offset = (page - 1) * limit;

    const invoices = await Invoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: UserSubscription,
          as: 'UserSubscription',
          include: [
            {
              model: require('./subscriptionController').SubscriptionPlan,
              as: 'SubscriptionPlan'
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        invoices: invoices.rows,
        pagination: {
          total: invoices.count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(invoices.count / limit)
        }
      }
    });

  } catch (error) {
    logError(error, 'Get User Invoices Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get invoices',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get invoice by ID
const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: UserSubscription,
          as: 'UserSubscription',
          include: [
            {
              model: require('./subscriptionController').SubscriptionPlan,
              as: 'SubscriptionPlan'
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    res.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    logError(error, 'Get Invoice Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Generate invoice for subscription
const generateInvoice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subscription_id, amount, description } = req.body;

    // Validate subscription exists and belongs to user
    const subscription = await UserSubscription.findOne({
      where: { id: subscription_id, user_id: userId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate due date (30 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoice = await Invoice.create({
      user_id: userId,
      subscription_id: subscription_id,
      invoice_number: invoiceNumber,
      status: 'draft',
      amount: amount,
      currency: 'USD',
      subtotal: amount,
      tax: 0,
      discount: 0,
      due_date: dueDate,
      items: [
        {
          description: description || 'Subscription Payment',
          quantity: 1,
          unit_price: amount,
          total: amount
        }
      ],
      metadata: {
        generated_at: new Date().toISOString(),
        subscription_period_start: subscription.current_period_start,
        subscription_period_end: subscription.current_period_end
      }
    });

    logInfo(`Invoice generated for user ${userId}: ${invoiceNumber}`, 'Invoice Generated');

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });

  } catch (error) {
    logError(error, 'Generate Invoice Error');
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark invoice as paid
const markInvoiceAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, external_payment_id } = req.body;
    const userId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id, user_id: userId }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is already paid'
      });
    }

    await invoice.update({
      status: 'paid',
      paid_at: new Date(),
      payment_method: payment_method || 'manual',
      external_invoice_id: external_payment_id
    });

    logInfo(`Invoice ${invoice.invoice_number} marked as paid`, 'Invoice Paid');

    res.json({
      success: true,
      message: 'Invoice marked as paid successfully',
      data: invoice
    });

  } catch (error) {
    logError(error, 'Mark Invoice as Paid Error');
    res.status(500).json({
      success: false,
      message: 'Failed to mark invoice as paid',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Download invoice PDF (placeholder)
const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: User,
          as: 'User'
        },
        {
          model: UserSubscription,
          as: 'UserSubscription',
          include: [
            {
              model: require('./subscriptionController').SubscriptionPlan,
              as: 'SubscriptionPlan'
            }
          ]
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // This would generate a PDF in a real implementation
    // For now, return invoice data as JSON
    res.json({
      success: true,
      message: 'Invoice download functionality would be implemented here',
      data: {
        invoice_number: invoice.invoice_number,
        amount: invoice.amount,
        status: invoice.status,
        due_date: invoice.due_date,
        items: invoice.items
      }
    });

  } catch (error) {
    logError(error, 'Download Invoice Error');
    res.status(500).json({
      success: false,
      message: 'Failed to download invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get invoice statistics
const getInvoiceStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Invoice.findAll({
      where: { user_id: userId },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count'],
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total_amount']
      ],
      group: ['status']
    });

    const totalInvoices = await Invoice.count({
      where: { user_id: userId }
    });

    const totalPaid = await Invoice.sum('amount', {
      where: { user_id: userId, status: 'paid' }
    });

    const totalOutstanding = await Invoice.sum('amount', {
      where: { user_id: userId, status: 'open' }
    });

    res.json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        total_paid: totalPaid || 0,
        total_outstanding: totalOutstanding || 0,
        status_breakdown: stats
      }
    });

  } catch (error) {
    logError(error, 'Get Invoice Stats Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get invoice statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getUserInvoices,
  getInvoice,
  generateInvoice,
  markInvoiceAsPaid,
  downloadInvoice,
  getInvoiceStats
}; 