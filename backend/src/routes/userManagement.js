const express = require('express')
const router = express.Router()
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userManagementController')
const { authenticateToken } = require('../middleware/auth')

// Apply authentication middleware to all routes
router.use(authenticateToken)

// GET /api/v1/user-management - Get all users (with pagination and filters)
router.get('/', getAllUsers)

// GET /api/v1/user-management/:id - Get single user
router.get('/:id', getUserById)

// POST /api/v1/user-management - Create new user
router.post('/', createUser)

// PUT /api/v1/user-management/:id - Update user
router.put('/:id', updateUser)

// DELETE /api/v1/user-management/:id - Delete user
router.delete('/:id', deleteUser)

module.exports = router
