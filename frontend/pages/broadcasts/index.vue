<template>
  <div class="broadcasts-page">
    <!-- Header -->
    <div class="page-header bg-white border-bottom">
      <div class="container-fluid py-3">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <nav aria-label="breadcrumb" class="mb-1">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                  <NuxtLink to="/dashboard" class="text-decoration-none">
                    <i class="bi bi-house-door me-1"></i>Dashboard
                  </NuxtLink>
                </li>
                <li class="breadcrumb-item active" aria-current="page">Broadcasts</li>
              </ol>
            </nav>
            <h1 class="h3 mb-0 text-dark fw-bold"><i class="bi bi-megaphone me-2 text-primary"></i>Broadcast Management</h1>
            <p class="text-muted mb-0">Create and schedule WhatsApp broadcasts</p>
          </div>
          <div>
            <button class="btn btn-primary d-flex align-items-center" @click="showNewBroadcastModal = true">
              <i class="bi bi-plus-circle me-1"></i><span>New Broadcast</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-primary bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-megaphone text-primary fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ broadcastCount }}</div>
                <div class="stat-label">Total Broadcasts</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-success bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-check-circle text-success fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ completedCount }}</div>
                <div class="stat-label">Completed</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-warning bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-clock text-warning fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ scheduledCount }}</div>
                <div class="stat-label">Scheduled</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-info bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-people text-info fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ totalRecipients }}</div>
                <div class="stat-label">Total Recipients</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Broadcasts Table -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0"><i class="bi bi-list-ul me-2"></i>Broadcast History</h5>
          <button class="btn btn-outline-primary btn-sm d-flex align-items-center" @click="showNewBroadcastModal = true">
            <i class="bi bi-plus-circle me-1"></i><span>New</span>
          </button>
        </div>
        <div class="card-body p-0">
          <div class="text-center py-5">
            <i class="bi bi-megaphone text-muted fs-1 mb-3 d-block"></i>
            <h5 class="text-dark mb-2">No broadcasts found</h5>
            <p class="text-muted mb-3">Create your first broadcast to get started</p>
            <button class="btn btn-primary d-inline-flex align-items-center" @click="showNewBroadcastModal = true">
              <i class="bi bi-plus-circle me-1"></i><span>New Broadcast</span>
            </button>
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
                >
                  <option value="">Select a device</option>
                  <option value="device1">Device 1</option>
                  <option value="device2">Device 2</option>
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
    ></div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $toast } = useNuxtApp()

const showNewBroadcastModal = ref(false)
const broadcastCount = ref(0)
const completedCount = ref(0)
const scheduledCount = ref(0)
const totalRecipients = ref(0)

const broadcastForm = ref({
  title: '',
  device_id: '',
  message: '',
  recipient_type: 'all',
  schedule_type: 'now'
})

// Create broadcast
const createBroadcast = async () => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    $toast.success('Broadcast created successfully')
    closeModal()
  } catch (error) {
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
</script>

<style scoped>
.broadcasts-page {
  min-height: 100vh;
  background-color: var(--light-color);
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