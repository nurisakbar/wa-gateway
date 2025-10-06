<template>
  <div class="subscriptions-page">


    <!-- Current Subscription Status -->
    <div v-if="currentSubscription" class="current-subscription mb-4">
      <div class="card current-card">
        <span class="accent-bar"></span>
        <div class="card-body">
          <div class="row align-items-center g-3">
            <div class="col-md-8 d-flex align-items-start gap-3">
              <div class="status-icon">
                <i class="bi bi-check2"></i>
              </div>
              <div>
                <h5 class="card-title mb-1">Current Subscription</h5>
                <p class="card-text mb-1 plan-line">
                  <strong>{{ currentSubscription.plan?.name }}</strong>
                  <span class="dot">•</span>
                  Rp {{ currentSubscription.plan?.price?.toLocaleString('id-ID') }}/{{ currentSubscription.plan?.billing_cycle }}
                </p>
                <p class="card-text text-muted small mb-0">Next billing: {{ formatDate(currentSubscription.current_period_end) }}</p>
              </div>
            </div>
            <div class="col-md-4 text-end">
              <button class="btn btn-ghost-danger btn-sm" @click="cancelSubscription">
                <i class="bi bi-x-circle me-1"></i> Cancel Subscription
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
              <!-- Currency Display -->
              <div class="currency-display">
                <span class="badge bg-primary fs-6">IDR</span>
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
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading subscription plans...</p>
        </div>
        <div v-else-if="textOnlyPlans.length === 0" class="text-center py-4">
          <p class="text-muted">No text-only subscription plans available</p>
          <p class="text-muted small">Plans count: {{ plans.length }}, Text Only: {{ textOnlyPlans.length }}</p>
        </div>
        <div v-else class="row">
          <div v-for="plan in textOnlyPlans" :key="plan.id" class="col-lg-4 col-md-6 col-sm-12 mb-4">
            <div
              class="plan-card h-100 text-only"
              :class="{ 'is-current': isCurrentPlan(plan), 'popular': isPopular(plan) }"
            >
              <div v-if="isCurrentPlan(plan)" class="plan-ribbon current">
                <i class="bi bi-check-circle me-1"></i> Paket Aktif
              </div>
              <div v-else-if="isPopular(plan)" class="plan-ribbon popular">
                <i class="bi bi-star-fill me-1"></i> Popular
              </div>
              <div class="plan-icon">
                <i class="bi bi-chat-dots"></i>
              </div>
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">Rp</span>
                  <span class="amount">{{ getPlanPrice(plan) }}</span>
                  <span class="period">/{{ showYearly ? 'yearly' : 'monthly' }}</span>
                  <div v-if="showYearly && plan.price.yearly > 0" class="discount-badge">
                    <i class="bi bi-percent"></i>
                    <span>20% OFF</span>
                  </div>
                </div>
                <!-- Savings Information -->
                <div v-if="showYearly && parseFloat(plan.price) > 0" class="savings-info">
                  <small class="text-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Hemat Rp {{ getSavingsAmount(plan) }} dibanding bulanan
                  </small>
                </div>
              </div>
              <div class="plan-features">
                <div v-for="(value, key) in plan.limits" :key="key" class="feature-item">
                  <i class="bi bi-check text-success me-2"></i>
                  <span class="feature-text">{{ formatFeature(key, value) }}</span>
                </div>
              </div>
              <div class="plan-actions">
                <button
                  v-if="!isCurrentPlan(plan)"
                  class="btn btn-primary w-100 plan-cta"
                  @click="subscribeStatic(plan)"
                  :disabled="subscribing"
                >
                  <span v-if="subscribing" class="spinner-border spinner-border-sm me-2"></span>
                  Pilih Paket
                </button>
                <button v-else class="btn btn-outline-success w-100" disabled>
                  <i class="bi bi-check2-circle me-1"></i>Paket Aktif
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
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading all-feature plans...</p>
        </div>
        <div v-else-if="allFeaturePlans.length === 0" class="text-center py-4">
          <p class="text-muted">No all-feature subscription plans available</p>
          <p class="text-muted small">All Feature plans: {{ allFeaturePlans.length }}</p>
        </div>
        <div v-else class="row">
          <div v-for="plan in allFeaturePlans" :key="plan.id" class="col-lg-4 col-md-4 mb-4">
            <div
              class="plan-card h-100 all-feature"
              :class="{ 'is-current': isCurrentPlan(plan), 'popular': isPopular(plan) }"
            >
              <div v-if="isCurrentPlan(plan)" class="plan-ribbon current">
                <i class="bi bi-check-circle me-1"></i> Paket Aktif
              </div>
              <div v-else-if="isPopular(plan)" class="plan-ribbon popular">
                <i class="bi bi-star-fill me-1"></i> Popular
              </div>
              <div class="plan-icon">
                <i class="bi bi-paperclip"></i>
              </div>
              <div class="plan-header">
                <h3 class="plan-name">{{ plan.name }}</h3>
                <div class="plan-price">
                  <span class="currency">Rp</span>
                  <span class="amount">{{ getPlanPrice(plan) }}</span>
                  <span class="period">/{{ showYearly ? 'yearly' : 'monthly' }}</span>
                  <div v-if="showYearly && plan.price.yearly > 0" class="discount-badge">
                    <i class="bi bi-percent"></i>
                    <span>20% OFF</span>
                  </div>
                </div>
                <!-- Savings Information -->
                <div v-if="showYearly && parseFloat(plan.price) > 0" class="savings-info">
                  <small class="text-success">
                    <i class="bi bi-check-circle me-1"></i>
                    Hemat Rp {{ getSavingsAmount(plan) }} dibanding bulanan
                  </small>
                </div>
              </div>
              <div class="plan-features">
                <div v-for="(value, key) in plan.limits" :key="key" class="feature-item">
                  <i class="bi bi-check text-success me-2"></i>
                  <span class="feature-text">{{ formatFeature(key, value) }}</span>
                </div>
              </div>
              <div class="plan-actions">
                <button
                  v-if="!isCurrentPlan(plan)"
                  class="btn btn-primary w-100 plan-cta"
                  @click="subscribeStatic(plan)"
                  :disabled="subscribing"
                >
                  <span v-if="subscribing" class="spinner-border spinner-border-sm me-2"></span>
                  Pilih Paket
                </button>
                <button v-else class="btn btn-outline-success w-100" disabled>
                  <i class="bi bi-check2-circle me-1"></i>Paket Aktif
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

    <!-- Payment Modal -->
    <div class="modal fade" :class="{ show: showPaymentModal, 'd-block': showPaymentModal }" tabindex="-1" v-if="showPaymentModal">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-credit-card me-2"></i>
              Pembayaran Langganan
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closePaymentModal"></button>
          </div>
          <div class="modal-body p-4">
            <!-- Invoice Details -->
            <div class="invoice-details mb-4">
              <h6 class="fw-bold text-primary mb-3">
                <i class="bi bi-receipt me-2"></i>
                Detail Tagihan
              </h6>
              <div class="row">
                <div class="col-md-6">
                  <p class="mb-2"><strong>Nomor Invoice:</strong> {{ currentInvoice?.invoice_number }}</p>
                  <p class="mb-2"><strong>Paket:</strong> {{ currentPlan?.name }}</p>
                  <p class="mb-2"><strong>Periode:</strong> {{ currentInvoice?.metadata?.billing_cycle }}</p>
                </div>
                <div class="col-md-6">
                  <p class="mb-2"><strong>Jumlah:</strong> <span class="text-primary fw-bold">Rp {{ formatCurrency(currentInvoice?.total) }}</span></p>
                  <p class="mb-2"><strong>Jatuh Tempo:</strong> {{ formatDate(currentInvoice?.due_date) }}</p>
                  <p class="mb-2"><strong>Status:</strong> <span class="badge bg-warning">{{ currentInvoice?.status }}</span></p>
                </div>
              </div>
            </div>

            <!-- Payment Instructions -->
            <div class="payment-instructions">
              <h6 class="fw-bold text-success mb-3">
                <i class="bi bi-bank me-2"></i>
                Instruksi Pembayaran
              </h6>
              <div class="alert alert-info">
                <p class="mb-3">{{ currentInvoice?.metadata?.payment_details?.payment_instructions }}</p>
                
                <div class="bank-details bg-light p-3 rounded">
                  <h6 class="fw-bold mb-3">Detail Rekening:</h6>
                  <div class="row">
                    <div class="col-md-6">
                      <p class="mb-2"><strong>Bank:</strong> {{ currentInvoice?.metadata?.payment_details?.bank_name }}</p>
                      <p class="mb-2"><strong>Nama:</strong> {{ currentInvoice?.metadata?.payment_details?.account_name }}</p>
                    </div>
                    <div class="col-md-6">
                      <p class="mb-2"><strong>Nomor Rekening:</strong></p>
                      <div class="input-group">
                        <input 
                          type="text" 
                          class="form-control fw-bold text-primary" 
                          :value="currentInvoice?.metadata?.payment_details?.account_number"
                          readonly
                          id="accountNumber"
                        >
                        <button 
                          class="btn btn-outline-primary" 
                          type="button"
                          @click="copyAccountNumber"
                        >
                          <i class="bi bi-copy"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Important Notes -->
            <div class="important-notes">
              <h6 class="fw-bold text-warning mb-3">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Catatan Penting
              </h6>
              <ul class="list-unstyled">
                <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Transfer sesuai nominal tagihan yang tertera</li>
                <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Simpan bukti transfer untuk arsip pribadi</li>
                <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Konfirmasi pembayaran dengan chat WhatsApp admin</li>
                <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i>Langganan akan aktif setelah pembayaran dikonfirmasi</li>
              </ul>
            </div>
          </div>
          <div class="modal-footer bg-light border-0 p-4">
            <button type="button" class="btn btn-outline-secondary" @click="closePaymentModal">
              <i class="bi bi-x-circle me-1"></i>
              Tutup
            </button>
            <a :href="whatsappDeepLink" target="_blank" class="btn btn-success">
              <i class="bi bi-whatsapp me-1"></i>
              Chat Admin via WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showPaymentModal" class="modal-backdrop fade show"></div>

  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $toast } = useNuxtApp()
