<template>
  <div class="devices-page">
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
                <div class="stat-number">{{ deviceStore.getDevices.filter(d => d && d.status === 'connecting').length }}</div>
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
                <div class="stat-number">{{ deviceStore.getDevices.filter(d => d && d.status === 'disconnected').length }}</div>
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
              class="btn btn-primary btn-sm d-flex align-items-center"
              @click="refreshDevices"
              :disabled="deviceStore.isLoading"
            >
              <i class="bi bi-arrow-clockwise me-1"></i>
              <span>Refresh</span>
            </button>
            <button
              class="btn btn-success btn-sm d-flex align-items-center"
              @click="showAddModal = true"
              :disabled="deviceStore.isLoading"
            >
              <i class="bi bi-plus-circle me-1"></i>
              <span>Add Device</span>
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
            <button class="btn btn-primary d-flex align-items-center" @click="showAddModal = true">
              <i class="bi bi-plus-circle me-1"></i>
              <span>Add Device</span>
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
                      <div class="whatsapp-status me-3" :class="device && device.status ? device.status : 'disconnected'"></div>
                      <div>
                        <h6 class="mb-1">{{ device && device.name ? device.name : 'Unknown Device' }}</h6>
                        <small class="text-muted">{{ device && device.description ? device.description : 'No description' }}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="text-muted">{{ device && device.phone_number ? device.phone_number : 'Not set' }}</span>
                  </td>
                  <td>
                    <span class="badge fw-medium" :class="getStatusBadgeClass(device && device.status ? device.status : 'disconnected')">
                      <i v-if="device && device.status === 'connected'" class="bi bi-check-circle me-1"></i>
                      <i v-else-if="device && device.status === 'connecting'" class="bi bi-arrow-clockwise me-1"></i>
                      <i v-else-if="device && device.status === 'disconnected'" class="bi bi-x-circle me-1"></i>
                      <i v-else-if="device && device.status === 'error'" class="bi bi-exclamation-triangle me-1"></i>
                      {{ getStatusText(device && device.status ? device.status : 'disconnected') }}
                    </span>
                  </td>
                  <td>
                    <small class="text-muted">{{ device && device.last_activity ? formatDate(device.last_activity) : 'Never' }}</small>
                  </td>
                  <td>
                    <div class="d-flex gap-2">
                      <!-- Connect Button -->
                      <button
                        v-if="device && device.status === 'disconnected'"
                        class="btn btn-success btn-sm d-flex align-items-center"
                        @click="connectDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Connect WhatsApp Device"
                      >
                        <div v-if="deviceStore.isLoading" class="spinner-border spinner-border-sm me-1" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <i v-else class="bi bi-wifi me-1"></i>
                        <span>{{ deviceStore.isLoading ? 'Connecting...' : 'Connect' }}</span>
                      </button>
                      
                      <!-- Disconnect Button -->
                      <button
                        v-if="device && device.status === 'connected'"
                        class="btn btn-warning btn-sm d-flex align-items-center"
                        @click="disconnectDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Disconnect WhatsApp Device"
                      >
                        <i class="bi bi-wifi-off me-1"></i>
                        <span>Disconnect</span>
                      </button>
                      
                      <!-- Connecting Status -->
                      <button
                        v-if="device && device.status === 'connecting'"
                        class="btn btn-info btn-sm d-flex align-items-center"
                        disabled
                        title="Connecting to WhatsApp..."
                      >
                        <div class="spinner-border spinner-border-sm me-1" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                        <span>Connecting...</span>
                      </button>
                      
                      <!-- Edit Button -->
                      <button
                        class="btn btn-primary btn-sm d-flex align-items-center"
                        @click="editDevice(device)"
                        title="Edit Device Settings"
                      >
                        <i class="bi bi-pencil-square me-1"></i>
                        <span>Edit</span>
                      </button>
                      
                      <!-- Delete Button -->
                      <button
                        class="btn btn-danger btn-sm d-flex align-items-center"
                        @click="deleteDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Delete Device"
                      >
                        <i class="bi bi-trash me-1"></i>
                        <span>Delete</span>
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
                class="btn btn-primary d-flex align-items-center"
                :disabled="deviceStore.isLoading"
              >
                <div v-if="deviceStore.isLoading" class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <i v-else class="bi bi-check-circle me-1"></i>
                <span>{{ showEditModal ? 'Update Device' : 'Add Device' }}</span>
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

