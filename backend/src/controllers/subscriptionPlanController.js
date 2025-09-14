const { SubscriptionPlan } = require('../models')
const { v4: uuidv4 } = require('uuid')

// Get all subscription plans
const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['price', 'ASC']]
    })

    res.json({
      success: true,
      data: plans
    })
  } catch (error) {
    console.error('Get all plans error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    })
  }
}

// Get single subscription plan
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params
    const plan = await SubscriptionPlan.findByPk(id)

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      })
    }

    res.json({
      success: true,
      data: plan
    })
  } catch (error) {
    console.error('Get plan by ID error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plan'
    })
  }
}

// Create new subscription plan
const createPlan = async (req, res) => {
  try {
    const { name, description, price, currency, billing_cycle, features, plan_type } = req.body

    // Validate required fields
    if (!name || !price || !currency || !billing_cycle) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, currency, and billing cycle are required'
      })
    }

    const plan = await SubscriptionPlan.create({
      id: uuidv4(),
      name,
      description: description || '',
      price: parseFloat(price),
      currency,
      billing_cycle,
      features: features || {},
      plan_type: plan_type || 'all_features'
    })

    res.status(201).json({
      success: true,
      data: plan,
      message: 'Subscription plan created successfully'
    })
  } catch (error) {
    console.error('Create plan error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan'
    })
  }
}

// Update subscription plan
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, currency, billing_cycle, features, plan_type } = req.body

    const plan = await SubscriptionPlan.findByPk(id)
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      })
    }

    // Update only provided fields
    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (currency !== undefined) updateData.currency = currency
    if (billing_cycle !== undefined) updateData.billing_cycle = billing_cycle
    if (features !== undefined) updateData.features = features
    if (plan_type !== undefined) updateData.plan_type = plan_type

    await plan.update(updateData)

    res.json({
      success: true,
      data: plan,
      message: 'Subscription plan updated successfully'
    })
  } catch (error) {
    console.error('Update plan error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan'
    })
  }
}

// Delete subscription plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params

    const plan = await SubscriptionPlan.findByPk(id)
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      })
    }

    await plan.destroy()

    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    })
  } catch (error) {
    console.error('Delete plan error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete subscription plan'
    })
  }
}

module.exports = {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
}
