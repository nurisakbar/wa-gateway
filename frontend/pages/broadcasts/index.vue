<template>
  <div class="broadcasts-page">
    <!-- Statistics Cards -->
    <div class="container-fluid py-4" v-if="showStats" style="padding-bottom: 0px !important;">
      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-megaphone text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ broadcastCount }}</div>
              <div class="stat-label text-muted">Total Broadcasts</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ completedCount }}</div>
              <div class="stat-label text-muted">Completed</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-clock text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ scheduledCount }}</div>
              <div class="stat-label text-muted">Scheduled</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-people text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ totalRecipients }}</div>
              <div class="stat-label text-muted">Total Recipients</div>
            </div>
          </div>
        </div>
      </div>

    <!-- Main Content -->
    <div class="container-fluid" style="padding: 0px !important;">
      <!-- Broadcasts Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-megaphone me-2 text-primary"></i>
              Broadcasts
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
              <button
                class="btn btn-primary d-flex align-items-center"
                @click="showNewBroadcastModal = true"
                :disabled="loading"
              >
                <i class="bi bi-plus-circle me-1"></i>
                Add Broadcast
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
                  placeholder="Search broadcasts..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="statusFilter">
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="sending">Sending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div class="col-md-3">
              <select class="form-select" v-model="deviceFilter">
                <option value="">All Devices</option>
                <option v-for="device in deviceStore.getConnectedDevices" :key="device.id" :value="device.id">
                  {{ device.name }}
                </option>
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
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-2">Loading broadcasts...</p>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="filteredBroadcasts.length === 0" class="text-center py-5">
            <i class="bi bi-megaphone text-muted fs-1 mb-3 d-block"></i>
            <h5 class="text-dark mb-2">No broadcasts found</h5>
            <p class="text-muted mb-3">Create your first broadcast to get started</p>
            <button class="btn btn-primary d-inline-flex align-items-center" @click="showNewBroadcastModal = true">
              <i class="bi bi-plus-circle me-1"></i><span>New Broadcast</span>
            </button>
          </div>
          
          <!-- Broadcasts List -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4"><i class="bi bi-broadcast me-2 text-muted"></i>Title</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-phone me-2 text-muted"></i>Device</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-circle me-2 text-muted"></i>Status</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-people me-2 text-muted"></i>Recipients</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-send me-2 text-muted"></i>Sent</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-calendar me-2 text-muted"></i>Created</th>
                  <th class="border-0 py-3 px-4 text-end"><i class="bi bi-gear me-2 text-muted"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="broadcast in filteredBroadcasts" :key="broadcast.id" class="align-middle">
                  <td class="px-4 py-3">
                    <div class="fw-semibold text-dark">{{ broadcast.name }}</div>
                    <small class="text-muted">{{ broadcast.message.substring(0, 50) }}...</small>
                  </td>
                  <td class="px-4 py-3">
                    <span class="badge bg-light text-dark">{{ broadcast.device?.name || 'Unknown' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span 
                      class="badge"
                      :class="{
                        'bg-warning text-dark': broadcast.status === 'draft',
                        'bg-info text-white': broadcast.status === 'sending',
                        'bg-success text-white': broadcast.status === 'completed',
                        'bg-danger text-white': broadcast.status === 'failed'
                      }"
                    >
                      {{ broadcast.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3 fw-semibold text-dark">{{ broadcast.total_contacts }}</td>
                  <td class="px-4 py-3 fw-semibold text-dark">{{ broadcast.sent_count }}</td>
                  <td class="px-4 py-3"><small class="text-muted">{{ new Date(broadcast.created_at).toLocaleDateString() }}</small></td>
                  <td class="px-4 py-3 text-end">
                    <div class="btn-group" role="group">
                      <button class="btn btn-outline-primary btn-sm" title="View Details">
                        <i class="bi bi-eye me-1"></i><span>View</span>
                      </button>
                      <button 
                        v-if="broadcast.status === 'draft'"
                        class="btn btn-outline-success btn-sm" 
                        title="Send Now"
                      >
                        <i class="bi bi-send me-1"></i><span>Send</span>
                      </button>
                      <button 
                        v-if="broadcast.status === 'draft'"
                        class="btn btn-outline-danger btn-sm" 
                        title="Delete"
                      >
                        <i class="bi bi-trash me-1"></i><span>Delete</span>
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

    <!-- New Broadcast Modal -->
    <div
      class="modal fade"
      :class="{ show: showNewBroadcastModal }"
      :style="{ display: showNewBroadcastModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Create New Broadcast</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <form @submit.prevent="createBroadcast">
            <div class="modal-body">
              <div class="mb-3">
                <label for="broadcastTitle" class="form-label">Title *</label>
                <input
                  type="text"
                  class="form-control"
                  id="broadcastTitle"
                  v-model="broadcastForm.title"
                  placeholder="Enter broadcast title"
                  required
                />
              </div>

              <div class="mb-3">
                <label for="broadcastDevice" class="form-label">Device *</label>
                <select
                  class="form-select"
                  id="broadcastDevice"
                  v-model="broadcastForm.device_id"
                  required
                  :disabled="deviceStore.isLoading"
                >
                  <option value="">
                    {{ deviceStore.isLoading ? 'Loading devices...' : 'Select a device' }}
                  </option>
                  <option 
                    v-for="device in deviceStore.getConnectedDevices" 
                    :key="device.id" 
                    :value="device.id"
                  >
                    {{ device.name }} ({{ device.phone_number || 'No number' }})
                  </option>
                  <option v-if="!deviceStore.isLoading && deviceStore.getConnectedDevices.length === 0" value="" disabled>
                    No connected devices found
                  </option>
                </select>
              </div>

              <div class="mb-3">
                <label for="broadcastMessage" class="form-label">Message *</label>
                <textarea
                  class="form-control"
                  id="broadcastMessage"
                  v-model="broadcastForm.message"
                  rows="4"
                  placeholder="Enter your broadcast message..."
                  required
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Recipients *</label>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="allContacts"
                    v-model="broadcastForm.recipient_type"
                    value="all"
                  />
                  <label class="form-check-label" for="allContacts">
                    All Contacts
                  </label>
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="byTag"
                    v-model="broadcastForm.recipient_type"
                    value="tag"
                  />
                  <label class="form-check-label" for="byTag">
                    By Tag
                  </label>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Schedule</label>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="sendNow"
                    v-model="broadcastForm.schedule_type"
                    value="now"
                  />
                  <label class="form-check-label" for="sendNow">
                    Send Now
                  </label>
                </div>
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="radio"
                    id="scheduleLater"
                    v-model="broadcastForm.schedule_type"
                    value="later"
                  />
                  <label class="form-check-label" for="scheduleLater">
                    Schedule for Later
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
              >
                Create Broadcast
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showNewBroadcastModal"
      class="modal-backdrop fade show"
      @click="closeModal"
    >    </div>
  </div>
</div>
</template>

<script setup>
import { useDeviceStore } from '~/stores/devices'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $toast } = useNuxtApp()
const deviceStore = useDeviceStore()

const showNewBroadcastModal = ref(false)
const showStats = ref(true)
const broadcastCount = ref(0)
const completedCount = ref(0)
const scheduledCount = ref(0)
const totalRecipients = ref(0)
const broadcasts = ref([])
const loading = ref(false)

// Search and filter state
const searchQuery = ref('')
const statusFilter = ref('')
const deviceFilter = ref('')

// Filtered broadcasts
const filteredBroadcasts = computed(() => {
  let filtered = broadcasts.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(broadcast => 
      broadcast.name.toLowerCase().includes(query) ||
      broadcast.message.toLowerCase().includes(query)
    )
  }

  // Status filter
  if (statusFilter.value) {
    filtered = filtered.filter(broadcast => broadcast.status === statusFilter.value)
  }

  // Device filter
  if (deviceFilter.value) {
    filtered = filtered.filter(broadcast => broadcast.device_id === deviceFilter.value)
  }

  return filtered
})

const broadcastForm = ref({
  title: '',
  device_id: '',
  message: '',
  recipient_type: 'all',
  schedule_type: 'now'
})

// Fetch broadcasts
const fetchBroadcasts = async () => {
  try {
    loading.value = true
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/broadcasts/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      broadcasts.value = response.data.broadcasts
    }
  } catch (error) {
// console.error('Error fetching broadcasts:', error)
  } finally {
    loading.value = false
  }
}