<script setup>
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
  console.log('Loading devices on mount...')
  try {
    const result = await deviceStore.fetchDevices()
    console.log('Fetch devices result:', result)
    console.log('Current devices in store:', deviceStore.getDevices)
  } catch (error) {
    console.error('Error loading devices:', error)
  }
})

// Refresh devices
const refreshDevices = async () => {
  await deviceStore.fetchDevices()
  $toast.success('Devices refreshed')
}

// Connect device
const connectDevice = async (device) => {
  console.log('=== CONNECT DEVICE CALLED ===')
  console.log('Device:', device)
  console.log('Device ID:', device?.id)
  console.log('DeviceStore loading:', deviceStore.isLoading)
  
  // Prevent multiple clicks
  if (deviceStore.isLoading) {
    console.log('Device connection already in progress')
    return
  }
  
  try {
    console.log('Starting device connection for:', device.id)
    $toast.info('Initializing device connection...')
    
    console.log('Calling deviceStore.connectDevice...')
    const result = await deviceStore.connectDevice(device.id)
    console.log('Connect device result:', result)
    
    if (result.success) {
      if (result.qrCode) {
        console.log('QR code received directly')
        qrCode.value = result.qrCode
        showQRModal.value = true
        $toast.success('QR code generated successfully')
      } else {
        console.log('No QR code, starting polling...')
        $toast.info(result.message || 'Connection initiated, QR code will be available shortly')
        // Poll for QR code
        await pollForQRCode(device.id)
      }
    } else {
      console.log('Connect device failed:', result.error)
      $toast.error(result.error || 'Failed to connect device')
    }
  } catch (error) {
    console.error('Connect device error:', error)
    $toast.error('Failed to connect device')
  }
}

// Poll for QR code
let pollingInProgress = false

const pollForQRCode = async (deviceId) => {
  // Prevent multiple polling
  if (pollingInProgress) {
    console.log('QR polling already in progress')
    return
  }
  
  pollingInProgress = true
  const maxAttempts = 15 // Increase attempts
  let attempts = 0
  
  $toast.info('Waiting for QR code generation...')
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      $toast.error('QR code not available after multiple attempts. Please try connecting again.')
      pollingInProgress = false
      return
    }
    
    try {
      console.log(`Polling for QR code, attempt ${attempts + 1}/${maxAttempts}`)
      const config = useRuntimeConfig()
      const token = localStorage.getItem('auth_token')
      
      let response
      try {
        const { $api } = useNuxtApp()
        response = await $api.get(`/devices/${deviceId}/qr`)
      } catch (apiError) {
        response = await $fetch(`${config.public.apiBase}/devices/${deviceId}/qr`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
      }
      
      console.log('QR response:', response.data)
      
      // Handle different response scenarios
      if (response.data.success && response.data.data.qr_code) {
        // QR code is available
        qrCode.value = response.data.data.qr_code
        showQRModal.value = true
        $toast.success('QR code generated successfully')
        pollingInProgress = false
        return
      } else if (response.status === 202) {
        // QR code is being generated, retry after suggested delay
        console.log(`QR code being generated, retry after ${response.data.data.retry_after || 3} seconds`)
        if (attempts === 5) {
          $toast.info('QR code is being generated, please wait...')
        } else if (attempts === 10) {
          $toast.warn('QR code generation taking longer than expected...')
        }
        attempts++
        setTimeout(poll, (response.data.data.retry_after || 3) * 1000)
        return
      } else if (response.status === 400 && response.data.data?.connected) {
        // Device is already connected
        $toast.success('Device is already connected!')
        pollingInProgress = false
        return
      } else if (response.status === 400 && response.data.data?.needs_connection_init) {
        // Need to initialize connection first
        $toast.error('Please click Connect button first to initialize the device')
        pollingInProgress = false
        return
      } else {
        // QR code not ready yet
        console.log(`QR code not ready yet, attempt ${attempts + 1}/${maxAttempts}`)
        if (attempts === 5) {
          $toast.info('Still waiting for QR code...')
        } else if (attempts === 10) {
          $toast.warn('QR code taking longer than expected...')
        }
      }
      
      attempts++
      setTimeout(poll, 3000) // Poll every 3 seconds (increased interval)
    } catch (error) {
      console.error('Poll QR code error:', error)
      attempts++
      setTimeout(poll, 3000)
    }
  }
  
  poll()
}

