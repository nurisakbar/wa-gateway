<template>
  <div class="subscriptions-page">


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
                <strong>{{ currentSubscription.plan?.name }}</strong> - 
                Rp {{ currentSubscription.plan?.price?.toLocaleString('id-ID') }}/{{ currentSubscription.plan?.billing_cycle }}
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
    <div id="subscription-plans">
      <!-- Text Only Plans -->
      <div class="plans-section mb-5">
        <div class="section-header mb-4">
          <!-- Controls Row -->
          <div class="row align-items-center mb-3">
            <div class="col-md-6">
              <!-- Currency Toggle -->
              <div class="currency-toggle">
                <button 
                  class="btn btn-sm" 
                  :class="currency === 'IDR' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="currency = 'IDR'"
                >
                  IDR
                </button>
                <button 
                  class="btn btn-sm" 
                  :class="currency === 'USD' ? 'btn-primary' : 'btn-outline-secondary'"
                  @click="currency = 'USD'"
                >
                  USD
                </button>
              </div>
            </div>
            <div class="col-md-6">
              <div class="d-flex justify-content-end">
                <!-- Billing Toggle -->
                <div class="billing-toggle">
                  <button 
                    class="btn btn-sm" 
                    :class="!showYearly ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="showYearly = false"
                  >
                    Bulanan
                  </button>
                  <button 
                    class="btn btn-sm" 
                    :class="showYearly ? 'btn-primary' : 'btn-outline-secondary'"
                    @click="showYearly = true"
                  >
                    Tahunan
                    <span class="badge bg-success ms-1">Hemat 20%</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <!-- Section Title Row - Centered -->
          <div class="row">
            <div class="col-12 text-center">
              <h4 class="section-title mb-0">
                <i class="bi bi-chat-dots me-2"></i>
                Text Only
              </h4>
            </div>
          </div>
        </div>
        <div class="row">
          <div v-for="plan in textOnlyPlans" :key="plan.code" class="col-lg-4 col-md-6 col-sm-12 mb-4">
            <div class="plan-card h-100 text-only">
              <div class="plan-icon">
                <i class="bi bi-chat-dots"></i>
              </div>
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">{{ currency === 'IDR' ? 'Rp' : '$' }}</span>
                  <span class="amount">{{ getPlanPrice(plan) }}</span>
                  <span class="period">/{{ showYearly ? 'yearly' : 'monthly' }}</span>
                  <div v-if="showYearly && plan.price.yearly > 0" class="discount-badge">
                    <i class="bi bi-percent"></i>
                    <span>20% OFF</span>
                  </div>
                </div>
                <div v-if="showYearly && plan.price.yearly > 0" class="savings-info">
                  <small class="text-muted">
                    <i class="bi bi-piggy-bank me-1"></i>
                    Hemat Rp {{ (plan.price.monthly * 12 - plan.price.yearly).toLocaleString('id-ID') }}/tahun
                  </small>
                </div>
              </div>
              <div class="plan-features">
                <div v-for="f in plan.features" :key="f.text" class="feature-item">
                  <i :class="f.ok ? 'bi bi-check text-success' : 'bi bi-x text-danger'" class="me-2"></i>
                  <span class="feature-text" :class="{ 'text-muted': !f.ok }">{{ f.text }}</span>
                </div>
              </div>
              <div class="plan-actions">
                <button 
                  class="btn btn-outline-primary w-100"
                  @click="subscribeStatic(plan)"
                  :disabled="subscribing"
                >
                  <span v-if="subscribing" class="spinner-border spinner-border-sm me-2"></span>
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- All Feature Plans -->
      <div class="plans-section">
        <h4 class="section-title mb-4">
          <i class="bi bi-paperclip me-2"></i>
          All Feature
        </h4>
        <div class="row">
          <div v-for="plan in allFeaturePlans" :key="plan.code" class="col-lg-4 col-md-4 mb-4">
            <div class="plan-card h-100 all-feature">
              <div class="plan-icon">
                <i class="bi bi-paperclip"></i>
              </div>
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">{{ currency === 'IDR' ? 'Rp' : '$' }}</span>
                  <span class="amount">{{ getPlanPrice(plan) }}</span>
                  <span class="period">/{{ showYearly ? 'yearly' : 'monthly' }}</span>
                  <div v-if="showYearly && plan.price.yearly > 0" class="discount-badge">
                    <i class="bi bi-percent"></i>
                    <span>20% OFF</span>
                  </div>
                </div>
                <div v-if="showYearly && plan.price.yearly > 0" class="savings-info">
                  <small class="text-muted">
                    <i class="bi bi-piggy-bank me-1"></i>
                    Hemat Rp {{ (plan.price.monthly * 12 - plan.price.yearly).toLocaleString('id-ID') }}/tahun
                  </small>
                </div>
              </div>
              <div class="plan-features">
                <div v-for="f in plan.features" :key="f.text" class="feature-item">
                  <i :class="f.ok ? 'bi bi-check text-success' : 'bi bi-x text-danger'" class="me-2"></i>
                  <span class="feature-text" :class="{ 'text-muted': !f.ok }">{{ f.text }}</span>
                </div>
              </div>
              <div class="plan-actions">
                <button 
                  class="btn btn-outline-primary w-100"
                  @click="subscribeStatic(plan)"
                  :disabled="subscribing"
                >
                  <span v-if="subscribing" class="spinner-border spinner-border-sm me-2"></span>
                  Get Started
                </button>
              </div>
            </div>
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
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $toast } = useNuxtApp()

