const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Device = require('./Device');
const Message = require('./Message');
const Contact = require('./Contact');
const Template = require('./Template');
const ApiKey = require('./ApiKey');
const ApiUsage = require('./ApiUsage');
const Webhook = require('./Webhook');
const SubscriptionPlan = require('./SubscriptionPlan');
const UserSubscription = require('./UserSubscription');
const Invoice = require('./Invoice');
const Broadcast = require('./Broadcast');

// Define associations
User.hasMany(Device, { 
  foreignKey: 'user_id', 
  as: 'devices',
  onDelete: 'CASCADE'
});

Device.belongsTo(User, { 
  foreignKey: 'user_id', 
  as: 'user'
});

User.hasMany(Message, {
  foreignKey: 'user_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Device.hasMany(Message, {
  foreignKey: 'device_id',
  as: 'messages',
  onDelete: 'CASCADE'
});

Message.belongsTo(Device, {
  foreignKey: 'device_id',
  as: 'device'
});

User.hasMany(Contact, {
  foreignKey: 'user_id',
  as: 'contacts',
  onDelete: 'CASCADE'
});

Contact.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(Template, {
  foreignKey: 'user_id',
  as: 'templates',
  onDelete: 'CASCADE'
});

Template.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// API Key associations
User.hasMany(ApiKey, {
  foreignKey: 'user_id',
  as: 'apiKeys',
  onDelete: 'CASCADE'
});

ApiKey.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Bind API keys optionally to a specific device
Device.hasMany(ApiKey, {
  foreignKey: 'device_id',
  as: 'apiKeys'
});

ApiKey.belongsTo(Device, {
  foreignKey: 'device_id',
  as: 'device'
});

// API Usage associations
ApiKey.hasMany(ApiUsage, {
  foreignKey: 'api_key_id',
  as: 'usage',
  onDelete: 'CASCADE'
});

ApiUsage.belongsTo(ApiKey, {
  foreignKey: 'api_key_id',
  as: 'apiKey'
});

User.hasMany(ApiUsage, {
  foreignKey: 'user_id',
  as: 'apiUsage',
  onDelete: 'CASCADE'
});

ApiUsage.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Webhook associations
User.hasMany(Webhook, {
  foreignKey: 'user_id',
  as: 'webhooks',
  onDelete: 'CASCADE'
});

Webhook.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Subscription associations
User.hasMany(UserSubscription, {
  foreignKey: 'user_id',
  as: 'subscriptions',
  onDelete: 'CASCADE'
});

UserSubscription.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

UserSubscription.belongsTo(SubscriptionPlan, {
  foreignKey: 'plan_id',
  as: 'plan'
});

SubscriptionPlan.hasMany(UserSubscription, {
  foreignKey: 'plan_id',
  as: 'userSubscriptions'
});

// Invoice associations
User.hasMany(Invoice, {
  foreignKey: 'user_id',
  as: 'invoices',
  onDelete: 'CASCADE'
});

Invoice.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Invoice.belongsTo(UserSubscription, {
  foreignKey: 'subscription_id',
  as: 'subscription'
});

UserSubscription.hasMany(Invoice, {
  foreignKey: 'subscription_id',
  as: 'invoices'
});

// Export models
// Broadcast associations
User.hasMany(Broadcast, {
  foreignKey: 'user_id',
  as: 'broadcasts',
  onDelete: 'CASCADE'
});

Broadcast.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Device.hasMany(Broadcast, {
  foreignKey: 'device_id',
  as: 'broadcasts',
  onDelete: 'CASCADE'
});

Broadcast.belongsTo(Device, {
  foreignKey: 'device_id',
  as: 'device'
});

module.exports = {
  sequelize,
  User,
  Device,
  Message,
  Contact,
  Template,
  ApiKey,
  ApiUsage,
  Webhook,
  SubscriptionPlan,
  UserSubscription,
  Invoice,
  Broadcast
}; 