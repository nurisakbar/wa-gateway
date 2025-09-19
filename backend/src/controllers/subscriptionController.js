const { SubscriptionPlan, UserSubscription, User, Device, Message, ApiUsage } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Get all subscription plans
const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC']]
    });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    logError(error, 'Get subscription plans error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
};

// Get current user subscription
const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: ['pending', 'active', 'trialing']
      },
      include: [{
        model: SubscriptionPlan,
        as: 'plan'
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logError(error, 'Get current subscription error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch current subscription'
    });
  }
};

// Subscribe to a plan
const subscribeToPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Get the plan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: 'active'
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription. Use upgrade endpoint instead.'
      });
    }

    // Calculate billing dates
    const now = new Date();
    const currentPeriodStart = now;
    const currentPeriodEnd = new Date(now);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Create subscription with pending status for paid plans, active for free plans
    const subscription = await UserSubscription.create({
      user_id: userId,
      plan_id: plan.id,
      status: plan.price > 0 ? 'pending' : 'active',
      billing_cycle: billing_cycle,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      price: plan.price,
      currency: plan.currency
    });

    // Generate invoice for the subscription (only if not free plan)
    let invoice = null;
    if (plan.price > 0) {
      try {
        const Invoice = require('../models/Invoice');
        const invoiceNumber = await Invoice.generateInvoiceNumber();
        
        // Calculate due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const invoiceData = {
          user_id: userId,
          subscription_id: subscription.id,
          invoice_number: invoiceNumber,
          status: 'pending',
          amount: plan.price,
          currency: plan.currency,
          subtotal: plan.price,
          tax: 0,
          discount: 0,
          total: plan.price,
          due_date: dueDate,
          items: [
            {
              description: `${plan.name} Subscription - ${billing_cycle}`,
              quantity: 1,
              unit_price: plan.price,
              total: plan.price
            }
          ],
          metadata: {
            subscription_period_start: currentPeriodStart,
            subscription_period_end: currentPeriodEnd,
            plan_name: plan.name,
            billing_cycle: billing_cycle,
            payment_details: {
              bank_name: 'Bank Mandiri',
              account_name: 'WAHYU SAFRIZAL',
              account_number: '1320022890280',
              whatsapp_number: '+62 821‑2994‑8687',
            payment_instructions: 'Silakan transfer sesuai nominal tagihan ke rekening di atas. Setelah transfer, kirim pesan WhatsApp ke +62 821‑2994‑8687 dengan menyertakan nomor invoice. Admin akan memverifikasi pembayaran Anda.'
            }
          }
        };
        
        invoice = await Invoice.create(invoiceData);

        logInfo(`Invoice generated for subscription ${subscription.id}: ${invoiceNumber}`);
      } catch (invoiceError) {
        logError(invoiceError, 'Failed to generate invoice for subscription');
        // Don't fail the subscription creation if invoice generation fails
      }
    }

    logInfo(`User ${userId} subscribed to plan ${plan.name}`);

    res.json({
      success: true,
      message: plan.price > 0 
        ? 'Subscription dibuat. Silakan transfer dan konfirmasi via WhatsApp ke admin untuk aktivasi.'
        : 'Successfully subscribed to plan',
      data: {
        subscription,
        plan,
        invoice,
        payment_instructions: plan.price > 0 ? {
          whatsapp_number: '+62 821‑2994‑8687',
          message: 'Setelah transfer, konfirmasi pembayaran via WhatsApp dengan menyertakan nomor invoice.'
        } : null
      }
    });
  } catch (error) {
    logError(error, 'Subscribe to plan error');
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to plan'
    });
  }
};

// Upgrade subscription
const upgradePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id, billing_cycle = 'monthly' } = req.body;

    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID is required'
      });
    }

    // Get the plan
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Get current subscription
    const currentSubscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: 'active'
      }
    });

    if (!currentSubscription) {
      return res.status(400).json({
        success: false,
        message: 'No active subscription found. Use subscribe endpoint instead.'
      });
    }

    // Update subscription
    await currentSubscription.update({
      plan_id: plan.id,
      price: plan.price,
      currency: plan.currency,
      billing_cycle: billing_cycle
    });

    logInfo(`User ${userId} upgraded to plan ${plan.name}`);

    res.json({
      success: true,
      message: 'Successfully upgraded subscription',
      data: {
        subscription: currentSubscription,
        plan
      }
    });
  } catch (error) {
    logError(error, 'Upgrade plan error');
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade plan'
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cancel_at_period_end = true } = req.body;

    const subscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: 'active'
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    if (cancel_at_period_end) {
      await subscription.update({
        cancel_at_period_end: true
      });
    } else {
      await subscription.update({
        status: 'cancelled',
        cancelled_at: new Date()
      });
    }

    logInfo(`User ${userId} cancelled subscription`);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    logError(error, 'Cancel subscription error');
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};

// Get usage data
const getUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current subscription
    const subscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: ['pending', 'active', 'trialing']
      },
      include: [{
        model: SubscriptionPlan,
        as: 'plan'
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const plan = subscription.plan;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get usage for current month
    const [messageCount, deviceCount, apiUsageCount] = await Promise.all([
      Message.count({
        where: {
          user_id: userId,
          created_at: {
            [require('sequelize').Op.gte]: startOfMonth
          }
        }
      }),
      Device.count({
        where: { user_id: userId }
      }),
      ApiUsage.count({
        where: {
          user_id: userId,
          created_at: {
            [require('sequelize').Op.gte]: startOfMonth
          }
        }
      })
    ]);

    const usage = {
      messages_used: messageCount,
      devices_used: deviceCount,
      api_requests_used: apiUsageCount
    };

    const limits = {
      messages_per_month: plan.limits.messages_per_month,
      devices: plan.limits.devices,
      api_requests_per_month: plan.limits.api_requests_per_month
    };

    res.json({
      success: true,
      data: {
        usage,
        limits,
        subscription
      }
    });
  } catch (error) {
    logError(error, 'Get usage error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage data'
    });
  }
};

module.exports = {
  getPlans,
  getCurrentSubscription,
  subscribeToPlan,
  upgradePlan,
  cancelSubscription,
  getUsage
};