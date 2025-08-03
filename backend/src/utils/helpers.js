const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
const generateRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate UUID
 * @returns {string} UUID
 */
const generateUUID = () => {
  return uuidv4();
};

/**
 * Hash a string using SHA256
 * @param {string} data - Data to hash
 * @returns {string} Hashed string
 */
const hashString = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a secure token
 * @param {number} length - Length of the token
 * @returns {string} Secure token
 */
const generateSecureToken = (length = 64) => {
  return crypto.randomBytes(length).toString('base64url');
};

/**
 * Format phone number to international format
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
const formatPhoneNumber = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 0, replace with 62
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // If it doesn't start with country code, add 62
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number
 * @returns {boolean} Is valid phone number
 */
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
const getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get file type from mime type
 * @param {string} mimeType - MIME type
 * @returns {string} File type
 */
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('application/pdf')) return 'document';
  if (mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  return 'document';
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const random = generateRandomString(8);
  const extension = getFileExtension(originalName);
  return `${timestamp}_${random}.${extension}`;
};

/**
 * Format date to readable format
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 * @returns {string} Formatted date
 */
const formatDate = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
};

/**
 * Get time ago from date
 * @param {Date|string} date - Date to calculate
 * @returns {string} Time ago string
 */
const getTimeAgo = (date) => {
  return moment(date).fromNow();
};

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} Is today
 */
const isToday = (date) => {
  return moment(date).isSame(moment(), 'day');
};

/**
 * Check if date is yesterday
 * @param {Date|string} date - Date to check
 * @returns {boolean} Is yesterday
 */
const isYesterday = (date) => {
  return moment(date).isSame(moment().subtract(1, 'day'), 'day');
};

/**
 * Sanitize string (remove special characters)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
  return str.replace(/[^a-zA-Z0-9\s]/g, '').trim();
};

/**
 * Truncate string to specified length
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix to add
 * @returns {string} Truncated string
 */
const truncateString = (str, length = 100, suffix = '...') => {
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

/**
 * Convert string to slug
 * @param {string} str - String to convert
 * @returns {string} Slug
 */
const toSlug = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Generate pagination info
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {object} Pagination info
 */
const generatePagination = (page = 1, limit = 10, total = 0) => {
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    offset,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after sleep
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retries
 * @param {number} baseDelay - Base delay in ms
 * @returns {Promise} Promise that resolves with function result
 */
const retry = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      await sleep(delay);
    }
  }
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  generateUUID,
  hashString,
  generateSecureToken,
  formatPhoneNumber,
  isValidPhoneNumber,
  isValidEmail,
  formatFileSize,
  getFileExtension,
  getFileType,
  generateUniqueFilename,
  formatDate,
  getTimeAgo,
  isToday,
  isYesterday,
  sanitizeString,
  truncateString,
  toSlug,
  generatePagination,
  sleep,
  retry
}; 