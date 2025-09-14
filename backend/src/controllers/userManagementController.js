const { User } = require('../models')
const bcrypt = require('bcryptjs')

// Get all users (for admin management)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query
    
    // Build where clause
    const whereClause = {}
    
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ]
    }
    
    if (role) {
      whereClause.role = role
    }
    
    if (status) {
      whereClause.status = status
    }

    const offset = (page - 1) * limit
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password', 'remember_token', 'two_factor_secret'] },
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      success: true,
      data: users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    })
  } catch (error) {
    console.error('Get all users error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    })
  }
}

// Get single user
const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'remember_token', 'two_factor_secret'] }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Get user by ID error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    })
  }
}

// Create new user
const createUser = async (req, res) => {
  try {
    const { full_name, username, email, phone, role, status, password } = req.body

    // Validate required fields
    if (!full_name || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Full name, username, email, and password are required'
      })
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { username: username },
          { email: email }
        ]
      }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
      full_name,
      username,
      email,
      phone: phone || null,
      role: role || 'user',
      status: status || 'active',
      password: hashedPassword
    })

    // Return user without password
    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password', 'remember_token', 'two_factor_secret'] }
    })

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    })
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create user'
    })
  }
}

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { full_name, username, email, phone, role, status, password } = req.body

    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Check if username or email already exists (excluding current user)
    if (username || email) {
      const whereClause = {
        id: { [Op.ne]: id }
      }
      
      if (username && email) {
        whereClause[Op.or] = [
          { username: username },
          { email: email }
        ]
      } else if (username) {
        whereClause.username = username
      } else if (email) {
        whereClause.email = email
      }

      const existingUser = await User.findOne({ where: whereClause })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        })
      }
    }

    // Update only provided fields
    const updateData = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (status !== undefined) updateData.status = status
    if (password !== undefined && password.trim()) {
      updateData.password = await bcrypt.hash(password, 12)
    }

    await user.update(updateData)

    // Return updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password', 'remember_token', 'two_factor_secret'] }
    })

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    })
  }
}

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const user = await User.findByPk(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    // Prevent deletion of super_admin users
    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin users'
      })
    }

    await user.destroy()

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    })
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
}