// Disconnect device
const disconnectDevice = async (device) => {
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
const editDevice = (device) => {
  if (!device || !device.id) {
    $toast.error('Invalid device data')
    return
  }
  
  selectedDevice.value = device
  deviceForm.value = {
    name: device.name || '',
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
    if (showEditModal.value && selectedDevice.value && selectedDevice.value.id) {
      // Update device
      const result = await deviceStore.updateDevice(selectedDevice.value.id, deviceForm.value)
      if (result.success) {
        $toast.success('Device updated successfully')
        closeModal()
      } else {
        $toast.error(result.error || 'Failed to update device')
      }
    } else if (showAddModal.value) {
      // Create device
      const result = await deviceStore.createDevice(deviceForm.value)
      if (result.success) {
        $toast.success('Device created successfully')
        closeModal()
      } else {
        $toast.error(result.error || 'Failed to create device')
      }
    } else {
      $toast.error('Invalid operation')
    }
  } catch (error) {
    console.error('Save device error:', error)
    $toast.error('Failed to save device')
  }
}

// Delete device
const deleteDevice = async (device) => {
  if (!device || !device.id) {
    $toast.error('Invalid device data')
    return
  }
  
  const deviceName = device.name || 'Unknown Device'
  if (confirm(`Are you sure you want to delete "${deviceName}"?`)) {
    try {
      const result = await deviceStore.deleteDevice(device.id)
      if (result.success) {
        $toast.success('Device deleted successfully')
      } else {
        $toast.error(result.error || 'Failed to delete device')
      }
    } catch (error) {
      console.error('Delete device error:', error)
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
const getStatusBadgeClass = (status) => {
  const classes = {
    connected: 'bg-success text-white',
    connecting: 'bg-warning text-dark',
    disconnected: 'bg-secondary text-white',
    error: 'bg-danger text-white'
  }
  return classes[status] || 'bg-secondary text-white'
}

const getStatusText = (status) => {
  const texts = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Error'
  }
  return texts[status] || status
}

const formatDate = (dateString) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

const isValidPhoneNumber = (phone) => {
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
}

/* Button improvements */
.btn {
  transition: all 0.2s ease-in-out;
  font-weight: 500;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn:active {
  transform: translateY(0);
}

/* Status badge improvements */
.badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-weight: 500;
  text-transform: capitalize;
}

/* Table improvements */
.table th {
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
  padding: 1rem 0.75rem;
}

/* Device status indicator */
.whatsapp-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.whatsapp-status.connected {
  background-color: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.whatsapp-status.connecting {
  background-color: #ffc107;
  box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.2);
  animation: pulse 1.5s infinite;
}

.whatsapp-status.disconnected {
  background-color: #6c757d;
  box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.2);
}

.whatsapp-status.error {
  background-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.2);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.whatsapp-card {
  background: var(--white-color);
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