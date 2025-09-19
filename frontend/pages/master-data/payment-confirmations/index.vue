<template>
  <div class="payment-confirmations-page">
    <!-- Header -->
    <div class="container-fluid py-4">
      <div class="row align-items-center mb-4">
        <div class="col">
          <h4 class="fw-bold mb-0">
            <i class="bi bi-credit-card me-2 text-primary"></i>
            Payment Confirmations
          </h4>
          <p class="text-muted mb-0">Review and approve payment confirmations from users</p>
        </div>
        <div class="col-auto">
          <button
            class="btn btn-outline-primary d-flex align-items-center"
            @click="refreshData"
            :disabled="loading"
          >
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-clock text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ pendingCount }}</div>
              <div class="stat-label text-muted">Pending Review</div>
            </div>
          </div>
        </div>
      
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ approvedCount }}</div>
              <div class="stat-label text-muted">Approved Today</div>
            </div>
          </div>
        </div>
      
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-danger bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-x-circle text-danger fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-danger fw-bold">{{ rejectedCount }}</div>
              <div class="stat-label text-muted">Rejected Today</div>
            </div>
          </div>
        </div>
      
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-currency-dollar text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ formatCurrency(totalAmount) }}</div>
              <div class="stat-label text-muted">Total Amount</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-list-check me-2 text-primary"></i>
              Pending Confirmations
            </h5>
            <div class="d-flex gap-2">
              <select class="form-select form-select-sm" v-model="statusFilter">
                <option value="">All Status</option>
                <option value="payment_confirmed">Payment Confirmed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="loading-spinner mx-auto mb-3"></div>
            <h6 class="text-muted mb-0">Loading payment confirmations...</h6>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="filteredConfirmations.length === 0" class="text-center py-5">
            <div class="mb-3">
              <i class="bi bi-check-circle text-muted" style="font-size: 3rem;"></i>
            </div>
            <h5 class="text-muted mb-2">No pending confirmations</h5>
            <p class="text-muted mb-0">All payment confirmations have been reviewed.</p>
          </div>
        
          <!-- Confirmations List -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4"><i class="bi bi-hash me-2 text-muted"></i>Invoice #</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-person me-2 text-muted"></i>User</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-currency-dollar me-2 text-muted"></i>Amount</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-calendar me-2 text-muted"></i>Transfer Date</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-bank me-2 text-muted"></i>Bank</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-circle me-2 text-muted"></i>Status</th>
                  <th class="border-0 py-3 px-4 text-end"><i class="bi bi-gear me-2 text-muted"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="confirmation in filteredConfirmations" :key="confirmation.id" class="align-middle">
                  <td class="px-4 py-3">
                    <div class="fw-semibold text-dark">{{ confirmation.invoice_number }}</div>
                    <small class="text-muted">{{ formatDate(confirmation.created_at) }}</small>
                  </td>
                  <td class="px-4 py-3">
                    <div class="fw-semibold text-dark">{{ confirmation.user?.full_name || confirmation.user?.username }}</div>
                    <small class="text-muted">{{ confirmation.user?.email }}</small>
                  </td>
                  <td class="px-4 py-3 fw-semibold text-dark">
                    {{ formatCurrency(confirmation.amount) }}
                  </td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ formatDate(confirmation.payment_confirmation?.transfer_date) }}</small>
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge bg-light text-dark">{{ confirmation.payment_confirmation?.bank_name }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span 
                      class="badge"
                      :class="{
                        'bg-warning text-dark': confirmation.status === 'pending',
                        'bg-info text-white': confirmation.status === 'payment_confirmed'
                      }"
                    >
                      {{ confirmation.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-end">
                    <div class="btn-group" role="group">
                      <button 
                        class="btn btn-outline-primary btn-sm" 
                        @click="viewConfirmation(confirmation)"
                        title="View Details"
                      >
                        <i class="bi bi-eye me-1"></i><span>View</span>
                      </button>
                      <button 
                        v-if="confirmation.status === 'payment_confirmed'"
                        class="btn btn-outline-success btn-sm" 
                        @click="approvePayment(confirmation)"
                        title="Approve Payment"
                      >
                        <i class="bi bi-check-circle me-1"></i><span>Approve</span>
                      </button>
                      <button 
                        v-if="confirmation.status === 'payment_confirmed'"
                        class="btn btn-outline-danger btn-sm" 
                        @click="rejectPayment(confirmation)"
                        title="Reject Payment"
                      >
                        <i class="bi bi-x-circle me-1"></i><span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Detail Modal -->
    <div
      class="modal fade"
      :class="{ show: showDetailModal }"
      :style="{ display: showDetailModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-credit-card me-2"></i>
              Payment Confirmation Details
            </h5>
            <button type="button" class="btn-close" @click="showDetailModal = false"></button>
          </div>
          <div class="modal-body" v-if="selectedConfirmation">
            <div class="row">
              <div class="col-md-6">
                <h6>Invoice Information</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Invoice #:</strong></td>
                      <td>{{ selectedConfirmation.invoice_number }}</td>
                    </tr>
                    <tr>
                      <td><strong>Amount:</strong></td>
                      <td>{{ formatCurrency(selectedConfirmation.amount) }}</td>
                    </tr>
                    <tr>
                      <td><strong>User:</strong></td>
                      <td>{{ selectedConfirmation.user?.full_name || selectedConfirmation.user?.username }}</td>
                    </tr>
                    <tr>
                      <td><strong>Email:</strong></td>
                      <td>{{ selectedConfirmation.user?.email }}</td>
                    </tr>
                    <tr>
                      <td><strong>Phone:</strong></td>
                      <td>{{ selectedConfirmation.user?.phone || 'N/A' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="col-md-6">
                <h6>Payment Details</h6>
                <table class="table table-sm">
                  <tbody>
                    <tr>
                      <td><strong>Transfer Amount:</strong></td>
                      <td>{{ formatCurrency(selectedConfirmation.payment_confirmation?.transfer_amount) }}</td>
                    </tr>
                    <tr>
                      <td><strong>Transfer Date:</strong></td>
                      <td>{{ formatDate(selectedConfirmation.payment_confirmation?.transfer_date) }}</td>
                    </tr>
                    <tr>
                      <td><strong>Bank:</strong></td>
                      <td>{{ selectedConfirmation.payment_confirmation?.bank_name }}</td>
                    </tr>
                    <tr>
                      <td><strong>Payment Proof:</strong></td>
                      <td>
                        <a v-if="selectedConfirmation.payment_confirmation?.payment_proof" 
                           :href="selectedConfirmation.payment_confirmation.payment_proof" 
                           target="_blank" 
                           class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-eye me-1"></i>View Proof
                        </a>
                        <span v-else class="text-muted">No proof provided</span>
                      </td>
                    </tr>
                    <tr v-if="selectedConfirmation.payment_confirmation?.notes">
                      <td><strong>Notes:</strong></td>
                      <td>{{ selectedConfirmation.payment_confirmation.notes }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            <!-- Subscription Plan Info -->
            <div v-if="selectedConfirmation.subscription?.plan" class="mt-4">
              <h6>Subscription Plan</h6>
              <div class="alert alert-info">
                <strong>{{ selectedConfirmation.subscription.plan.name }}</strong> - 
                {{ formatCurrency(selectedConfirmation.subscription.plan.price) }}/{{ selectedConfirmation.subscription.plan.billing_cycle }}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDetailModal = false">Close</button>
            <button 
              v-if="selectedConfirmation && selectedConfirmation.status === 'payment_confirmed'"
              type="button" 
              class="btn btn-success" 
              @click="approvePayment(selectedConfirmation)"
            >
              <i class="bi bi-check-circle me-1"></i>
              Approve Payment
            </button>
            <button 
              v-if="selectedConfirmation && selectedConfirmation.status === 'payment_confirmed'"
              type="button" 
              class="btn btn-danger" 
              @click="rejectPayment(selectedConfirmation)"
            >
              <i class="bi bi-x-circle me-1"></i>
              Reject Payment
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reject Payment Modal -->
    <div
      class="modal fade"
      :class="{ show: showRejectModal }"
      :style="{ display: showRejectModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title">
              <i class="bi bi-x-circle me-2"></i>
              Reject Payment
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="showRejectModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Warning:</strong> This action will reject the payment confirmation and return the invoice to pending status.
            </div>
            <div class="mb-3">
              <label for="rejectReason" class="form-label">Reason for Rejection <span class="text-danger">*</span></label>
              <textarea 
                class="form-control" 
                id="rejectReason"
                v-model="rejectReason"
                rows="3"
                placeholder="Please provide a reason for rejecting this payment confirmation..."
                required
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showRejectModal = false">Cancel</button>
            <button 
              type="button" 
              class="btn btn-danger" 
              @click="confirmRejectPayment"
              :disabled="!rejectReason.trim()"
            >
              <i class="bi bi-x-circle me-1"></i>
              Reject Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'admin'
})

const { $toast } = useNuxtApp()

// Reactive data
const loading = ref(false)
const confirmations = ref([])
const showDetailModal = ref(false)
const showRejectModal = ref(false)
const selectedConfirmation = ref(null)
const rejectReason = ref('')
const statusFilter = ref('')

// Computed properties
const filteredConfirmations = computed(() => {
  let filtered = confirmations.value

  if (statusFilter.value) {
    filtered = filtered.filter(confirmation => confirmation.status === statusFilter.value)
  }

  return filtered
})

const pendingCount = computed(() => {
  return confirmations.value.filter(c => c.status === 'payment_confirmed').length
})

const approvedCount = computed(() => {
  const today = new Date().toDateString()
  return confirmations.value.filter(c => 
    c.status === 'paid' && 
    c.admin_confirmed_at && 
    new Date(c.admin_confirmed_at).toDateString() === today
  ).length
})

const rejectedCount = computed(() => {
  const today = new Date().toDateString()
  return confirmations.value.filter(c => 
    c.payment_confirmation?.rejected_at && 
    new Date(c.payment_confirmation.rejected_at).toDateString() === today
  ).length
})

const totalAmount = computed(() => {
  return confirmations.value.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0)
})

// Methods
const fetchConfirmations = async () => {
  try {
    loading.value = true
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices/admin/pending-confirmations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      confirmations.value = response.data.invoices
    }
  } catch (error) {
    console.error('Error fetching confirmations:', error)
    $toast.error('Failed to load payment confirmations')
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await fetchConfirmations()
  $toast.success('Data refreshed successfully')
}

const viewConfirmation = (confirmation) => {
  selectedConfirmation.value = confirmation
  showDetailModal.value = true
}

const approvePayment = async (confirmation) => {
  if (!confirm(`Approve payment for invoice ${confirmation.invoice_number}?`)) {
    return
  }
  
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices/${confirmation.id}/approve-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      $toast.success('Payment approved successfully')
      await refreshData()
      showDetailModal.value = false
    }
  } catch (error) {
    console.error('Error approving payment:', error)
    $toast.error('Failed to approve payment')
  }
}

const rejectPayment = (confirmation) => {
  selectedConfirmation.value = confirmation
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmRejectPayment = async () => {
  if (!selectedConfirmation.value) return
  
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices/${selectedConfirmation.value.id}/reject-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        reason: rejectReason.value
      }
    })
    
    if (response.success) {
      $toast.success('Payment rejected successfully')
      await refreshData()
      showRejectModal.value = false
      showDetailModal.value = false
    }
  } catch (error) {
    console.error('Error rejecting payment:', error)
    $toast.error('Failed to reject payment')
  }
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

// Lifecycle
onMounted(() => {
  fetchConfirmations()
})
</script>

<style scoped>
.payment-confirmations-page {
  min-height: 100vh;
  background-color: var(--light-color);
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.stat-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal.show {
  background-color: rgba(0, 0, 0, 0.5);
}
</style>

