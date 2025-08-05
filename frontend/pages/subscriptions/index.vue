<template>
  <div class="subscriptions-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h1 class="page-title">
            <i class="bi bi-credit-card me-2"></i>
            Subscription Plans
          </h1>
          <p class="page-subtitle text-muted">
            Choose the perfect plan for your WhatsApp Gateway needs
          </p>
        </div>
        <div class="col-md-4 text-end">
          <div class="billing-toggle">
            <span class="me-2">Monthly</span>
            <div class="form-check form-switch d-inline-block">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="billingToggle"
                v-model="showYearly"
              >
              <label class="form-check-label" for="billingToggle">Yearly (Save 20%)</label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current Subscription Status -->
    <div v-if="currentSubscription" class="current-subscription mb-4">
      <div class="card border-primary">
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-8">
              <h5 class="card-title text-primary mb-2">
                <i class="bi bi-check-circle me-2"></i>
                Current Subscription
              </h5>
              <p class="card-text mb-1">
                <strong>{{ currentSubscription.SubscriptionPlan?.name }}</strong> - 
                ${{ currentSubscription.SubscriptionPlan?.price }}/{{ currentSubscription.SubscriptionPlan?.billing_cycle }}
              </p>
              <p class="card-text text-muted small mb-0">
                Next billing: {{ formatDate(currentSubscription.current_period_end) }}
              </p>
            </div>
            <div class="col-md-4 text-end">
              <button class="btn btn-outline-danger btn-sm" @click="cancelSubscription">
                <i class="bi bi-x-circle me-1"></i>
                Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscription Plans -->
    <div class="row">
      <div 
        v-for="plan in filteredPlans" 
        :key="plan.id"
        class="col-lg-3 col-md-6 mb-4"
      >
        <div class="plan-card" :class="{ 'popular': plan.is_popular }">
          <div v-if="plan.is_popular" class="popular-badge">
            <i class="bi bi-star-fill me-1"></i>
            Most Popular
          </div>
          
          <div class="plan-header">
            <h3 class="plan-name">{{ plan.name }}</h3>
            <div class="plan-price">
              <span class="currency">$</span>
              <span class="amount">{{ getPlanPrice(plan) }}</span>
              <span class="period">/{{ plan.billing_cycle }}</span>
            </div>
            <p class="plan-description">{{ plan.description }}</p>
          </div>

          <div class="plan-features">
            <div class="feature-item" v-for="(value, key) in plan.limits" :key="key">
              <i class="bi bi-check text-success me-2"></i>
              <span class="feature-text">
                {{ formatFeature(key, value) }}
              </span>
            </div>
          </div>

          <div class="plan-actions">
            <button 
              v-if="!currentSubscription"
              class="btn btn-primary w-100"
              @click="subscribeToPlan(plan)"
              :disabled="subscribing"
            >
              <span v-if="subscribing" class="spinner-border spinner-border-sm me-2"></span>
              Get Started
            </button>
            <button 
              v-else-if="currentSubscription.SubscriptionPlan?.id === plan.id"
              class="btn btn-outline-secondary w-100" 
              disabled
            >
              Current Plan
            </button>
            <button 
              v-else
              class="btn btn-outline-primary w-100"
              @click="upgradePlan(plan)"
              :disabled="subscribing"
            >
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Overview -->
    <div v-if="currentSubscription" class="usage-overview mt-5">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">
            <i class="bi bi-graph-up me-2"></i>
            Usage Overview
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div 
              v-for="(usage, key) in usageData" 
              :key="key"
              class="col-md-4 mb-3"
            >
              <div class="usage-item">
                <div class="usage-label">{{ formatUsageLabel(key) }}</div>
                <div class="usage-progress">
                  <div class="progress">
                    <div 
                      class="progress-bar" 
                      :class="getProgressBarClass(usage.percentage)"
                      :style="{ width: Math.min(usage.percentage, 100) + '%' }"
                    ></div>
                  </div>
                  <div class="usage-stats">
                    <span class="used">{{ usage.used }}</span>
                    <span class="separator">/</span>
                    <span class="limit">{{ usage.limit }}</span>
                    <span class="percentage">({{ usage.percentage.toFixed(1) }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="faq-section mt-5">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title mb-0">
            <i class="bi bi-question-circle me-2"></i>
            Frequently Asked Questions
          </h5>
        </div>
        <div class="card-body">
          <div class="accordion" id="faqAccordion">
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                  Can I change my plan anytime?
                </button>
              </h2>
              <div id="faq1" class="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
                <div class="accordion-body">
                  Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated and reflected in your next billing cycle.
                </div>
              </div>
            </div>
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                  What happens if I exceed my limits?
                </button>
              </h2>
              <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body">
                  If you exceed your plan limits, you'll be notified and may need to upgrade to a higher plan or purchase additional credits.
                </div>
              </div>
            </div>
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                  How do I cancel my subscription?
                </button>
              </h2>
              <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div class="accordion-body">
                  You can cancel your subscription at any time from your account settings. Your service will continue until the end of your current billing period.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard'
})

const { $toast } = useNuxtApp()

// Reactive data
const loading = ref(false)
const subscribing = ref(false)
const plans = ref([])
const currentSubscription = ref(null)
const usageData = ref({})
const showYearly = ref(false)

// Fetch subscription plans
const fetchPlans = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/v1/subscriptions/plans')
    if (response.success) {
      plans.value = response.data
    }
  } catch (error) {
    console.error('Error fetching plans:', error)
    $toast.error('Gagal memuat subscription plans')
  } finally {
    loading.value = false
  }
}

