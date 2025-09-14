const express = require('express')
const router = express.Router()
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/subscriptionPlanController')
const { authenticateToken } = require('../middleware/auth')

// Apply authentication middleware to all routes
router.use(authenticateToken)

// GET /api/v1/subscription-plans - Get all subscription plans
router.get('/', getAllPlans)

// GET /api/v1/subscription-plans/:id - Get single subscription plan
router.get('/:id', getPlanById)

// POST /api/v1/subscription-plans - Create new subscription plan
router.post('/', createPlan)

// PUT /api/v1/subscription-plans/:id - Update subscription plan
router.put('/:id', updatePlan)

// DELETE /api/v1/subscription-plans/:id - Delete subscription plan
router.delete('/:id', deletePlan)

module.exports = router
