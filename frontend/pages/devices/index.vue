<template>
  <div class="devices-page">
    <!-- Header -->
    <div class="page-header bg-white shadow-sm border-bottom">
      <div class="container-fluid">
        <div class="row align-items-center py-3">
          <div class="col">
            <h1 class="h3 mb-0 text-primary">
              <i class="bi bi-phone me-2"></i>
              Device Management
            </h1>
          </div>
          <div class="col-auto">
            <button
              class="btn btn-primary"
              @click="showAddModal = true"
              :disabled="deviceStore.isLoading"
            >
              <i class="bi bi-plus me-1"></i>
              Add Device
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
                <i class="bi bi-phone text-primary fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ deviceStore.getDeviceCount }}</div>
                <div class="stat-label">Total Devices</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-success bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-wifi text-success fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ deviceStore.getConnectedCount }}</div>
                <div class="stat-label">Connected</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-warning bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-exclamation-triangle text-warning fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ deviceStore.getDevices.filter(d => d.status === 'connecting').length }}</div>
                <div class="stat-label">Connecting</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-danger bg-opacity-10 rounded p-3 me-3">
                <i class="bi bi-x-circle text-danger fs-4"></i>
              </div>
              <div>
                <div class="stat-number">{{ deviceStore.getDevices.filter(d => d.status === 'disconnected').length }}</div>
                <div class="stat-label">Disconnected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Devices Table -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">
            <i class="bi bi-list-ul me-2"></i>
            Your Devices
          </h5>
          <div class="d-flex gap-2">
            <button
              class="btn btn-outline-primary btn-sm"
              @click="refreshDevices"
              :disabled="deviceStore.isLoading"
            >
              <i class="bi bi-arrow-clockwise me-1"></i>
              Refresh
            </button>
          </div>
        </div>
        <div class="card-body p-0">
          <div v-if="deviceStore.isLoading" class="text-center py-4">
            <div class="loading-spinner mx-auto mb-2"></div>
            <p class="text-muted">Loading devices...</p>
          </div>
          <div v-else-if="deviceStore.getDevices.length === 0" class="text-center py-4">
            <i class="bi bi-phone text-muted fs-1 mb-3"></i>
            <h6 class="text-muted">No devices found</h6>
            <p class="text-muted">Add your first WhatsApp device to get started</p>
            <button class="btn btn-primary" @click="showAddModal = true">
              <i class="bi bi-plus me-1"></i>
              Add Device
            </button>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>Device</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Last Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in deviceStore.getDevices" :key="device.id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="whatsapp-status me-3" :class="device.status"></div>
                      <div>
                        <h6 class="mb-1">{{ device.name }}</h6>
                        <small class="text-muted">{{ device.description || 'No description' }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="text-muted">{{ device.phone_number || 'Not set' }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(device.status)">
                      {{ device.status }}
                    </span>
                  </td>
                  <td>
                    <small class="text-muted">{{ formatDate(device.last_activity) }}</small>
                  </td>
                  <td>
                    <div class="btn-group btn-group-sm">
                      <button
                        v-if="device.status === 'disconnected'"
                        class="btn btn-outline-success"
                        @click="connectDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Connect Device"
                      >
                        <i class="bi bi-wifi"></i>
                      </button>
                      <button
                        v-if="device.status === 'connected'"
                        class="btn btn-outline-warning"
                        @click="disconnectDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Disconnect Device"
                      >
                        <i class="bi bi-wifi-off"></i>
                      </button>
                      <button
                        class="btn btn-outline-primary"
                        @click="editDevice(device)"
                        title="Edit Device"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button
                        class="btn btn-outline-danger"
                        @click="deleteDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Delete Device"
                      >
                        <i class="bi bi-trash"></i>
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

    <!-- Add/Edit Device Modal -->
    <div
      class="modal fade"
      :class="{ show: showAddModal || showEditModal }"
      :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ showEditModal ? 'Edit Device' : 'Add New Device' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <form @submit.prevent="saveDevice">
            <div class="modal-body">
              <div class="mb-3">
                <label for="deviceName" class="form-label">Device Name *</label>
                <input
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.name }"
                  id="deviceName"
                  v-model="deviceForm.name"
                  placeholder="Enter device name"
                  required
                />
                <div class="invalid-feedback" v-if="errors.name">
                  {{ errors.name }}
                </div>
              </div>

              <div class="mb-3">
                <label for="deviceDescription" class="form-label">Description</label>
                <textarea
                  class="form-control"
                  id="deviceDescription"
                  v-model="deviceForm.description"
                  rows="3"
                  placeholder="Enter device description"
                ></textarea>
              </div>

              <div class="mb-3">
                <label for="devicePhone" class="form-label">Phone Number</label>
                <input
                  type="tel"
                  class="form-control"
                  :class="{ 'is-invalid': errors.phone_number }"
                  id="devicePhone"
                  v-model="deviceForm.phone_number"
                  placeholder="+1234567890"
                />
                <div class="invalid-feedback" v-if="errors.phone_number">
                  {{ errors.phone_number }}
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
                :disabled="deviceStore.isLoading"
              >
                <span v-if="deviceStore.isLoading" class="loading-spinner me-2"></span>
                {{ showEditModal ? 'Update Device' : 'Add Device' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div
      class="modal fade"
      :class="{ show: showQRModal }"
      :style="{ display: showQRModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Connect Device</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeQRModal"
            ></button>
          </div>
          <div class="modal-body text-center">
            <div v-if="qrCode" class="qr-container">
              <img :src="qrCode" alt="QR Code" class="qr-code" />
              <p class="mt-3 text-muted">
                Scan this QR code with WhatsApp to connect your device
              </p>
            </div>
            <div v-else class="text-center py-4">
              <div class="loading-spinner mx-auto mb-2"></div>
              <p class="text-muted">Generating QR code...</p>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeQRModal"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showAddModal || showEditModal || showQRModal"
      class="modal-backdrop fade show"
      @click="closeModal"
    ></div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const deviceStore = useDeviceStore()
const { $toast } = useNuxtApp()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showQRModal = ref(false)
const qrCode = ref('')
const selectedDevice = ref(null)

const deviceForm = ref({
  name: '',
  description: '',
  phone_number: ''
})

const errors = ref({
  name: '',
  phone_number: ''
})

// Load devices on mount
onMounted(async () => {
  await deviceStore.fetchDevices()
})

// Refresh devices
const refreshDevices = async () => {
  await deviceStore.fetchDevices()
  $toast.success('Devices refreshed')
}

// Connect device
const connectDevice = async (device: any) => {
  try {
    const result = await deviceStore.connectDevice(device.id)
    if (result.success) {
      qrCode.value = result.qrCode
      showQRModal.value = true
      $toast.success('QR code generated successfully')
    } else {
      $toast.error(result.error || 'Failed to connect device')
    }
  } catch (error) {
    $toast.error('Failed to connect device')
  }
}

// Disconnect device
const disconnectDevice = async (device: any) => {
  try {
    const result = await deviceStore.disconnectDevice(device.id)
    if (result.success) {
      $toast.success('Device disconnected successfully')
    } else {
      $toast.error(result.error || 'Failed to disconnect device')
    }
  } catch (error) {
    $toast.error('Failed to disconnect device')
  }
}

// Edit device
const editDevice = (device: any) => {
  selectedDevice.value = device
  deviceForm.value = {
    name: device.name,
    description: device.description || '',
    phone_number: device.phone_number || ''
  }
  showEditModal.value = true
}

// Save device
const saveDevice = async () => {
  // Reset errors
  errors.value = { name: '', phone_number: '' }

  // Validate form
  if (!deviceForm.value.name.trim()) {
    errors.value.name = 'Device name is required'
    return
  }

  if (deviceForm.value.phone_number && !isValidPhoneNumber(deviceForm.value.phone_number)) {
    errors.value.phone_number = 'Invalid phone number format'
    return
  }

  try {
    if (showEditModal.value && selectedDevice.value) {
      // Update device
      const result = await deviceStore.updateDevice(selectedDevice.value.id, deviceForm.value)
      if (result.success) {
        $toast.success('Device updated successfully')
        closeModal()
      } else {
        $toast.error(result.error || 'Failed to update device')
      }
    } else {
      // Create device
      const result = await deviceStore.createDevice(deviceForm.value)
      if (result.success) {
        $toast.success('Device created successfully')
        closeModal()
      } else {
        $toast.error(result.error || 'Failed to create device')
      }
    }
  } catch (error) {
    $toast.error('Failed to save device')
  }
}

// Delete device
const deleteDevice = async (device: any) => {
  if (confirm(`Are you sure you want to delete "${device.name}"?`)) {
    try {
      const result = await deviceStore.deleteDevice(device.id)
      if (result.success) {
        $toast.success('Device deleted successfully')
      } else {
        $toast.error(result.error || 'Failed to delete device')
      }
    } catch (error) {
      $toast.error('Failed to delete device')
    }
  }
}

// Close modal
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  selectedDevice.value = null
  deviceForm.value = { name: '', description: '', phone_number: '' }
  errors.value = { name: '', phone_number: '' }
}

// Close QR modal
const closeQRModal = () => {
  showQRModal.value = false
  qrCode.value = ''
}

// Utility functions
const getStatusBadgeClass = (status: string) => {
  const classes = {
    connected: 'bg-success',
    connecting: 'bg-warning',
    disconnected: 'bg-secondary',
    error: 'bg-danger'
  }
  return classes[status as keyof typeof classes] || 'bg-secondary'
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

const isValidPhoneNumber = (phone: string) => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}
</script>

<style scoped>
.devices-page {
  min-height: 100vh;
  background-color: var(--light-color);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.stat-card {
  background: var(--white-color);
  padding: 1.5rem;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--box-shadow);
  border-left: 4px solid var(--primary-color);
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #25D366;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
}

.qr-code {
  max-width: 200px;
  width: 100%;
  height: auto;
}

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style> 