// Reactive data
const loading = ref(false)
const subscribing = ref(false)
const plans = ref([])
const currentSubscription = ref(null)
const usageData = ref({})
const showYearly = ref(false)
const currency = ref('IDR')

// Static fallback plans (shown if API plans not available)
const textOnlyPlans = ref([
  {
    id: 'plan-001',
    code: 'free',
    name: 'Free',
    price: {
      monthly: { IDR: 0, USD: 0 },
      yearly: { IDR: 0, USD: 0 }
    },
    features: [
      { text: '1.000 pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: false },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: false },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: false },
      { text: 'Device notification', ok: false },
      { text: '0 Multics Agent', ok: true }
    ]
  },
  { 
    id: 'plan-002',
    code: 'lite', 
    name: 'Lite', 
    price: {
      monthly: { IDR: 25000, USD: 2 },
      yearly: { IDR: 240000, USD: 19 }
    },
    features: [
      { text: '1.000 pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: false },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: false },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: true },
      { text: 'Device notification', ok: true },
      { text: '0 Multics Agent', ok: true }
    ]
  },
  { 
    id: 'plan-003',
    code: 'regular', 
    name: 'Regular', 
    price: {
      monthly: { IDR: 66000, USD: 5 },
      yearly: { IDR: 633600, USD: 48 }
    },
    features: [
      { text: '10.000 pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: false },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: true },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: true },
      { text: 'Device notification', ok: false },
      { text: '2 Multics Agents', ok: true }
    ]
  },
  { 
    id: 'plan-004',
    code: 'regular-pro', 
    name: 'Regular Pro', 
    price: {
      monthly: { IDR: 110000, USD: 8 },
      yearly: { IDR: 1056000, USD: 77 }
    },
    features: [
      { text: '25.000 pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: false },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: true },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: false },
      { text: 'Device notification', ok: false },
      { text: '2 Multics Agents', ok: true }
    ]
  },
  { 
    id: 'plan-005',
    code: 'master', 
    name: 'Master', 
    price: {
      monthly: { IDR: 175000, USD: 13 },
      yearly: { IDR: 1680000, USD: 125 }
    },
    features: [
      { text: 'Unlimited pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: false },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: true },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: false },
      { text: 'Device notification', ok: false },
      { text: '4 Multics Agents', ok: true }
    ]
  }
])

const allFeaturePlans = ref([
  { 
    id: 'plan-006',
    code: 'super', 
    name: 'Super', 
    price: {
      monthly: { IDR: 165000, USD: 12 },
      yearly: { IDR: 1584000, USD: 115 }
    },
    features: [
      { text: '10.000 pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: true },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: true },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: true },
      { text: 'Device notification', ok: true },
      { text: '2 Multics Agents', ok: true }
    ]
  },
  { 
    id: 'plan-007',
    code: 'advanced', 
    name: 'Advanced', 
    price: {
      monthly: { IDR: 255000, USD: 19 },
      yearly: { IDR: 2448000, USD: 182 }
    },
    features: [
      { text: '25.000 pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: true },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: true },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: true },
      { text: 'Device notification', ok: true },
      { text: '2 Multics Agents', ok: true }
    ]
  },
  { 
    id: 'plan-008',
    code: 'ultra', 
    name: 'Ultra', 
    price: {
      monthly: { IDR: 355000, USD: 26 },
      yearly: { IDR: 3408000, USD: 250 }
    },
    features: [
      { text: 'Unlimited pesan/bulan', ok: true },
      { text: 'Kirim personal', ok: true },
      { text: 'Kirim group', ok: true },
      { text: 'Pesan text', ok: true },
      { text: 'Pesan schedule', ok: true },
      { text: 'Pesan recurring', ok: true },
      { text: 'Pesan template', ok: true },
      { text: 'Pesan button (deprecated)', ok: true },
      { text: 'Pesan attachment', ok: true },
      { text: 'Autoreply', ok: true },
      { text: 'Autoreply spreadsheet', ok: true },
      { text: 'Webhook', ok: true },
      { text: 'Api', ok: true },
      { text: 'Remove watermark', ok: true },
      { text: 'Device notification', ok: true },
      { text: '4 Multics Agents', ok: true }
    ]
  }
])

const subscribeStatic = async (plan) => {
  subscribing.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    // Use the plan ID directly from the plan object
    const planId = plan.id
    if (!planId) {
      $toast.error('Plan ID not found')
      return
    }
    
    const response = await $fetch(`${config.public.apiBase}/subscriptions/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        plan_id: planId,
        billing_cycle: showYearly.value ? 'yearly' : 'monthly'
      }
    })
    
    if (response.success) {
      $toast.success(`Berhasil berlangganan ke paket ${plan.name}`)
      await fetchCurrentSubscription()
      await fetchUsageData()
      
      // Update auth store with new subscription
      const authStore = useAuthStore()
      await authStore.fetchSubscription()
      
      // Redirect to dashboard after successful subscription
      await navigateTo('/dashboard')
    }
  } catch (error) {
    console.error('Error subscribing to plan:', error)
    if (error.data?.message) {
      $toast.error(error.data.message)
    } else {
      $toast.error('Gagal berlangganan ke paket')
    }
  } finally {
    subscribing.value = false
  }
}

// Fetch subscription plans
const fetchPlans = async () => {
      loading.value = true
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/subscriptions/plans`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
    if (response.success) {
      plans.value = response.data.plans || response.data.subscription || response.data.usage || response.data
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
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/subscriptions/my-subscription`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      currentSubscription.value = response.data
    }
  } catch (error) {
    console.error('Error fetching current subscription:', error)
  }
}

// Fetch usage data
const fetchUsageData = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/subscriptions/usage`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      onResponseError({ response }) {
        // Suppress 404 errors for usage API - this is expected behavior
        if (response.status === 404) {
          return
        }
      }
    })
    
    if (response.success) {
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
    // Handle 404 error gracefully (no active subscription)
    if (error.status === 404 || error.statusCode === 404 || error.response?.status === 404) {
      // Silently handle no active subscription - this is expected behavior
      usageData.value = {
        messages: { used: 0, limit: 0, percentage: 0 },
        api_requests: { used: 0, limit: 0, percentage: 0 },
        devices: { used: 0, limit: 0, percentage: 0 }
      }
      // Don't log anything for expected 404 responses
      return
    } else {
      console.error('Error fetching usage data:', error)
    }
  }
}

// Subscribe to plan
const subscribeToPlan = async (plan) => {
  subscribing.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/subscriptions/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        plan_id: plan.id,
        billing_cycle: 'monthly'
      }
    })
    
    if (response.success) {
      $toast.success('Berhasil berlangganan ke plan ' + plan.name)
      await fetchCurrentSubscription()
      await fetchUsageData()
      
      // Update auth store with new subscription
      const authStore = useAuthStore()
      await authStore.fetchSubscription()
      
      // Redirect to dashboard after successful subscription
      await navigateTo('/dashboard')
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
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/subscriptions/subscribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        plan_id: plan.id,
        billing_cycle: showYearly.value ? 'yearly' : 'monthly'
      }
    })
    
    if (response.success) {
      $toast.success('Berhasil upgrade ke plan ' + plan.name)
      await fetchCurrentSubscription()
      await fetchUsageData()
      
      // Update auth store with new subscription
      const authStore = useAuthStore()
      await authStore.fetchSubscription()
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
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/subscriptions/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        cancel_at_period_end: false
      }
    })
    
    if (response.success) {
      $toast.success('Subscription berhasil dibatalkan')
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
  // Handle new price structure with currency and monthly/yearly
  if (typeof plan.price === 'object' && plan.price !== null) {
    const cycle = showYearly.value ? 'yearly' : 'monthly'
    const price = plan.price[cycle]?.[currency.value] || plan.price[cycle]?.IDR || 0
    
    if (price === 0) return '0'
    
    if (currency.value === 'IDR') {
      return price.toLocaleString('id-ID')
    } else {
      return price.toString()
    }
  }
  
  // Fallback for old price structure
  if (plan.price === 0) return '0'
  return plan.price.toLocaleString('id-ID')
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

// Scroll to plans section
const scrollToPlans = () => {
  const plansSection = document.getElementById('subscription-plans')
  if (plansSection) {
    plansSection.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// Initialize data
onMounted(async () => {
  // Get current subscription from auth store instead of API
  const authStore = useAuthStore()
  currentSubscription.value = authStore.subscription
  
  // Only fetch usage data if user has subscription
  if (currentSubscription.value) {
    await fetchUsageData()
  }
})
</script>

<style scoped>
.subscriptions-page {
  padding: 1.5rem;
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

/* Section Header Styling */
.section-header {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
}

.section-title {
  margin-top: 0.5rem;
}

.currency-toggle, .billing-toggle {
  display: flex;
  gap: 0.25rem;
}

.currency-toggle .btn, .billing-toggle .btn {
  min-width: 60px;
  font-size: 0.875rem;
  padding: 0.375rem 0.75rem;
}

/* Plan Cards for Text Only - larger width */
.text-only .plan-card {
  min-height: 600px;
}

.text-only .plan-features {
  /* Remove scroll - show all features */
}

.text-only .feature-item {
  font-size: 0.9rem;
  /* margin-bottom: 0.5rem; */
}

.text-only .plan-name {
  font-size: 1.5rem;
  font-weight: 600;
}

.text-only .plan-price .amount {
  font-size: 2rem;
  font-weight: 700;
}



@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

/* Enhanced Styles */
.toggle-container {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toggle-label {
  font-weight: 500;
  color: #6c757d;
  transition: color 0.3s ease;
}

.toggle-label.active {
  color: #007bff;
  font-weight: 600;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  text-align: center;
  margin-bottom: 2rem;
}

.plan-card {
  background: white;
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
}

.plan-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.plan-card.popular {
  border-color: #007bff;
  transform: scale(1.05);
}

.plan-card.advanced {
  border-color: #28a745;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.popular-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: #007bff;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.plan-header {
  text-align: center;
  margin-bottom: 2rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.plan-price {
  margin-bottom: 1rem;
}

.currency {
  font-size: 1.2rem;
  color: #6c757d;
  vertical-align: top;
}

.amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #007bff;
  line-height: 1;
}

.period {
  font-size: 0.9rem;
  color: #6c757d;
  margin-left: 0.25rem;
  font-weight: 500;
}

.plan-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0;
  line-height: 1.4;
}

.plan-features {
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: -10px;
  padding: 0.5rem 0;
}

.feature-item i {
  font-size: 1.1rem;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.feature-text {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #495057;
}

.plan-actions {
  margin-top: auto;
}

.plan-actions .btn {
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.plan-actions .btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

/* Plan Icons */
.plan-icon {
  text-align: center;
  margin-bottom: 1rem;
}

.plan-icon i {
  font-size: 2rem;
  color: #6c757d;
}

.plan-card.text-only .plan-icon i {
  color: #007bff;
}

.plan-card.all-feature .plan-icon i {
  color: #28a745;
}

/* Plan Card Variations */
.plan-card.text-only {
  border-left: 4px solid #007bff;
}

.plan-card.all-feature {
  border-left: 4px solid #28a745;
}

/* Discount Badge */
.discount-badge {
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 0.5rem;
  box-shadow: 0 2px 4px rgba(238, 90, 36, 0.3);
}

.discount-badge i {
  margin-right: 0.25rem;
  font-size: 0.7rem;
}

/* Savings Info */
.savings-info {
  margin-top: 0.5rem;
  text-align: center;
}

.savings-info small {
  color: #28a745 !important;
  font-weight: 500;
}

/* Feature List Styling */
.plan-features {
  text-align: left;
  margin-bottom: 1.5rem;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: -10px;
  font-size: 0.9rem;
}

.feature-item i {
  width: 16px;
  text-align: center;
  margin-right: 0.5rem;
}

.feature-text {
  flex: 1;
}

/* Button Styling */
.plan-actions .btn {
  font-weight: 500;
  padding: 0.5rem 1rem;
}

@media (max-width: 768px) {
  .subscriptions-page {
    padding: 1rem;
  }
  
  
  .plan-card {
    padding: 1.5rem;
  }
  
  .plan-card.popular {
    transform: none;
  }
  
  .amount {
    font-size: 2rem;
  }
  
  .toggle-container {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
}
</style> 