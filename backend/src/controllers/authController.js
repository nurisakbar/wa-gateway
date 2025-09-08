const { User } = require('../models');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { logError, logInfo } = require('../utils/logger');
const { generateSecureToken, formatPhoneNumber } = require('../utils/helpers');

/**
 * User Registration
 * POST /api/v1/auth/register
 */
const register = async (req, res) => {
  try {
    const { username, email, password, full_name, phone, role = 'operator' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken'
      });
    }

    // Create user
    const userData = {
      username,
      email,
      password,
      full_name,
      role,
      status: 'pending' // Requires email verification
    };

    if (phone) {
      userData.phone = formatPhoneNumber(phone);
    }

    const user = await User.create(userData);

    // For development, auto-activate user
    if (process.env.NODE_ENV === 'development') {
      await user.update({
        status: 'active',
        email_verified_at: new Date()
      });
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logInfo(`New user registered: ${user.email}`, { userId: user.id });

    const message = process.env.NODE_ENV === 'development' 
      ? 'User registered successfully. Account auto-activated for development.'
      : 'User registered successfully. Please verify your email to activate your account.';

    res.status(201).json({
      error: false,
      message: message,
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    logError(error, 'User Registration');
    res.status(500).json({
      error: true,
      message: 'Registration failed'
    });
  }
};

/**
 * User Login
 * POST /api/v1/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Check if account is locked
    if (user.isLocked()) {
      return res.status(401).json({
        error: true,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Check if account is active
    if (!user.isActive()) {
      return res.status(401).json({
        error: true,
        message: 'Account is not active. Please verify your email or contact administrator.'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        error: true,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    await User.updateLastLogin(user.id, req.ip);

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    logInfo(`User logged in: ${user.email}`, { userId: user.id, ip: req.ip });

    res.json({
      error: false,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    });

  } catch (error) {
    logError(error, 'User Login');
    res.status(500).json({
      error: true,
      message: 'Login failed'
    });
  }
};

/**
 * Refresh Token
 * POST /api/v1/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: true,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user
    const user = await User.findByPk(decoded.userId);
    if (!user || !user.isActive()) {
      return res.status(401).json({
        error: true,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.json({
      error: false,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    logError(error, 'Token Refresh');
    res.status(401).json({
      error: true,
      message: 'Invalid refresh token'
    });
  }
};

/**
 * Get Current User Profile
 * GET /api/v1/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user.toJSON()
    });

  } catch (error) {
    logError(error, 'Get Profile');
    res.status(500).json({
      error: true,
      message: 'Failed to retrieve profile'
    });
  }
};

/**
 * Update User Profile
 * PUT /api/v1/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, bio, address } = req.body;
    const user = await User.findByPk(req.user.id);

    // Update allowed fields
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (phone) updateData.phone = formatPhoneNumber(phone);
    if (bio !== undefined) updateData.bio = bio;
    if (address !== undefined) updateData.address = address;

    await user.update(updateData);

    logInfo(`Profile updated: ${user.email}`, { userId: user.id });

    res.json({
      error: false,
      message: 'Profile updated successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    logError(error, 'Update Profile');
    res.status(500).json({
      error: true,
      message: 'Failed to update profile'
    });
  }
};

/**
 * Change Password
 * PUT /api/v1/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({
        error: true,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logInfo(`Password changed: ${user.email}`, { userId: user.id });

    res.json({
      error: false,
      message: 'Password changed successfully'
    });

  } catch (error) {
    logError(error, 'Change Password');
    res.status(500).json({
      error: true,
      message: 'Failed to change password'
    });
  }
};

/**
 * Logout
 * POST /api/v1/auth/logout
 */
const logout = async (req, res) => {
  try {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return success
    logInfo(`User logged out: ${req.user.email}`, { userId: req.user.id });

    res.json({
      error: false,
      message: 'Logged out successfully'
    });

  } catch (error) {
    logError(error, 'Logout');
    res.status(500).json({
      error: true,
      message: 'Logout failed'
    });
  }
};

/**
 * Verify Email
 * POST /api/v1/auth/verify-email
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // In a real application, you would verify the token from email_verification_tokens table
    // For now, we'll simulate email verification
    const user = await User.findByPk(req.user.id);
    
    if (user.email_verified_at) {
      return res.status(400).json({
        error: true,
        message: 'Email already verified'
      });
    }

    // Update email verification
    await user.update({
      email_verified_at: new Date(),
      status: 'active'
    });

    logInfo(`Email verified: ${user.email}`, { userId: user.id });

    res.json({
      error: false,
      message: 'Email verified successfully',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    logError(error, 'Email Verification');
    res.status(500).json({
      error: true,
      message: 'Email verification failed'
    });
  }
};

/**
 * Request Password Reset
 * POST /api/v1/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        error: false,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    
    // In a real application, you would save this token to password_reset_tokens table
    // and send an email with the reset link

    logInfo(`Password reset requested: ${user.email}`, { userId: user.id });

    res.json({
      error: false,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    logError(error, 'Forgot Password');
    res.status(500).json({
      error: true,
      message: 'Failed to process password reset request'
    });
  }
};

/**
 * Reset Password
 * POST /api/v1/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // In a real application, you would verify the token from password_reset_tokens table
    // For now, we'll simulate password reset
    const user = await User.findByPk(req.user.id);
    
    // Update password
    user.password = newPassword;
    await user.save();

    logInfo(`Password reset: ${user.email}`, { userId: user.id });

    res.json({
      error: false,
      message: 'Password reset successfully'
    });

  } catch (error) {
    logError(error, 'Reset Password');
    res.status(500).json({
      error: true,
      message: 'Failed to reset password'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword
}; 