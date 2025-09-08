const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logError } = require('../utils/logger');

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token - user not found'
      });
    }

    // Check if user is active
    if (!user.isActive()) {
      return res.status(401).json({
        error: true,
        message: 'Account is not active'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(401).json({
        error: true,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token has expired'
      });
    }

    logError(error, 'Authentication Middleware');
    return res.status(500).json({
      error: true,
      message: 'Authentication error'
    });
  }
};

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't require token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (user && user.isActive() && !user.isLocked()) {
      req.user = user;
    }

    next();

  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

/**
 * Role-based authorization middleware
 * @param {string|Array} roles - Required role(s)
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required'
      });
    }

    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasPermission = requiredRoles.some(role => req.user.hasRole(role));

    if (!hasPermission) {
      return res.status(403).json({
        error: true,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

/**
 * Super admin authorization middleware
 */
const requireSuperAdmin = authorize('super_admin');

/**
 * Admin authorization middleware
 */
const requireAdmin = authorize(['super_admin', 'admin']);

/**
 * Manager authorization middleware
 */
const requireManager = authorize(['super_admin', 'admin', 'manager']);

/**
 * Operator authorization middleware
 */
const requireOperator = authorize(['super_admin', 'admin', 'manager', 'operator']);

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @returns {string} Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    type: 'refresh'
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  authorize,
  requireSuperAdmin,
  requireAdmin,
  requireManager,
  requireOperator,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken
}; 