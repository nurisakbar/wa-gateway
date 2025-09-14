<template>
  <div class="invoices-page">

    <!-- Statistics Cards -->
    <div class="container-fluid py-4" v-if="showStats" style="padding-bottom: 0px !important;">
      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-receipt text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ invoiceStats.total_invoices || 0 }}</div>
              <div class="stat-label text-muted">Total Invoices</div>
            </div>
          </div>
        </div>
      
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ formatCurrency(invoiceStats.total_paid || 0) }}</div>
              <div class="stat-label text-muted">Total Paid</div>
            </div>
          </div>
        </div>
      
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-clock text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ formatCurrency(invoiceStats.total_outstanding || 0) }}</div>
              <div class="stat-label text-muted">Outstanding</div>
            </div>
          </div>
        </div>
      
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-danger bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-calendar-x text-danger fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-danger fw-bold">{{ overdueCount }}</div>
              <div class="stat-label text-muted">Overdue</div>
            </div>
          </div>
        </div>
      </div>

    <!-- Main Content -->
    <div class="container-fluid" style="padding: 0px !important;">
      <!-- Invoices Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-receipt me-2 text-primary"></i>
              Invoices
            </h5>
            <div class="d-flex gap-2">
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
        </div>

        <!-- Search and Filter Section -->
        <div class="filter-section p-3">
          <div class="row g-3 align-items-center">
            <div class="col-md-4">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-start-0"
                  placeholder="Search invoices..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="statusFilter">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="currencyFilter">
                <option value="">All Currencies</option>
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
              </select>
            </div>
            <div class="col-md-2">
              <button class="btn btn-outline-secondary w-100" @click="clearFilters">
                <i class="bi bi-x-circle me-1"></i>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="loading-spinner mx-auto mb-3"></div>
            <h6 class="text-muted mb-0">Loading invoices...</h6>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="filteredInvoices.length === 0" class="text-center py-5">
            <div class="mb-3">
              <i class="bi bi-receipt text-muted" style="font-size: 3rem;"></i>
            </div>
            <h5 class="text-muted mb-2">No invoices found</h5>
            <p class="text-muted mb-0">You don't have any invoices yet.</p>
          </div>
        
          <!-- Invoices List -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4"><i class="bi bi-hash me-2 text-muted"></i>Invoice #</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-calendar me-2 text-muted"></i>Date</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-currency-dollar me-2 text-muted"></i>Amount</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-circle me-2 text-muted"></i>Status</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-calendar-check me-2 text-muted"></i>Due Date</th>
                  <th class="border-0 py-3 px-4 text-end"><i class="bi bi-gear me-2 text-muted"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="invoice in filteredInvoices" :key="invoice.id" class="align-middle">
                  <td class="px-4 py-3">
                    <div class="fw-semibold text-dark">{{ invoice.invoice_number }}</div>
                    <small class="text-muted">{{ invoice.currency }}</small>
                  </td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ formatDate(invoice.created_at) }}</small>
                  </td>
                  <td class="px-4 py-3 fw-semibold text-dark">
                    {{ formatCurrency(invoice.amount) }}
                  </td>
                  <td class="px-4 py-3">
                    <span 
                      class="badge"
                      :class="{
                        'bg-secondary text-white': invoice.status === 'draft',
                        'bg-warning text-dark': invoice.status === 'pending',
                        'bg-success text-white': invoice.status === 'paid',
                        'bg-danger text-white': invoice.status === 'failed',
                        'bg-dark text-white': invoice.status === 'cancelled'
                      }"
                    >
                      {{ invoice.status }}
                    </span>
                    <div v-if="isOverdue(invoice)" class="mt-1">
                      <small class="text-danger">
                        <i class="bi bi-exclamation-triangle me-1"></i>
                        Overdue
                      </small>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ formatDate(invoice.due_date) }}</small>
                  </td>
                  <td class="px-4 py-3 text-end">
                    <div class="btn-group" role="group">
                      <button 
                        class="btn btn-outline-primary btn-sm" 
                        @click="viewInvoice(invoice)"
                        title="View Details"
                      >
                        <i class="bi bi-eye me-1"></i><span>View</span>
                      </button>
                      <button 
                        v-if="invoice.status === 'pending'"
                        class="btn btn-outline-success btn-sm" 
                        @click="payInvoice(invoice)"
                        title="Mark as Paid"
                      >
                        <i class="bi bi-check-circle me-1"></i><span>Pay</span>
                      </button>
                      <button 
                        class="btn btn-outline-info btn-sm" 
                        @click="downloadInvoice(invoice)"
                        title="Download"
                      >
                        <i class="bi bi-download me-1"></i><span>Download</span>
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

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="d-flex justify-content-center mt-4">
      <nav>
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: pagination.page === 1 }">
            <button class="page-link" @click="changePage(pagination.page - 1)" :disabled="pagination.page === 1">
              <i class="bi bi-chevron-left"></i>
            </button>
          </li>
          <li 
            v-for="page in visiblePages" 
            :key="page" 
            class="page-item" 
            :class="{ active: page === pagination.page }"
          >
            <button class="page-link" @click="changePage(page)">{{ page }}</button>
          </li>
          <li class="page-item" :class="{ disabled: pagination.page === pagination.totalPages }">
            <button class="page-link" @click="changePage(pagination.page + 1)" :disabled="pagination.page === pagination.totalPages">
              <i class="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </div>

  <!-- Invoice Detail Modal -->
  <div
    class="modal fade"
    :class="{ show: showInvoiceModal }"
    :style="{ display: showInvoiceModal ? 'block' : 'none' }"
    tabindex="-1"
  >
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">
            <i class="bi bi-receipt me-2"></i>
            Invoice Details
          </h5>
          <button type="button" class="btn-close" @click="showInvoiceModal = false"></button>
        </div>
        <div class="modal-body" v-if="selectedInvoice">
          <div class="row">
            <div class="col-md-6">
              <h6>Invoice Information</h6>
              <table class="table table-sm">
                <tbody>
                  <tr>
                    <td><strong>Invoice #:</strong></td>
                    <td>{{ selectedInvoice.invoice_number }}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>
                      <span 
                        class="badge"
                        :class="{
                          'bg-secondary text-white': selectedInvoice.status === 'draft',
                          'bg-warning text-dark': selectedInvoice.status === 'pending',
                          'bg-success text-white': selectedInvoice.status === 'paid',
                          'bg-danger text-white': selectedInvoice.status === 'failed',
                          'bg-dark text-white': selectedInvoice.status === 'cancelled'
                        }"
                      >
                        {{ selectedInvoice.status }}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td><strong>Amount:</strong></td>
                    <td>{{ formatCurrency(selectedInvoice.amount) }}</td>
                  </tr>
                  <tr>
                    <td><strong>Due Date:</strong></td>
                    <td>{{ formatDate(selectedInvoice.due_date) }}</td>
                  </tr>
                  <tr v-if="selectedInvoice.paid_at">
                    <td><strong>Paid Date:</strong></td>
                    <td>{{ formatDate(selectedInvoice.paid_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="col-md-6">
              <h6>Items</h6>
              <div v-if="selectedInvoice.items && selectedInvoice.items.length > 0">
                <div v-for="item in selectedInvoice.items" :key="item.description" class="border-bottom pb-2 mb-2">
                  <div class="d-flex justify-content-between">
                    <span>{{ item.description }}</span>
                    <span>{{ formatCurrency(item.total) }}</span>
                  </div>
                  <small class="text-muted">Qty: {{ item.quantity }} × {{ formatCurrency(item.unit_price) }}</small>
                </div>
              </div>
              <div v-else class="text-muted">
                No items found
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="showInvoiceModal = false">Close</button>
          <button 
            v-if="selectedInvoice && selectedInvoice.status === 'pending'"
            type="button" 
            class="btn btn-success" 
            @click="payInvoice(selectedInvoice)"
          >
            <i class="bi bi-check-circle me-1"></i>
            Mark as Paid
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            @click="downloadInvoice(selectedInvoice)"
          >
            <i class="bi bi-download me-1"></i>
            Download
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
  middleware: 'auth'
})

const { $toast } = useNuxtApp()

// Reactive data
const loading = ref(false)
const invoices = ref([])
const invoiceStats = ref({})
const showStats = ref(true)
const showInvoiceModal = ref(false)
const selectedInvoice = ref(null)

// Filters
const searchQuery = ref('')
const statusFilter = ref('')
const currencyFilter = ref('')

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0
})

