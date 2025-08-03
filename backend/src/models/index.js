const { sequelize } = require('../config/database');

// Import models
const User = require('./User');
const Device = require('./Device');
const Message = require('./Message');
const Contact = require('./Contact');

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

// Export models
module.exports = {
  sequelize,
  User,
  Device,
  Message,
  Contact
}; 