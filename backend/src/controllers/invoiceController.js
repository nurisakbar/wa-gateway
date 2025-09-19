const { Invoice, UserSubscription, User, SubscriptionPlan } = require('../models');
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
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan'
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
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan'
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
      status: 'pending',
      amount: amount,
      currency: 'USD',
      subtotal: amount,
      tax: 0,
      discount: 0,
      total: amount,
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
      paid_at: new Date()
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
          as: 'user'
        },
        {
          model: UserSubscription,
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan'
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

// Confirm payment by user (no longer requires uploading proof in app)
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_proof, transfer_amount, transfer_date, bank_name, notes } = req.body || {};
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

    if (invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not in pending status'
      });
    }

    // Update invoice with payment confirmation
    // Fields are optional; users now confirm via WhatsApp and app marks invoice for admin review
    const parsedAmount = typeof transfer_amount !== 'undefined' && transfer_amount !== null && transfer_amount !== ''
      ? parseFloat(transfer_amount)
      : undefined;
    const parsedDate = transfer_date ? new Date(transfer_date) : undefined;

    await invoice.update({
      status: 'payment_confirmed',
      payment_confirmation: {
        payment_proof: payment_proof || null,
        transfer_amount: parsedAmount,
        transfer_date: parsedDate,
        bank_name: bank_name || null,
        notes: notes || null,
        confirmed_at: new Date(),
        confirmed_by_user: userId
      }
    });

    logInfo(`Payment confirmation submitted for invoice ${invoice.invoice_number} by user ${userId}`, 'Payment Confirmation');

    res.json({
      success: true,
      message: 'Konfirmasi penerimaan transfer dicatat. Admin akan memeriksa dan mengaktifkan langganan Anda.',
      data: invoice
    });

  } catch (error) {
    logError(error, 'Confirm Payment Error');
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Get all pending payment confirmations (including pending invoices)
const getPendingPaymentConfirmations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // If status provided, filter by it; otherwise return all statuses for admin
    const whereClause = status ? { status } : {};

    const invoices = await Invoice.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'full_name', 'phone']
        },
        {
          model: UserSubscription,
          as: 'subscription',
          include: [
            {
              model: SubscriptionPlan,
              as: 'plan'
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
    logError(error, 'Get Pending Payment Confirmations Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get pending payment confirmations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Approve payment confirmation
const approvePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id },
      include: [
        {
          model: UserSubscription,
          as: 'subscription'
        }
      ]
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'payment_confirmed' && invoice.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not in a confirmable status'
      });
    }

    // Update invoice status to paid
    await invoice.update({
      status: 'paid',
      paid_at: new Date(),
      admin_confirmed_at: new Date(),
      admin_confirmed_by: adminId
    });

    // Activate the subscription
    if (invoice.subscription) {
      await invoice.subscription.update({
        status: 'active'
      });
    }

    logInfo(`Payment approved for invoice ${invoice.invoice_number} by admin ${adminId}`, 'Payment Approved');

    res.json({
      success: true,
      message: 'Payment approved successfully. Subscription has been activated.',
      data: invoice
    });

  } catch (error) {
    logError(error, 'Approve Payment Error');
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Reject payment confirmation
const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const invoice = await Invoice.findOne({
      where: { id }
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    if (invoice.status !== 'payment_confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Invoice is not in payment_confirmed status'
      });
    }

    // Update invoice status back to pending
    await invoice.update({
      status: 'pending',
      payment_confirmation: {
        ...invoice.payment_confirmation,
        rejected_at: new Date(),
        rejected_by: adminId,
        rejection_reason: reason
      }
    });

    logInfo(`Payment rejected for invoice ${invoice.invoice_number} by admin ${adminId}. Reason: ${reason}`, 'Payment Rejected');

    res.json({
      success: true,
      message: 'Payment rejected successfully.',
      data: invoice
    });

  } catch (error) {
    logError(error, 'Reject Payment Error');
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment',
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
  getInvoiceStats,
  confirmPayment,
  getPendingPaymentConfirmations,
  approvePayment,
  rejectPayment
}; 