// Fetch broadcast stats
const fetchBroadcastStats = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/broadcasts/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      const stats = response.data
      broadcastCount.value = stats.total_broadcasts || 0
      completedCount.value = stats.completed_broadcasts || 0
      scheduledCount.value = stats.scheduled_broadcasts || 0
      totalRecipients.value = stats.total_recipients || 0
    }
  } catch (error) {
// console.error('Error fetching broadcast stats:', error)
  }
}

// Create broadcast
const createBroadcast = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value

    const response = await $fetch(`${config.public.apiBase}/broadcasts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        title: broadcastForm.value.title,
        device_id: broadcastForm.value.device_id,
        message: broadcastForm.value.message,
        message_type: 'text',
        scheduled_at: broadcastForm.value.schedule_type === 'later' ? new Date().toISOString() : null
      }
    })
    
    if (response.success) {
      $toast.success('Broadcast created successfully')
      closeModal()
      await refreshData()
    }
  } catch (error) {
// console.error('Error creating broadcast:', error)
    $toast.error('Failed to create broadcast')
  }
}

// Close modal
const closeModal = () => {
  showNewBroadcastModal.value = false
  broadcastForm.value = {
    title: '',
    device_id: '',
    message: '',
    recipient_type: 'all',
    schedule_type: 'now'
  }
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  deviceFilter.value = ''
  toast.info('Filters cleared')
}

// Refresh data
const refreshData = async () => {
  await Promise.all([
    fetchBroadcasts(),
    fetchBroadcastStats()
  ])
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    deviceStore.fetchDevices(),
    refreshData()
  ])
})
</script>

<style scoped>
.broadcasts-page {
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

.page-header {
  position: sticky;
  top: 0;
  /* z-index: 1000; */
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style> 