// Fetch current subscription
const fetchCurrentSubscription = async () => {
  try {
    const response = await $fetch('/api/v1/subscriptions/my-subscription')
    if (response.success && response.data) {
      currentSubscription.value = response.data
    }
  } catch (error) {
    console.error('Error fetching current subscription:', error)
  }
}

// Fetch usage data
const fetchUsageData = async () => {
  try {
    const response = await $fetch('/api/v1/subscriptions/usage')
    if (response.success && response.data) {
      const { usage, limits } = response.data
      usageData.value = {
        messages: {
          used: usage.messages_used,
          limit: limits.messages_per_month,
          percentage: (usage.messages_used / limits.messages_per_month) * 100
        },
        api_requests: {
          used: usage.api_requests_used,
          limit: limits.api_requests_per_month,
          percentage: (usage.api_requests_used / limits.api_requests_per_month) * 100
        },
        devices: {
          used: usage.devices_used,
          limit: limits.devices,
          percentage: (usage.devices_used / limits.devices) * 100
        }
      }
    }
  } catch (error) {
    console.error('Error fetching usage data:', error)
  }
}

// Subscribe to plan
const subscribeToPlan = async (plan) => {
  subscribing.value = true
  try {
    const response = await $fetch('/api/v1/subscriptions/subscribe', {
      method: 'POST',
      body: {
        plan_id: plan.id
      }
    })
    
    if (response.success) {
      $toast.success('Berhasil berlangganan ke plan ' + plan.name)
      await fetchCurrentSubscription()
      await fetchUsageData()
    }
  } catch (error) {
    console.error('Error subscribing to plan:', error)
    $toast.error('Gagal berlangganan ke plan')
  } finally {
    subscribing.value = false
  }
}

// Upgrade plan
const upgradePlan = async (plan) => {
  subscribing.value = true
  try {
    const response = await $fetch('/api/v1/subscriptions/subscribe', {
      method: 'POST',
      body: {
        plan_id: plan.id
      }
    })
    
    if (response.success) {
      $toast.success('Berhasil upgrade ke plan ' + plan.name)
      await fetchCurrentSubscription()
      await fetchUsageData()
    }
  } catch (error) {
    console.error('Error upgrading plan:', error)
    $toast.error('Gagal upgrade plan')
  } finally {
    subscribing.value = false
  }
}

// Cancel subscription
const cancelSubscription = async () => {
  if (!confirm('Are you sure you want to cancel your subscription?')) {
    return
  }
  
  try {
    const response = await $fetch('/api/v1/subscriptions/cancel', {
      method: 'POST',
      body: {
        cancel_at_period_end: true
      }
    })
    
    if (response.success) {
      $toast.success('Subscription akan dibatalkan di akhir periode')
      await fetchCurrentSubscription()
    }
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    $toast.error('Gagal membatalkan subscription')
  }
}

// Computed properties
const filteredPlans = computed(() => {
  const cycle = showYearly.value ? 'yearly' : 'monthly'
  return plans.value.filter(plan => plan.billing_cycle === cycle)
})

// Utility functions
const getPlanPrice = (plan) => {
  return plan.price
}

const formatFeature = (key, value) => {
  const labels = {
    messages_per_month: `${value.toLocaleString()} messages/month`,
    api_requests_per_month: `${value.toLocaleString()} API requests/month`,
    devices: `${value} devices`,
    webhooks: `${value} webhooks`,
    storage_gb: `${value} GB storage`,
    support_level: `${value} support`
  }
  return labels[key] || `${key}: ${value}`
}

const formatUsageLabel = (key) => {
  const labels = {
    messages: 'Messages',
    api_requests: 'API Requests',
    devices: 'Devices'
  }
  return labels[key] || key
}

const getProgressBarClass = (percentage) => {
  if (percentage >= 90) return 'bg-danger'
  if (percentage >= 75) return 'bg-warning'
  return 'bg-success'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID')
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    fetchPlans(),
    fetchCurrentSubscription(),
    fetchUsageData()
  ])
})
</script>

<style scoped>
.subscriptions-page {
  padding: 1.5rem;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.page-subtitle {
  font-size: 1.1rem;
  margin-bottom: 0;
}

.billing-toggle {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.plan-card {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  height: 100%;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.plan-card.popular {
  border-color: #007bff;
  transform: scale(1.05);
}

.popular-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.plan-header {
  margin-bottom: 2rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.plan-price {
  margin-bottom: 1rem;
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
  color: #6c757d;
}

.amount {
  font-size: 3rem;
  font-weight: 700;
  color: #007bff;
}

.period {
  font-size: 1rem;
  color: #6c757d;
}

.plan-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0;
}

.plan-features {
  margin-bottom: 2rem;
  text-align: left;
}

.feature-item {
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
}

.feature-text {
  font-size: 0.9rem;
  color: #495057;
}

.plan-actions {
  margin-top: auto;
}

.usage-item {
  margin-bottom: 1rem;
}

.usage-label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.usage-progress {
  margin-bottom: 0.5rem;
}

.progress {
  height: 8px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.usage-stats {
  font-size: 0.8rem;
  color: #6c757d;
}

.used {
  font-weight: 600;
  color: #007bff;
}

.limit {
  color: #495057;
}

.percentage {
  color: #6c757d;
}

.current-subscription {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-radius: 1rem;
}

@media (max-width: 768px) {
  .subscriptions-page {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .plan-card {
    padding: 1.5rem;
  }
  
  .amount {
    font-size: 2.5rem;
  }
}
</style> 