// Computed properties
const filteredInvoices = computed(() => {
  let filtered = invoices.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(invoice => 
      invoice.invoice_number.toLowerCase().includes(query) ||
      invoice.currency.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(invoice => invoice.status === statusFilter.value)
  }

  // Currency filter
  if (currencyFilter.value) {
    filtered = filtered.filter(invoice => invoice.currency === currencyFilter.value)
  }

  return filtered
})

const overdueCount = computed(() => {
  return invoices.value.filter(invoice => isOverdue(invoice)).length
})

const visiblePages = computed(() => {
  const pages = []
  const current = pagination.value.page
  const total = pagination.value.totalPages
  
  for (let i = Math.max(1, current - 2); i <= Math.min(total, current + 2); i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const fetchInvoices = async () => {
  try {
    loading.value = true
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices?page=${pagination.value.page}&limit=${pagination.value.limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      invoices.value = response.data.invoices
      pagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('Error fetching invoices:', error)
    $toast.error('Failed to load invoices')
  } finally {
    loading.value = false
  }
}

const fetchInvoiceStats = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      invoiceStats.value = response.data
    }
  } catch (error) {
    console.error('Error fetching invoice stats:', error)
  }
}

const refreshData = async () => {
  await Promise.all([
    fetchInvoices(),
    fetchInvoiceStats()
  ])
  $toast.success('Data refreshed successfully')
}

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  currencyFilter.value = ''
  $toast.info('Filters cleared')
}

const changePage = (page) => {
  if (page >= 1 && page <= pagination.value.totalPages) {
    pagination.value.page = page
    fetchInvoices()
  }
}

const viewInvoice = (invoice) => {
  selectedInvoice.value = invoice
  showInvoiceModal.value = true
}

const payInvoice = async (invoice) => {
  if (!confirm(`Mark invoice ${invoice.invoice_number} as paid?`)) {
    return
  }
  
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices/${invoice.id}/pay`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        payment_method: 'manual'
      }
    })
    
    if (response.success) {
      $toast.success('Invoice marked as paid successfully')
      await refreshData()
      showInvoiceModal.value = false
    }
  } catch (error) {
    console.error('Error paying invoice:', error)
    $toast.error('Failed to mark invoice as paid')
  }
}

const downloadInvoice = async (invoice) => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/invoices/${invoice.id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      // In a real implementation, this would download a PDF
      // For now, we'll show the invoice data
      $toast.info('Invoice download functionality would be implemented here')

    }
  } catch (error) {
    console.error('Error downloading invoice:', error)
    $toast.error('Failed to download invoice')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount)
}

const isOverdue = (invoice) => {
  if (invoice.status === 'paid') return false
  return new Date() > new Date(invoice.due_date)
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.filter-section {
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
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

/* Broadcasts-style Layout */
.invoices-page {
  min-height: 100vh;
  background-color: var(--light-color);
}

.filter-section {
  background: #f8f9fa !important;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
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
</style>
