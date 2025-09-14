<template>
  <div class="subscription-plans-page">
    <!-- Main Content -->
    <div class="container-fluid py-4">
      <!-- Header Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding:20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-credit-card me-2 text-primary"></i> 
              Subscription Plans Management
            </h5>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-outline-primary d-flex align-items-center"
                @click="refreshPlans"
                :disabled="loading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                <span>Refresh</span>
              </button>
              <button 
                class="btn btn-primary d-flex align-items-center"
                @click="openCreateModal"
              >
                <i class="bi bi-plus-circle me-1"></i>
                <span>Add Plan</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Filter Section -->
        <div class="filter-section bg-light border-top border-bottom py-3 px-4">
          <div class="row align-items-center">
            <div class="col-md-6 mb-2 mb-md-0">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control border-start-0" 
                  placeholder="Search plans by name..."
                  v-model="searchQuery"
                >
              </div>
            </div>
            <div class="col-md-3 mb-2 mb-md-0">
              <select class="form-select" v-model="filterType">
                <option value="">All Types</option>
                <option value="text_only">Text Only</option>
                <option value="all_features">All Features</option>
              </select>
            </div>
            <div class="col-md-3">
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-outline-secondary btn-sm" 
                  @click="clearFilters"
                  :disabled="!searchQuery && !filterType"
                >
                  <i class="bi bi-x-circle me-1"></i>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-2">Loading subscription plans...</p>
          </div>

          <!-- Plans Table -->
          <div v-else-if="filteredPlans.length > 0" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Currency</th>
                  <th>Billing Cycle</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="plan in filteredPlans" :key="plan.id">
                  <td>
                    <div class="fw-semibold">{{ plan.name }}</div>
                  </td>
                  <td>
                    <div class="text-muted small">{{ plan.description || 'No description' }}</div>
                  </td>
                  <td>
                    <span class="fw-semibold text-primary">
                      {{ formatCurrency(plan.price) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge bg-secondary">{{ plan.currency }}</span>
                  </td>
                  <td>
                    <span class="badge bg-info">{{ plan.billing_cycle }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="getTypeBadgeClass(plan.plan_type)">
                      {{ getTypeLabel(plan.plan_type) }}
                    </span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <button 
                        class="btn btn-sm btn-outline-primary"
                        @click="openEditModal(plan)"
                        title="Edit Plan"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-danger"
                        @click="confirmDelete(plan)"
                        title="Delete Plan"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <i class="bi bi-credit-card text-muted" style="font-size: 3rem;"></i>
            </div>
            <h4 class="text-dark mb-3">No subscription plans found</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Get started by creating your first subscription plan.
            </p>
            <button 
              class="btn btn-primary btn-lg d-flex align-items-center justify-content-center mx-auto"
              @click="openCreateModal"
            >
              <i class="bi bi-plus-circle me-2"></i>
              <span>Create First Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Plan Modal -->
    <div class="modal fade" :class="{ show: showModal, 'd-block': showModal }" tabindex="-1" v-if="showModal">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-credit-card me-2"></i>
              {{ isEditing ? 'Edit' : 'Create' }} Subscription Plan
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
          </div>
          <form @submit.prevent="savePlan">
            <div class="modal-body p-4">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="planName" class="form-label fw-semibold">
                    <i class="bi bi-tag me-1 text-muted"></i>Plan Name *
                  </label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="planName"
                    v-model="form.name"
                    placeholder="e.g., Basic Plan"
                    required
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="planType" class="form-label fw-semibold">
                    <i class="bi bi-grid me-1 text-muted"></i>Plan Type *
                  </label>
                  <select class="form-select" id="planType" v-model="form.plan_type" required>
                    <option value="text_only">Text Only</option>
                    <option value="all_features">All Features</option>
                  </select>
                </div>
              </div>
              
              <div class="mb-3">
                <label for="planDescription" class="form-label fw-semibold">
                  <i class="bi bi-card-text me-1 text-muted"></i>Description
                </label>
                <textarea 
                  class="form-control" 
                  id="planDescription"
                  v-model="form.description"
                  rows="3"
                  placeholder="Describe the plan features..."
                ></textarea>
              </div>

              <div class="row">
                <div class="col-md-4 mb-3">
                  <label for="planPrice" class="form-label fw-semibold">
                    <i class="bi bi-currency-dollar me-1 text-muted"></i>Price *
                  </label>
                  <input 
                    type="number" 
                    class="form-control" 
                    id="planPrice"
                    v-model="form.price"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    required
                  >
                </div>
                <div class="col-md-4 mb-3">
                  <label for="planCurrency" class="form-label fw-semibold">
                    <i class="bi bi-globe me-1 text-muted"></i>Currency *
                  </label>
                  <select class="form-select" id="planCurrency" v-model="form.currency" required>
                    <option value="IDR">IDR (Indonesian Rupiah)</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3">
                  <label for="planBilling" class="form-label fw-semibold">
                    <i class="bi bi-calendar me-1 text-muted"></i>Billing Cycle *
                  </label>
                  <select class="form-select" id="planBilling" v-model="form.billing_cycle" required>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer bg-light border-0 p-4">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal">
                <i class="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i class="bi bi-check-circle me-1"></i>
                {{ isEditing ? 'Update' : 'Create' }} Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" :class="{ show: showDeleteModal, 'd-block': showDeleteModal }" tabindex="-1" v-if="showDeleteModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-danger text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Confirm Delete
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDeleteModal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="mb-3">Are you sure you want to delete this subscription plan?</p>
            <div class="alert alert-warning">
              <strong>{{ planToDelete?.name }}</strong><br>
              <small class="text-muted">{{ planToDelete?.description }}</small>
            </div>
            <p class="text-danger small mb-0">
              <i class="bi bi-exclamation-circle me-1"></i>
              This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer bg-light border-0 p-4">
            <button type="button" class="btn btn-outline-secondary" @click="closeDeleteModal">
              <i class="bi bi-x-circle me-1"></i>
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="deletePlan" :disabled="loading">
              <i class="bi bi-trash me-1"></i>
              Delete Plan
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showModal || showDeleteModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSubscriptionPlanStore } from '~/stores/subscriptionPlans'

// Page metadata
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// Store
const subscriptionPlanStore = useSubscriptionPlanStore()

// Reactive data
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const planToDelete = ref(null)

// Form data
const form = ref({
  name: '',
  description: '',
  price: 0,
  currency: 'IDR',
  billing_cycle: 'monthly',
  plan_type: 'text_only',
  features: {}
})

// Computed
const filteredPlans = computed(() => {
  let plans = subscriptionPlanStore.getPlans

  if (searchQuery.value) {
    plans = plans.filter(plan => 
      plan.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (filterType.value) {
    plans = plans.filter(plan => plan.plan_type === filterType.value)
  }

  return plans
})

// Methods
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

const getTypeLabel = (type) => {
  const labels = {
    'text_only': 'Text Only',
    'all_features': 'All Features'
  }
  return labels[type] || type
}

const getTypeBadgeClass = (type) => {
  const classes = {
    'text_only': 'bg-warning',
    'all_features': 'bg-success'
  }
  return classes[type] || 'bg-secondary'
}

const refreshPlans = async () => {
  loading.value = true
  await subscriptionPlanStore.fetchPlans()
  loading.value = false
}

const clearFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    name: '',
    description: '',
    price: 0,
    currency: 'IDR',
    billing_cycle: 'monthly',
    plan_type: 'text_only',
    features: {}
  }
  showModal.value = true
}

const openEditModal = (plan) => {
  isEditing.value = true
  form.value = { ...plan }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  form.value = {
    name: '',
    description: '',
    price: 0,
    currency: 'IDR',
    billing_cycle: 'monthly',
    plan_type: 'text_only',
    features: {}
  }
}

const savePlan = async () => {
  loading.value = true
  
  try {
    let result
    if (isEditing.value) {
      result = await subscriptionPlanStore.updatePlan(form.value.id, form.value)
    } else {
      result = await subscriptionPlanStore.createPlan(form.value)
    }

    if (result.success) {
      const toast = useToast()
      toast.success(isEditing.value ? 'Plan updated successfully!' : 'Plan created successfully!')
      closeModal()
    } else {
      const toast = useToast()
      toast.error(result.error || 'Failed to save plan')
    }
  } catch (error) {
    const toast = useToast()
    toast.error('An error occurred while saving the plan')
  } finally {
    loading.value = false
  }
}

const confirmDelete = (plan) => {
  planToDelete.value = plan
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  planToDelete.value = null
}

const deletePlan = async () => {
  if (!planToDelete.value) return

  loading.value = true
  
  try {
    const result = await subscriptionPlanStore.deletePlan(planToDelete.value.id)
    
    if (result.success) {
      const toast = useToast()
      toast.success('Plan deleted successfully!')
      closeDeleteModal()
    } else {
      const toast = useToast()
      toast.error(result.error || 'Failed to delete plan')
    }
  } catch (error) {
    const toast = useToast()
    toast.error('An error occurred while deleting the plan')
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await refreshPlans()
})
</script>

<style scoped>
.subscription-plans-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.whatsapp-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: none;
}

.filter-section {
  background-color: #f8f9fa !important;
}

.empty-state {
  padding: 3rem 1rem;
}

.max-width-400 {
  max-width: 400px;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
  background-color: #f8f9fa;
}

.table td {
  vertical-align: middle;
  border-top: 1px solid #dee2e6;
}

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style>
