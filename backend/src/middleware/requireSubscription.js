const { UserSubscription } = require('../models');
const { logError, logInfo } = require('../utils/logger');

/**
 * Middleware to require active subscription for protected routes
 * Skips check for admin users
 */
const requireSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Skip subscription check for admin users
    if (userRole === 'admin' || userRole === 'super_admin') {
      return next();
    }

    // Check if user has an active subscription
    const subscription = await UserSubscription.findOne({
      where: { 
        user_id: userId,
        status: ['active', 'trialing']
      }
    });

    if (!subscription) {
      logInfo(`User ${userId} attempted to access protected resource without subscription`);
      return res.status(403).json({
        success: false,
        message: 'Active subscription required to access this feature',
        error: 'SUBSCRIPTION_REQUIRED',
        data: {
          requires_subscription: true,
          redirect_to: '/subscriptions'
        }
      });
    }

    // Check if subscription is expired
    const now = new Date();
    if (subscription.current_period_end && new Date(subscription.current_period_end) < now) {
      logInfo(`User ${userId} subscription expired on ${subscription.current_period_end}`);
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue using this feature.',
        error: 'SUBSCRIPTION_EXPIRED',
        data: {
          requires_subscription: true,
          redirect_to: '/subscriptions'
        }
      });
    }

    // Add subscription info to request for use in controllers
    req.subscription = subscription;
    next();

  } catch (error) {
    logError(error, 'Require subscription middleware error');
    res.status(500).json({
      success: false,
      message: 'Error checking subscription status'
    });
  }
};

module.exports = {
  requireSubscription
};
