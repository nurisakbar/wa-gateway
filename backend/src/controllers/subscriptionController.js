const { SubscriptionPlan, UserSubscription, User } = require('../models');
const { logError, logInfo } = require('../utils/logger');

// Get all subscription plans
const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['price', 'ASC']]
    });

    res.json({
      success: true,
      data: plans
    });

  } catch (error) {
    logError(error, 'Get Subscription Plans Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get subscription plan by ID
const getSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });

  } catch (error) {
    logError(error, 'Get Subscription Plan Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create subscription plan (Admin only)
const createSubscriptionPlan = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency = 'USD',
      billing_cycle = 'monthly',
      features,
      limits,
      is_popular = false,
      sort_order = 0
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Check if plan name already exists
    const existingPlan = await SubscriptionPlan.findOne({
      where: { name }
    });

    if (existingPlan) {
      return res.status(400).json({
        success: false,
        message: 'Subscription plan with this name already exists'
      });
    }

    const plan = await SubscriptionPlan.create({
      name,
      description,
      price,
      currency,
      billing_cycle,
      features: features || {},
      limits: limits || {
        messages_per_month: 1000,
        api_requests_per_month: 10000,
        devices: 1,
        webhooks: 5,
        storage_gb: 1,
        support_level: 'email'
      },
      is_popular,
      sort_order
    });

    logInfo(`Subscription plan created: ${plan.name}`, 'Subscription Plan Created');

    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: plan
    });

  } catch (error) {
    logError(error, 'Create Subscription Plan Error');
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update subscription plan (Admin only)
const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const plan = await SubscriptionPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if name is being updated and if it conflicts
    if (updateData.name && updateData.name !== plan.name) {
      const existingPlan = await SubscriptionPlan.findOne({
        where: { name: updateData.name }
      });

      if (existingPlan) {
        return res.status(400).json({
          success: false,
          message: 'Subscription plan with this name already exists'
        });
      }
    }

    await plan.update(updateData);

    logInfo(`Subscription plan updated: ${plan.name}`, 'Subscription Plan Updated');

    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: plan
    });

  } catch (error) {
    logError(error, 'Update Subscription Plan Error');
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete subscription plan (Admin only)
const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    // Check if plan has active subscriptions
    const activeSubscriptions = await UserSubscription.count({
      where: { plan_id: id, status: 'active' }
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan with ${activeSubscriptions} active subscriptions`
      });
    }

    await plan.destroy();

    logInfo(`Subscription plan deleted: ${plan.name}`, 'Subscription Plan Deleted');

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });

  } catch (error) {
    logError(error, 'Delete Subscription Plan Error');
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's current subscription
const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' },
      include: [
        {
          model: SubscriptionPlan,
          as: 'SubscriptionPlan'
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    logError(error, 'Get User Subscription Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get user subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Subscribe to a plan
const subscribeToPlan = async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_id, payment_method_id } = req.body;

    // Validate plan exists
    const plan = await SubscriptionPlan.findByPk(plan_id);
    if (!plan || !plan.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found or inactive'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Calculate subscription dates
    const now = new Date();
    const currentPeriodStart = now;
    let currentPeriodEnd;

    if (plan.billing_cycle === 'monthly') {
      currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    } else if (plan.billing_cycle === 'yearly') {
      currentPeriodEnd = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    }

    // Create subscription
    const subscription = await UserSubscription.create({
      user_id: userId,
      plan_id: plan_id,
      status: 'active',
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      payment_method_id: payment_method_id || null,
      metadata: {
        subscribed_at: now.toISOString(),
        plan_name: plan.name,
        plan_price: plan.price,
        plan_currency: plan.currency
      }
    });

    logInfo(`User ${userId} subscribed to plan: ${plan.name}`, 'User Subscription Created');

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to plan',
      data: subscription
    });

  } catch (error) {
    logError(error, 'Subscribe to Plan Error');
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cancel_at_period_end = true } = req.body;

    const subscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    if (cancel_at_period_end) {
      // Cancel at period end
      await subscription.update({
        cancel_at_period_end: true,
        cancelled_at: new Date()
      });

      logInfo(`User ${userId} cancelled subscription at period end`, 'Subscription Cancelled');
    } else {
      // Cancel immediately
      await subscription.update({
        status: 'cancelled',
        cancelled_at: new Date()
      });

      logInfo(`User ${userId} cancelled subscription immediately`, 'Subscription Cancelled');
    }

    res.json({
      success: true,
      message: cancel_at_period_end 
        ? 'Subscription will be cancelled at the end of current period'
        : 'Subscription cancelled immediately'
    });

  } catch (error) {
    logError(error, 'Cancel Subscription Error');
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get subscription usage
const getSubscriptionUsage = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscription = await UserSubscription.findOne({
      where: { user_id: userId, status: 'active' },
      include: [
        {
          model: SubscriptionPlan,
          as: 'SubscriptionPlan'
        }
      ]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Get current usage (this would be implemented based on your tracking system)
    const currentUsage = {
      messages_used: 0, // Get from ApiUsage table
      api_requests_used: 0, // Get from ApiUsage table
      devices_used: 0, // Get from Device table
      webhooks_used: 0, // Get from Webhook table
      storage_used_gb: 0 // Get from file storage
    };

    const limits = subscription.SubscriptionPlan.limits;

    res.json({
      success: true,
      data: {
        subscription,
        usage: currentUsage,
        limits,
        remaining: {
          messages: Math.max(0, limits.messages_per_month - currentUsage.messages_used),
          api_requests: Math.max(0, limits.api_requests_per_month - currentUsage.api_requests_used),
          devices: Math.max(0, limits.devices - currentUsage.devices_used),
          webhooks: Math.max(0, limits.webhooks - currentUsage.webhooks_used),
          storage_gb: Math.max(0, limits.storage_gb - currentUsage.storage_used_gb)
        }
      }
    });

  } catch (error) {
    logError(error, 'Get Subscription Usage Error');
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription usage',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSubscriptionPlans,
  getSubscriptionPlan,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getUserSubscription,
  subscribeToPlan,
  cancelSubscription,
  getSubscriptionUsage
}; 