const { SubscriptionPlan } = require('../models');

const subscriptionPlans = [
  // Text Only Plans
  {
    name: 'Free',
    description: 'Perfect for getting started with basic messaging',
    price: 0,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: 1000,
      api_requests_per_month: 500,
      devices: 1,
      webhooks: 1,
      storage_gb: 1,
      support_level: 'community'
    },
    limits: {
      messages_per_month: 1000,
      api_requests_per_month: 500,
      devices: 1,
      webhooks: 1,
      storage_gb: 1,
      support_level: 'community'
    },
    is_active: true,
    is_popular: false,
    sort_order: 1
  },
  {
    name: 'Lite',
    description: 'Great for small businesses',
    price: 25000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: 1000,
      api_requests_per_month: 1000,
      devices: 1,
      webhooks: 2,
      storage_gb: 2,
      support_level: 'email'
    },
    limits: {
      messages_per_month: 1000,
      api_requests_per_month: 1000,
      devices: 1,
      webhooks: 2,
      storage_gb: 2,
      support_level: 'email'
    },
    is_active: true,
    is_popular: false,
    sort_order: 2
  },
  {
    name: 'Regular',
    description: 'Perfect for growing businesses',
    price: 66000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: 10000,
      api_requests_per_month: 5000,
      devices: 2,
      webhooks: 5,
      storage_gb: 5,
      support_level: 'priority'
    },
    limits: {
      messages_per_month: 10000,
      api_requests_per_month: 5000,
      devices: 2,
      webhooks: 5,
      storage_gb: 5,
      support_level: 'priority'
    },
    is_active: true,
    is_popular: true,
    sort_order: 3
  },
  {
    name: 'Regular Pro',
    description: 'Advanced features for professional use',
    price: 110000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: 25000,
      api_requests_per_month: 10000,
      devices: 3,
      webhooks: 10,
      storage_gb: 10,
      support_level: 'priority'
    },
    limits: {
      messages_per_month: 25000,
      api_requests_per_month: 10000,
      devices: 3,
      webhooks: 10,
      storage_gb: 10,
      support_level: 'priority'
    },
    is_active: true,
    is_popular: false,
    sort_order: 4
  },
  {
    name: 'Master',
    description: 'Unlimited messaging for enterprise',
    price: 175000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: -1, // -1 means unlimited
      api_requests_per_month: -1,
      devices: 5,
      webhooks: 20,
      storage_gb: 50,
      support_level: 'dedicated'
    },
    limits: {
      messages_per_month: -1,
      api_requests_per_month: -1,
      devices: 5,
      webhooks: 20,
      storage_gb: 50,
      support_level: 'dedicated'
    },
    is_active: true,
    is_popular: false,
    sort_order: 5
  },
  // All Feature Plans
  {
    name: 'Super',
    description: 'All features with attachment support',
    price: 165000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: 10000,
      api_requests_per_month: 5000,
      devices: 2,
      webhooks: 5,
      storage_gb: 10,
      support_level: 'priority',
      attachments: true,
      autoreply: true,
      autoreply_spreadsheet: true,
      remove_watermark: true
    },
    limits: {
      messages_per_month: 10000,
      api_requests_per_month: 5000,
      devices: 2,
      webhooks: 5,
      storage_gb: 10,
      support_level: 'priority',
      attachments: true,
      autoreply: true,
      autoreply_spreadsheet: true,
      remove_watermark: true
    },
    is_active: true,
    is_popular: false,
    sort_order: 6
  },
  {
    name: 'Advanced',
    description: 'Enhanced features for advanced users',
    price: 255000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: 25000,
      api_requests_per_month: 10000,
      devices: 3,
      webhooks: 10,
      storage_gb: 20,
      support_level: 'priority',
      attachments: true,
      autoreply: true,
      autoreply_spreadsheet: true,
      remove_watermark: true,
      device_notifications: true
    },
    limits: {
      messages_per_month: 25000,
      api_requests_per_month: 10000,
      devices: 3,
      webhooks: 10,
      storage_gb: 20,
      support_level: 'priority',
      attachments: true,
      autoreply: true,
      autoreply_spreadsheet: true,
      remove_watermark: true,
      device_notifications: true
    },
    is_active: true,
    is_popular: false,
    sort_order: 7
  },
  {
    name: 'Ultra',
    description: 'Ultimate plan with unlimited everything',
    price: 355000,
    currency: 'IDR',
    billing_cycle: 'monthly',
    features: {
      messages_per_month: -1,
      api_requests_per_month: -1,
      devices: 10,
      webhooks: 50,
      storage_gb: 100,
      support_level: 'dedicated',
      attachments: true,
      autoreply: true,
      autoreply_spreadsheet: true,
      remove_watermark: true,
      device_notifications: true
    },
    limits: {
      messages_per_month: -1,
      api_requests_per_month: -1,
      devices: 10,
      webhooks: 50,
      storage_gb: 100,
      support_level: 'dedicated',
      attachments: true,
      autoreply: true,
      autoreply_spreadsheet: true,
      remove_watermark: true,
      device_notifications: true
    },
    is_active: true,
    is_popular: false,
    sort_order: 8
  }
];

const seedSubscriptionPlans = async () => {
  try {
    console.log('🌱 Seeding subscription plans...');
    
    for (const planData of subscriptionPlans) {
      const [plan, created] = await SubscriptionPlan.findOrCreate({
        where: { name: planData.name },
        defaults: planData
      });
      
      if (created) {
        console.log(`✅ Created plan: ${plan.name}`);
      } else {
        console.log(`⚠️  Plan already exists: ${plan.name}`);
      }
    }
    
    console.log('✅ Subscription plans seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  }
};

module.exports = { seedSubscriptionPlans };
