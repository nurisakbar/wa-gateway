const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      is: /^(\+62|62|0)8[1-9][0-9]{6,9}$/
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  organization: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: [0, 100]
    }
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Contact avatar/profile picture URL'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes about the contact'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array of tags for categorizing contacts'
  },
  is_favorite: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  is_blocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  last_contact: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this contact was messaged or messaged us'
  },
  message_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of messages exchanged with this contact'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional contact metadata'
  }
}, {
  tableName: 'contacts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['phone'] },
    { fields: ['name'] },
    { fields: ['email'] },
    { fields: ['is_favorite'] },
    { fields: ['is_blocked'] },
    { fields: ['last_contact'] },
    { fields: ['user_id', 'phone'] },
    { fields: ['user_id', 'name'] }
  ]
});

// Instance methods
Contact.prototype.isFavorite = function() {
  return this.is_favorite === true;
};

Contact.prototype.isBlocked = function() {
  return this.is_blocked === true;
};

Contact.prototype.hasEmail = function() {
  return this.email && this.email.length > 0;
};

Contact.prototype.hasOrganization = function() {
  return this.organization && this.organization.length > 0;
};

Contact.prototype.getDisplayName = function() {
  return this.name || this.phone;
};

Contact.prototype.addTag = async function(tag) {
  if (!this.tags) {
    this.tags = [];
  }
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
};

Contact.prototype.removeTag = async function(tag) {
  if (this.tags && this.tags.includes(tag)) {
    this.tags = this.tags.filter(t => t !== tag);
    await this.save();
  }
};

Contact.prototype.toggleFavorite = async function() {
  this.is_favorite = !this.is_favorite;
  await this.save();
  return this.is_favorite;
};

Contact.prototype.toggleBlocked = async function() {
  this.is_blocked = !this.is_blocked;
  await this.save();
  return this.is_blocked;
};

Contact.prototype.updateLastContact = async function() {
  this.last_contact = new Date();
  await this.save();
};

Contact.prototype.incrementMessageCount = async function() {
  this.message_count += 1;
  await this.save();
};

// Class methods
Contact.findByPhone = function(phone, userId) {
  return this.findOne({
    where: { phone, user_id: userId }
  });
};

Contact.findByUserId = function(userId, options = {}) {
  return this.findAll({
    where: { user_id: userId },
    order: [['name', 'ASC']],
    ...options
  });
};

Contact.findFavorites = function(userId) {
  return this.findAll({
    where: { user_id: userId, is_favorite: true },
    order: [['name', 'ASC']]
  });
};

Contact.findBlocked = function(userId) {
  return this.findAll({
    where: { user_id: userId, is_blocked: true },
    order: [['name', 'ASC']]
  });
};

Contact.search = function(userId, query, options = {}) {
  const { limit = 20, offset = 0 } = options;
  
  return this.findAll({
    where: {
      user_id: userId,
      [require('sequelize').Op.or]: [
        { name: { [require('sequelize').Op.like]: `%${query}%` } },
        { phone: { [require('sequelize').Op.like]: `%${query}%` } },
        { email: { [require('sequelize').Op.like]: `%${query}%` } },
        { organization: { [require('sequelize').Op.like]: `%${query}%` } }
      ]
    },
    order: [['name', 'ASC']],
    limit,
    offset
  });
};

Contact.findByTag = function(userId, tag) {
  return this.findAll({
    where: {
      user_id: userId,
      tags: { [require('sequelize').Op.contains]: [tag] }
    },
    order: [['name', 'ASC']]
  });
};

Contact.getStats = async function(userId) {
  const total = await this.count({ where: { user_id: userId } });
  const favorites = await this.count({ where: { user_id: userId, is_favorite: true } });
  const blocked = await this.count({ where: { user_id: userId, is_blocked: true } });
  const withEmail = await this.count({ 
    where: { 
      user_id: userId, 
      email: { [require('sequelize').Op.ne]: null } 
    } 
  });

  return {
    total,
    favorites,
    blocked,
    with_email: withEmail,
    without_email: total - withEmail
  };
};

Contact.createContact = async function(contactData) {
  return await this.create(contactData);
};

Contact.updateOrCreate = async function(userId, phone, contactData) {
  const [contact, created] = await this.findOrCreate({
    where: { user_id: userId, phone },
    defaults: contactData
  });

  if (!created) {
    await contact.update(contactData);
  }

  return contact;
};

module.exports = Contact; 