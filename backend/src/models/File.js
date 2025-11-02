const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const File = sequelize.define('File', {
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
    },
    comment: 'Owner of the file'
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original filename'
  },
  filepath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'File path relative to upload directory'
  },
  file_type: {
    type: DataTypes.ENUM('image', 'video', 'audio', 'document', 'other'),
    allowNull: false,
    defaultValue: 'other',
    comment: 'File type category'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME type of the file'
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false,
    defaultValue: 0,
    comment: 'File size in bytes'
  },
  whatsapp_compatible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'Whether file is compatible with WhatsApp'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
    comment: 'Additional file metadata'
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
  tableName: 'files',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['file_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'created_at']
    }
  ]
});

// Instance methods
File.prototype.getSizeFormatted = function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

File.prototype.isImage = function() {
  return this.file_type === 'image';
};

File.prototype.isVideo = function() {
  return this.file_type === 'video';
};

File.prototype.isAudio = function() {
  return this.file_type === 'audio';
};

File.prototype.isDocument = function() {
  return this.file_type === 'document';
};

// Static methods
File.findByUserId = function(userId, options = {}) {
  const { limit = 50, offset = 0, file_type } = options;
  
  const where = { user_id: userId };
  if (file_type) where.file_type = file_type;
  
  return this.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']]
  });
};

File.getStatsByUserId = function(userId) {
  return this.findAll({
    where: { user_id: userId },
    attributes: [
      'file_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('size')), 'total_size']
    ],
    group: ['file_type']
  });
};

module.exports = File;

