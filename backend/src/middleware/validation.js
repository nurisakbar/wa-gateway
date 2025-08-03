const { body, param, query, validationResult } = require('express-validator');
const { isValidEmail, isValidPhoneNumber } = require('../utils/helpers');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * User registration validation
 */
const validateRegistration = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .custom(value => {
      if (value && !isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['super_admin', 'admin', 'manager', 'operator', 'viewer'])
    .withMessage('Invalid role specified'),
  
  handleValidationErrors
];

/**
 * User login validation
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Device creation validation
 */
const validateDeviceCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('phone_number')
    .optional()
    .trim()
    .custom(value => {
      if (value && !isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Device update validation
 */
const validateDeviceUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Device name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('phone_number')
    .optional()
    .trim()
    .custom(value => {
      if (value && !isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Message sending validation
 */
const validateMessageSending = [
  body('to_number')
    .trim()
    .notEmpty()
    .withMessage('Recipient phone number is required')
    .custom(value => {
      if (!isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 4096 })
    .withMessage('Message must not exceed 4096 characters'),
  
  body('message_type')
    .optional()
    .isIn(['text', 'image', 'video', 'audio', 'document', 'location', 'contact'])
    .withMessage('Invalid message type'),
  
  body('file_id')
    .optional()
    .isUUID()
    .withMessage('Invalid file ID'),
  
  handleValidationErrors
];

/**
 * Contact creation validation
 */
const validateContactCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact name must be between 1 and 100 characters'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(value => {
      if (!isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Contact update validation
 */
const validateContactUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Contact name must be between 1 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .custom(value => {
      if (value && !isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * UUID parameter validation
 */
const validateUUID = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format'),
  
  handleValidationErrors
];

/**
 * Pagination validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

/**
 * Search validation
 */
const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  handleValidationErrors
];

/**
 * File upload validation
 */
const validateFileUpload = [
  body('file_type')
    .optional()
    .isIn(['image', 'video', 'audio', 'document', 'archive'])
    .withMessage('Invalid file type'),
  
  body('is_public')
    .optional()
    .isBoolean()
    .withMessage('is_public must be a boolean'),
  
  handleValidationErrors
];

/**
 * Phone number validation
 */
const validatePhoneNumber = [
  query('phone_number')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .custom(value => {
      if (!isValidPhoneNumber(value)) {
        throw new Error('Please provide a valid phone number');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Webhook validation
 */
const validateWebhook = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Webhook name must be between 1 and 100 characters'),
  
  body('url')
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  body('events')
    .isArray()
    .withMessage('Events must be an array')
    .custom(value => {
      const validEvents = ['message.received', 'message.sent', 'device.connected', 'device.disconnected'];
      const invalidEvents = value.filter(event => !validEvents.includes(event));
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid events: ${invalidEvents.join(', ')}`);
      }
      return true;
    }),
  
  body('secret')
    .optional()
    .trim()
    .isLength({ min: 10, max: 255 })
    .withMessage('Secret must be between 10 and 255 characters'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateDeviceCreation,
  validateDeviceUpdate,
  validateMessageSending,
  validateContactCreation,
  validateContactUpdate,
  validateUUID,
  validatePagination,
  validateSearch,
  validateFileUpload,
  validatePhoneNumber,
  validateWebhook
}; 