// Helpers to mark current plan and popular plan
const isCurrentPlan = (plan) => {
  const sub = currentSubscription.value
  if (!sub || !sub.plan) return false
  return String(sub.plan.id) === String(plan.id)
}

const isPopular = (plan) => {
  // Mark mid-tier (e.g., index 1) as popular by convention
  const list = plan.plan_type === 'text_only' ? textOnlyPlans.value : allFeaturePlans.value
  const idx = list.findIndex(p => String(p.id) === String(plan.id))
  return idx === 1
}

// Reactive data
const loading = ref(false)
const subscribing = ref(false)
const plans = ref([])
const currentSubscription = ref(null)
const usageData = ref({})
const showYearly = ref(false)
// Currency is now fixed to IDR only

// Payment modal data
const showPaymentModal = ref(false)
const currentInvoice = ref(null)
const currentPlan = ref(null)

// Removed confirmation modal; WhatsApp-first flow

// WhatsApp deep link with prefilled message
const whatsappNumber = '+6282129948687'
const whatsappDeepLink = computed(() => {
  const invoiceNo = currentInvoice.value?.invoice_number || ''
  const message = `Halo Admin, saya sudah transfer untuk langganan. Nomor invoice: ${invoiceNo}. Mohon verifikasi.`
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${whatsappNumber}?text=${encoded}`
})

// Functions

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
      
      // Show payment details if invoice was created
      if (response.data.invoice) {
        openPaymentModal(response.data.invoice, plan)
      } else {
        // Redirect to dashboard if no payment needed (free plan)
        await navigateTo('/dashboard')
      }
    }
  } catch (error) {
// console.error('Error subscribing to plan:', error)
    if (error.data?.message) {
      $toast.error(error.data.message)
    } else {
      $toast.error('Gagal berlangganan ke paket')
    }
  } finally {
    subscribing.value = false
  }
}

// Payment modal functions
const openPaymentModal = (invoice, plan) => {
  currentInvoice.value = invoice
  currentPlan.value = plan
  showPaymentModal.value = true
}

const closePaymentModal = () => {
  showPaymentModal.value = false
  currentInvoice.value = null
  currentPlan.value = null
}

// No-op removed handlers

const copyAccountNumber = async () => {
  try {
    await navigator.clipboard.writeText(currentInvoice.value?.metadata?.payment_details?.account_number)
    $toast.success('Nomor rekening berhasil disalin!')
  } catch (error) {
    $toast.error('Gagal menyalin nomor rekening')
  }
}

// Replaced by direct WhatsApp link in template

// Utility functions
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '0'
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
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
      // console.log('Plans loaded:', plans.value.length, 'plans')
    }
  } catch (error) {
// console.error('Error fetching plans:', error)
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
// console.error('Error fetching current subscription:', error)
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
// console.error('Error fetching usage data:', error)
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
// console.error('Error subscribing to plan:', error)
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
// console.error('Error upgrading plan:', error)
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
// console.error('Error cancelling subscription:', error)
    $toast.error('Gagal membatalkan subscription')
  }
}

// Computed properties
const textOnlyPlans = computed(() => {
  return plans.value.filter(plan => plan.plan_type === 'text_only')
})

const allFeaturePlans = computed(() => {
  return plans.value.filter(plan => plan.plan_type === 'all_feature')
})

const filteredPlans = computed(() => {
  // For now, show all plans since database only has monthly plans
  // TODO: Add yearly plans to database or implement yearly pricing logic
  // console.log('Filtered plans:', plans.value.length, 'plans')
  return plans.value
})

// Utility functions
const getPlanPrice = (plan) => {
  // Handle database price structure (string from database)
  const monthlyPrice = parseFloat(plan.price) || 0
  
  if (monthlyPrice === 0) return '0'
  
  // Calculate yearly price with 20% discount
  let price = monthlyPrice
  if (showYearly.value) {
    price = monthlyPrice * 12 * 0.8 // 20% discount for yearly
  }
  
  // Format as IDR (Indonesian Rupiah)
  return price.toLocaleString('id-ID')
}

const getSavingsAmount = (plan) => {
  const monthlyPrice = parseFloat(plan.price) || 0
  
  if (monthlyPrice === 0) return '0'
  
  // Calculate savings: monthly price * 12 - yearly price
  const monthlyTotal = monthlyPrice * 12
  const yearlyPrice = monthlyPrice * 12 * 0.8
  const savings = monthlyTotal - yearlyPrice
  
  return savings.toLocaleString('id-ID')
}

const formatFeature = (key, value) => {
  const labels = {
    messages_per_month: value === -1 ? 'Unlimited pesan/bulan' : `${value.toLocaleString()} pesan/bulan`,
    api_requests_per_month: `${value.toLocaleString()} API requests/bulan`,
    devices: `${value} device`,
    webhooks: `${value} webhook`,
    support_level: `Support ${value}`,
    attachments: value ? 'Pesan attachment' : 'Tidak ada attachment',
    autoreply: value ? 'Autoreply' : 'Tidak ada autoreply',
    autoreply_spreadsheet: value ? 'Autoreply spreadsheet' : 'Tidak ada autoreply spreadsheet',
    remove_watermark: value ? 'Hapus watermark' : 'Dengan watermark',
    device_notifications: value ? 'Notifikasi device' : 'Tidak ada notifikasi',
    multics_agents: `${value} Multics Agent`
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
  // Fetch subscription plans from database
  await fetchPlans()
  
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
.plan-ribbon {
  position: absolute;
  top: 12px;
  left: -12px;
  padding: 0.35rem 1rem;
  color: #fff;
  font-weight: 600;
  font-size: 0.8rem;
  transform: rotate(-6deg);
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
}

.plan-ribbon.current { background: linear-gradient(135deg, #22c55e, #16a34a); }
.plan-ribbon.popular { background: linear-gradient(135deg, #f59e0b, #d97706); }

.plan-card.is-current {
  border-color: #22c55e;
  box-shadow: 0 10px 30px rgba(34,197,94,0.15);
}

.plan-card.is-current .amount { color: #16a34a; }
.plan-card.is-current .plan-icon i { color: #16a34a; }

.plan-cta {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
}

.plan-cta:hover {
  filter: brightness(1.05);
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

.current-card {
  position: relative;
  border: 1px solid #cfe7ff;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  box-shadow: 0 6px 18px rgba(13, 110, 253, 0.08);
  border-radius: 14px;
}

.current-card .accent-bar {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-top-left-radius: 14px;
  border-bottom-left-radius: 14px;
}

.current-card .card-title {
  color: #1f3b73;
  font-weight: 700;
}

.current-card .plan-line {
  color: #2c3e50;
}

.current-card .plan-line .dot {
  margin: 0 6px;
  color: #94a3b8;
}

.status-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0fbea, #f0fff4);
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.btn-ghost-danger {
  color: #dc3545;
  background: transparent;
  border: 1px solid rgba(220, 53, 69, 0.25);
}

.btn-ghost-danger:hover {
  background: rgba(220, 53, 69, 0.06);
  border-color: rgba(220, 53, 69, 0.45);
}

/* Section Header Styling */
.section-header {
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 1rem;
}

.section-title {
  margin-top: 0.5rem;
}

.billing-toggle {
  display: flex;
  gap: 0.25rem;
}

.billing-toggle .btn {
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
  display: block;
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

/* Savings Information Styling */
.savings-info {
  margin-top: 0.5rem;
  text-align: center;
}

.savings-info small {
  font-weight: 500;
}
</style> 