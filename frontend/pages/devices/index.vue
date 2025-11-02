<template>
  <div class="devices-page">

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <!-- Statistics Cards -->
      <div class="row mb-4">
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card h-100">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
                <i class="bi bi-phone text-primary fs-4"></i>
              </div>
              <div>
                <div class="stat-number text-primary fw-bold">{{ deviceStore.getDeviceCount }}</div>
                <div class="stat-label text-muted">Total Devices</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card h-100">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
                <i class="bi bi-wifi text-success fs-4"></i>
              </div>
              <div>
                <div class="stat-number text-success fw-bold">{{ deviceStore.getConnectedCount }}</div>
                <div class="stat-label text-muted">Connected</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card h-100">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
                <i class="bi bi-arrow-clockwise text-warning fs-4"></i>
              </div>
              <div>
                <div class="stat-number text-warning fw-bold">{{ deviceStore.getDevices.filter(d => d && d.status === 'connecting').length }}</div>
                <div class="stat-label text-muted">Connecting</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-lg-3 col-md-6 mb-3">
          <div class="stat-card h-100">
            <div class="d-flex align-items-center">
              <div class="stat-icon bg-secondary bg-opacity-10 rounded-3 p-3 me-3">
                <i class="bi bi-wifi-off text-secondary fs-4"></i>
              </div>
              <div>
                <div class="stat-number text-secondary fw-bold">{{ deviceStore.getDevices.filter(d => d && d.status === 'disconnected').length }}</div>
                <div class="stat-label text-muted">Disconnected</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Devices Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-list-ul me-2 text-primary"></i>
              Devices
            </h5>
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-primary d-flex align-items-center"
                @click="refreshDevices"
                :disabled="deviceStore.isLoading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                <span>Refresh</span>
              </button>
              <button
                class="btn btn-primary d-flex align-items-center"
                @click="showAddModal = true"
                :disabled="deviceStore.isLoading"
              >
                <i class="bi bi-plus-circle me-1"></i>
                <span>Add Device</span>
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
                  placeholder="Search devices by name or phone number..."
                  v-model="searchQuery"
                />
              </div>
            </div>
            <div class="col-md-3 mb-2 mb-md-0">
              <select class="form-select" v-model="statusFilter">
                <option value="">All Status</option>
                <option value="connected">Connected</option>
                <option value="connecting">Connecting</option>
                <option value="disconnected">Disconnected</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div class="col-md-3">
              <div class="d-flex gap-2">
                <button
                  class="btn btn-outline-secondary btn-sm"
                  @click="clearFilters"
                  :disabled="!hasActiveFilters"
                >
                  <i class="bi bi-x-circle me-1"></i>
                  Clear
                </button>
                <span class="badge bg-primary align-self-center" v-if="filteredDevices.length !== deviceStore.getDevices.length">
                  {{ filteredDevices.length }} of {{ deviceStore.getDevices.length }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="deviceStore.isLoading" class="text-center py-5">
            <div class="loading-spinner mx-auto mb-3"></div>
            <h6 class="text-muted mb-1">Loading devices...</h6>
            <p class="text-muted small">Please wait while we fetch your devices</p>
          </div>
          
          <!-- No Devices State -->
          <div v-else-if="deviceStore.getDevices.length === 0" class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <div class="phone-icon-container">
                <i class="bi bi-phone text-muted"></i>
              </div>
            </div>
            <h4 class="text-dark mb-3">No devices found</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Get started by adding your first WhatsApp device. You can connect multiple devices to manage different WhatsApp accounts.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button class="btn btn-primary btn-lg d-flex align-items-center justify-content-center" @click="showAddModal = true">
                <i class="bi bi-plus-circle me-2"></i>
                <span>Add Your First Device</span>
              </button>
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center" @click="refreshDevices">
                <i class="bi bi-arrow-clockwise me-2"></i>
                <span>Refresh</span>
              </button>
            </div>
            <div class="mt-4">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Need help? Check our 
                <a href="#" class="text-decoration-none">setup guide</a>
              </small>
            </div>
          </div>
          
          <!-- No Filtered Results State -->
          <div v-else-if="filteredDevices.length === 0" class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <div class="phone-icon-container">
                <i class="bi bi-search text-muted"></i>
              </div>
            </div>
            <h4 class="text-dark mb-3">No devices match your filters</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Try adjusting your search criteria or clear the filters to see all devices.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button class="btn btn-outline-primary d-flex align-items-center justify-content-center" @click="clearFilters">
                <i class="bi bi-x-circle me-2"></i>
                <span>Clear Filters</span>
              </button>
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center" @click="refreshDevices">
                <i class="bi bi-arrow-clockwise me-2"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <!-- Devices Table -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-phone me-2 text-muted"></i>Device
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-telephone me-2 text-muted"></i>Phone Number
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-circle-fill me-2 text-muted"></i>Status
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-clock me-2 text-muted"></i>Last Activity
                  </th>
                  <th class="border-0 py-3 px-4 text-end">
                    <i class="bi bi-gear me-2 text-muted"></i>Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in filteredDevices" :key="device.id" class="device-row">
                  <td class="px-4 py-3">
                    <div class="d-flex align-items-center">
                      <div class="device-status-indicator me-3" :class="device && device.status ? device.status : 'disconnected'"></div>
                      <div>
                        <h6 class="mb-1 fw-semibold text-dark">{{ device && device.name ? device.name : 'Unknown Device' }}</h6>
                        <small class="text-muted">{{ device && device.description ? device.description : 'No description' }}</small>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-muted">{{ device && device.phone_number ? device.phone_number : 'Not set' }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="status-badge fw-medium" :class="getStatusBadgeClass(device && device.status ? device.status : 'disconnected')">
                      <i v-if="device && device.status === 'connected'" class="bi bi-check-circle me-1"></i>
                      <i v-else-if="device && device.status === 'connecting'" class="bi bi-arrow-clockwise me-1"></i>
                      <i v-else-if="device && device.status === 'disconnected'" class="bi bi-x-circle me-1"></i>
                      <i v-else-if="device && device.status === 'error'" class="bi bi-exclamation-triangle me-1"></i>
                      {{ getStatusText(device && device.status ? device.status : 'disconnected') }}
                      <span v-if="device && device.status === 'connecting' && isDeviceStuck(device)" class="ms-1 text-warning">
                        <i class="bi bi-exclamation-triangle" title="Device appears to be stuck"></i>
                      </span>
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ device && device.last_activity ? formatDate(device.last_activity) : 'Never' }}</small>
                  </td>
                  <td class="px-4 py-3 text-end">
                    <div class="d-flex gap-2 justify-content-end">
                      <!-- Token Button -->
                      <button
                        class="btn btn-dark btn-sm d-flex align-items-center"
                        @click="copyToken(device)"
                        title="Copy API Token for this device"
                      >
                        <i class="bi bi-key me-1"></i>
                        <span class="d-none d-sm-inline">Token</span>
                      </button>
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
                        <span class="d-none d-sm-inline">{{ deviceStore.isLoading ? 'Connecting...' : 'Connect' }}</span>
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
                        <span class="d-none d-sm-inline">Disconnect</span>
                      </button>
                      
                      <!-- Connecting Status with Stop Button -->
                      <template v-if="device && device.status === 'connecting'">
                        <button
                          class="btn btn-info btn-sm d-flex align-items-center me-1"
                          disabled
                          title="Connecting to WhatsApp..."
                        >
                          <div class="spinner-border spinner-border-sm me-1" role="status">
                            <span class="visually-hidden">Loading...</span>
                          </div>
                          <span class="d-none d-sm-inline">Connecting...</span>
                        </button>
                        
                        <!-- Stop Connection Button -->
                        <button
                          class="btn btn-danger btn-sm d-flex align-items-center"
                          @click="stopConnection(device)"
                          :disabled="deviceStore.isLoading"
                          title="Stop Connection and try again"
                        >
                          <i class="bi bi-stop-circle me-1"></i>
                          <span class="d-none d-sm-inline">Stop</span>
                        </button>
                      </template>
                      
                      <!-- Edit Button -->
                      <button
                        class="btn btn-outline-primary btn-sm d-flex align-items-center"
                        @click="editDevice(device)"
                        title="Edit Device Settings"
                      >
                        <i class="bi bi-pencil-square me-1"></i>
                        <span class="d-none d-sm-inline">Edit</span>
                      </button>
                      
                      <!-- Delete Button -->
                      <button
                        class="btn btn-outline-danger btn-sm d-flex align-items-center"
                        @click="deleteDevice(device)"
                        :disabled="deviceStore.isLoading"
                        title="Delete Device"
                      >
                        <i class="bi bi-trash me-1"></i>
                        <span class="d-none d-sm-inline">Delete</span>
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
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-phone me-2"></i>
              {{ showEditModal ? 'Edit Device' : 'Add New Device' }}
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeModal"
            ></button>
          </div>
          <form @submit.prevent="saveDevice">
            <div class="modal-body p-4">
              <div class="mb-4">
                <label for="deviceName" class="form-label fw-semibold">
                  <i class="bi bi-tag me-1 text-muted"></i>Device Name *
                </label>
                <input
                  type="text"
                  class="form-control form-control-lg"
                  :class="{ 'is-invalid': errors.name }"
                  id="deviceName"
                  v-model="deviceForm.name"
                  placeholder="e.g., My iPhone, Office Phone"
                  required
                />
                <div class="invalid-feedback" v-if="errors.name">
                  {{ errors.name }}
                </div>
                <div class="form-text">Choose a descriptive name for your device</div>
              </div>

              <div class="mb-4">
                <label for="deviceDescription" class="form-label fw-semibold">
                  <i class="bi bi-card-text me-1 text-muted"></i>Description
                </label>
                <textarea
                  class="form-control"
                  id="deviceDescription"
                  v-model="deviceForm.description"
                  rows="3"
                  placeholder="Optional description for this device..."
                ></textarea>
                <div class="form-text">Add any additional details about this device</div>
              </div>

              <div class="mb-4">
                <label for="devicePhone" class="form-label fw-semibold">
                  <i class="bi bi-telephone me-1 text-muted"></i>Phone Number
                </label>
                <input
                  type="tel"
                  class="form-control form-control-lg"
                  :class="{ 'is-invalid': errors.phone_number }"
                  id="devicePhone"
                  v-model="deviceForm.phone_number"
                  placeholder="+1234567890"
                />
                <div class="invalid-feedback" v-if="errors.phone_number">
                  {{ errors.phone_number }}
                </div>
                <div class="form-text">Enter the WhatsApp phone number for this device</div>
              </div>
            </div>
            <div class="modal-footer bg-light border-0 p-4">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="closeModal"
              >
                <i class="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary btn-lg d-flex align-items-center"
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
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-success text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-qr-code me-2"></i>Connect Device
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeQRModal"
            ></button>
          </div>
          <div class="modal-body text-center p-4">
            <div v-if="qrCode" class="qr-container">
              <div class="qr-code-wrapper mb-4">
                <img :src="qrCode" alt="QR Code" class="qr-code" />
              </div>
              <h6 class="text-dark mb-3">Scan QR Code with WhatsApp</h6>
              <p class="text-muted mb-4">
                Open WhatsApp on your phone and scan this QR code to connect your device
              </p>
              <div class="alert alert-info d-flex align-items-center" role="alert">
                <i class="bi bi-info-circle me-2"></i>
                <small>Make sure your phone and computer are connected to the same network</small>
              </div>
            </div>
            <div v-else class="text-center py-5">
              <div class="loading-spinner mx-auto mb-3"></div>
              <h6 class="text-muted mb-2">Generating QR code...</h6>
              <p class="text-muted small">Please wait while we prepare your connection</p>
            </div>
          </div>
          <div class="modal-footer bg-light border-0 p-4">
            <button
              type="button"
              class="btn btn-danger"
              @click="stopConnectionFromQR(selectedDevice)"
              :disabled="deviceStore.isLoading"
            >
              <i class="bi bi-stop-circle me-1"></i>
              Stop Connection
            </button>
            <button
              type="button"
              class="btn btn-outline-secondary"
              @click="closeQRModal"
            >
              <i class="bi bi-x-circle me-1"></i>
              Close
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

// Filter data
const searchQuery = ref('')
const statusFilter = ref('')

// Load devices on mount
onMounted(async () => {
  try {
    const result = await deviceStore.fetchDevices()
    
    // Set up socket event listeners for real-time updates
    setupSocketListeners()
  } catch (error) {
    // console.error('Error loading devices:', error)
  }
})

// Set up socket event listeners
const setupSocketListeners = () => {
  console.log('Setting up socket listeners for device events')
  
  // Check socket connection status
  const { $socket } = useNuxtApp()
  console.log('Socket connection status:', $socket.isConnected)
  
  // Listen for QR code events
  window.addEventListener('device:qr', (event) => {
    const { deviceId, qrCode: receivedQR } = event.detail
    console.log('QR code received via socket:', deviceId)
    
    // Find the device and show QR modal
    const device = deviceStore.getDevices.find(d => d && d.id === deviceId)
    if (device && receivedQR) {
      qrCode.value = receivedQR
      selectedDevice.value = device // Store device reference for stop button
      showQRModal.value = true
      $toast.success('QR code received! Please scan with WhatsApp.')
    }
  })
  
  // Listen for device connection events
  window.addEventListener('device:connected', (event) => {
    const { deviceId } = event.detail
    console.log('Device connected via socket:', deviceId)
    
    // Update device status and close QR modal
    deviceStore.updateDeviceStatus(deviceId, 'connected')
    closeQRModal()
    $toast.success('Device connected successfully!')
    
    // Refresh devices list to get latest data
    deviceStore.fetchDevices()
  })
  
  // Also listen for connection_status events (alternative event name)
  window.addEventListener('connection_status', (event) => {
    const { deviceId, status } = event.detail
    console.log('Connection status received:', deviceId, status)
    
    if (status === 'connected') {
      deviceStore.updateDeviceStatus(deviceId, 'connected')
      closeQRModal()
      $toast.success('Device connected successfully!')
      deviceStore.fetchDevices()
    }
  })
  
  // Listen for device disconnection events
  window.addEventListener('device:disconnected', (event) => {
    const { deviceId } = event.detail
    // console.log('Device disconnected via socket:', deviceId)
    
    deviceStore.updateDeviceStatus(deviceId, 'disconnected')
    $toast.info('Device disconnected')
  })
}

// Cleanup on unmount
onUnmounted(() => {
  // Clear any active polling intervals
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
  }
})

// Computed properties for filtering
const filteredDevices = computed(() => {
  let devices = deviceStore.getDevices || []
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    devices = devices.filter(device => {
      if (!device) return false
      const name = (device.name || '').toLowerCase()
      const phone = (device.phone_number || '').toLowerCase()
      const description = (device.description || '').toLowerCase()
      return name.includes(query) || phone.includes(query) || description.includes(query)
    })
  }
  
  // Filter by status
  if (statusFilter.value) {
    devices = devices.filter(device => {
      if (!device) return false
      return device.status === statusFilter.value
    })
  }
  
  return devices
})

const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || statusFilter.value !== ''
})

// Refresh devices
const refreshDevices = async () => {
  await deviceStore.fetchDevices()
  $toast.success('Devices refreshed')
  
  // Check for stuck devices and reset them
  const stuckDevices = deviceStore.getDevices.filter(d => 
    d && d.status === 'connecting' && 
    d.last_activity && 
    new Date(d.last_activity).getTime() < Date.now() - 300000 // 5 minutes ago
  )
  
  if (stuckDevices.length > 0) {
    $toast.warn(`Found ${stuckDevices.length} device(s) stuck in connecting state. Consider reconnecting them.`)
  }
}

// Clear filters
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  $toast.info('Filters cleared')
}

// Connect device
const connectDevice = async (device) => {
  // Prevent multiple clicks
  if (deviceStore.isLoading) {
    $toast.warn('Connection already in progress, please wait...')
    return
  }
  
  // If device is already connecting, ask to stop first
  if (device && device.status === 'connecting') {
    if (confirm('Device is already connecting. Do you want to stop current connection and start a new one?')) {
      await stopConnection(device)
      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 2000))
    } else {
      return
    }
  }
  
  try {
    // Clear any existing polling before starting new connection
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
      statusPollingInterval = null
    }
    pollingInProgress = false
    
    $toast.info('Initializing device connection...')

    const result = await deviceStore.connectDevice(device.id)

    if (result.success) {
      if (result.qrCode) {
        qrCode.value = result.qrCode
        selectedDevice.value = device // Store device reference for stop button
        showQRModal.value = true
        $toast.success('QR code generated successfully')
      } else {
        $toast.info(result.message || 'Connection initiated, QR code will be available shortly')
        // Poll for QR code with improved timeout handling
        try {
          await pollForQRCodeWithTimeout(device.id)
        } catch (timeoutError) {
          // Handle timeout gracefully
          $toast.warn('QR code generation is taking longer than expected. Please try refreshing the page.')
        }
      }
    } else {
      $toast.error(result.error || 'Failed to connect device')
    }
  } catch (error) {
    console.error('Connect device error:', error)
    $toast.error('Failed to connect device')
  }
}

// Poll for QR code and device status
let pollingInProgress = false
let statusPollingInterval = null

// Poll for QR code with timeout
const pollForQRCodeWithTimeout = async (deviceId) => {
  const timeout = 60000 // Reduced to 1 minute timeout
  const startTime = Date.now()
  
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (pollingInProgress) {
        pollingInProgress = false
        $toast.warn('QR code generation is taking longer than expected. Please try refreshing the page.')
        reject(new Error('QR code generation timeout'))
      }
    }, timeout)
    
    const poll = async () => {
      if (Date.now() - startTime > timeout) {
        clearTimeout(timeoutId)
        return
      }
      
      try {
        await pollForQRCode(deviceId)
        clearTimeout(timeoutId)
        resolve()
      } catch (error) {
        clearTimeout(timeoutId)
        reject(error)
      }
    }
    
    poll()
  })
}

const pollForQRCode = async (deviceId) => {
  // Prevent multiple polling
  if (pollingInProgress) {
    return
  }
  
  pollingInProgress = true
  const maxAttempts = 20 // Reduced attempts for faster timeout
  let attempts = 0
  
  $toast.info('Waiting for QR code generation...')
  
  const poll = async () => {
    if (attempts >= maxAttempts) {
      $toast.error('QR code not available after multiple attempts. Please try connecting again.')
      pollingInProgress = false
      return
    }
    
    try {
      const config = useRuntimeConfig()
      const token = localStorage.getItem('auth_token')
      
      let response
      try {
        const { $api } = useNuxtApp()
        response = await $api.get(`/devices/${deviceId}/qr`)
      } catch (apiError) {
        // Use raw to get status code with $fetch
        response = await $fetch.raw(`${config.public.apiBase}/devices/${deviceId}/qr`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
      }

      // Normalize axios/$fetch responses
      const respStatus = response.status ?? 200
      const respData = response.data?.data ?? response._data?.data ?? response.data ?? response._data ?? {}
      const respSuccess = response.data?.success ?? response._data?.success ?? response.success ?? false

      // Handle different response scenarios
      if (respSuccess && respData.qr_code) {
        // QR code is available
        qrCode.value = respData.qr_code
        // Find and store device reference for stop button
        const device = deviceStore.getDevices.find(d => d && d.id === deviceId)
        if (device) {
          selectedDevice.value = device
        }
        showQRModal.value = true
        $toast.success('QR code generated successfully')
        pollingInProgress = false
        
        // Start polling for device status to detect connection
        startStatusPolling(deviceId)
        return
      } else if (respStatus === 202) {
        // QR code is being generated, retry after suggested delay
        const retryAfter = respData?.retry_after || 3 // Reduced default wait time
        const timeElapsed = respData?.time_elapsed || 0
        const maxWaitTime = respData?.max_wait_time || 120
        
        if (attempts === 3) {
          $toast.info('QR code is being generated, please wait...')
        } else if (attempts === 10) {
          $toast.warn(`QR code generation taking longer than expected... (${timeElapsed}s elapsed)`)
        } else if (attempts === 20) {
          $toast.warn(`QR code generation is taking longer than usual. This may be due to WhatsApp server load. (${timeElapsed}s elapsed)`)
        }
        
        // Check if we're approaching timeout
        if (timeElapsed > maxWaitTime * 0.8) {
          $toast.warn(`QR generation is taking longer than usual. If this continues, please try reconnecting.`)
        }
        
        attempts++
        setTimeout(poll, retryAfter * 1000)
        return
      } else if (respStatus === 400 && respData?.connected) {
        // Device is already connected
        $toast.success('Device is already connected!')
        pollingInProgress = false
        return
      } else if (respStatus === 400 && respData?.needs_connection_init) {
        // Need to initialize connection first
        $toast.error('Please click Connect button first to initialize the device')
        pollingInProgress = false
        return
      } else {
        // QR code not ready yet
        if (attempts === 3) {
          $toast.info('Still waiting for QR code...')
        } else if (attempts === 10) {
          $toast.warn('QR code taking longer than expected...')
        } else if (attempts === 20) {
          $toast.warn('QR code generation is taking longer than usual. This may be due to WhatsApp server load.')
        }
      }
      
      attempts++
      setTimeout(poll, 3000) // Poll every 3 seconds (reduced interval for faster response)
    } catch (error) {
      // console.error('Poll QR code error:', error)
      // Handle network errors more gracefully
      if (attempts < 5) {
        $toast.warn('Network error, retrying...')
      } else if (attempts < 10) {
        $toast.warn('Still experiencing network issues, please check your connection...')
      }
      attempts++
      setTimeout(poll, 3000)
    }
  }
  
  poll()
}

// Start polling for device status to detect successful connection
const startStatusPolling = (deviceId) => {
  // Clear any existing interval
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
  }
  
  let statusAttempts = 0
  const maxStatusAttempts = 60 // Poll for up to 5 minutes (5 seconds * 60)
  
  statusPollingInterval = setInterval(async () => {
    try {
      statusAttempts++

      // Refresh devices to get latest status
      await deviceStore.fetchDevices()
      
      // Find the device and check its status
      const device = deviceStore.getDevices.find(d => d && d.id === deviceId)
      
      if (device && device.status === 'connected') {
        // Device is connected! Close QR modal and show success
        console.log('Device connected via polling:', deviceId)
        $toast.success('Device connected successfully!')
        closeQRModal()
        clearInterval(statusPollingInterval)
        statusPollingInterval = null
        
        // Update device store status
        deviceStore.updateDeviceStatus(deviceId, 'connected')
        return
      } else if (device && device.status === 'error') {
        // Device connection failed

        $toast.error('Device connection failed. Please try again.')
        closeQRModal()
        clearInterval(statusPollingInterval)
        statusPollingInterval = null
        return
      } else if (statusAttempts >= maxStatusAttempts) {
        // Timeout - stop polling

        $toast.warn('Connection timeout. Please check your device and try again.')
        clearInterval(statusPollingInterval)
        statusPollingInterval = null
        return
      }
      
      // Continue polling

    } catch (error) {
// console.error('Status polling error:', error)
      statusAttempts++
      
      if (statusAttempts >= maxStatusAttempts) {
        clearInterval(statusPollingInterval)
        statusPollingInterval = null
      }
    }
  }, 5000) // Poll every 5 seconds
}

// Stop connection (for devices that are connecting)
const stopConnection = async (device) => {
  if (!device || !device.id) {
    $toast.error('Invalid device data')
    return
  }
  
  if (!confirm(`Stop connection for "${device.name || 'Unknown Device'}"?`)) {
    return
  }
  
  try {
    // Stop any ongoing polling
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
      statusPollingInterval = null
    }
    
    // Stop QR code polling if any
    pollingInProgress = false
    
    // Close QR modal if open
    closeQRModal()
    
    // Call API to stop connection
    const result = await deviceStore.stopConnection(device.id)
    
    if (result.success) {
      $toast.success('Connection stopped. You can try connecting again.')
      
      // Refresh devices to get updated status
      await deviceStore.fetchDevices()
    } else {
      $toast.error(result.error || 'Failed to stop connection')
    }
  } catch (error) {
    console.error('Stop connection error:', error)
    $toast.error('Failed to stop connection')
    
    // Still update local state
    deviceStore.updateDeviceStatus(device.id, 'disconnected')
    closeQRModal()
    
    // Clear polling intervals
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
      statusPollingInterval = null
    }
    pollingInProgress = false
  }
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
// console.error('Save device error:', error)
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
// console.error('Delete device error:', error)
      $toast.error('Failed to delete device')
    }
  }
}

// Copy token handler
const copyToken = async (device) => {
  try {
    const result = await deviceStore.getDeviceToken(device.id)
    if (result.success && result.token) {
      await navigator.clipboard.writeText(result.token)
      $toast.success('API key copied to clipboard')
    } else {
      $toast.error(result.error || 'Failed to get API key')
    }
  } catch (error) {
    $toast.error('Failed to copy API key')
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

// Stop connection from QR modal
const stopConnectionFromQR = async (device) => {
  if (!device || !device.id) {
    // Try to find device from current connecting devices
    const connectingDevice = deviceStore.getDevices.find(d => d && d.status === 'connecting')
    if (connectingDevice) {
      await stopConnection(connectingDevice)
    } else {
      $toast.warn('No active connection to stop')
      closeQRModal()
    }
  } else {
    await stopConnection(device)
  }
}

// Close QR modal
const closeQRModal = () => {
  showQRModal.value = false
  qrCode.value = ''
  
  // Clear status polling interval
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval)
    statusPollingInterval = null
  }
  
  // Stop QR code polling
  pollingInProgress = false
  
  // Don't stop connection when just closing modal - user might want to scan QR
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

// Check if device is stuck in connecting state
const isDeviceStuck = (device) => {
  if (!device || device.status !== 'connecting') return false
  
  // Check if device has been connecting for more than 5 minutes
  const lastActivity = device.last_activity ? new Date(device.last_activity) : new Date()
  const now = new Date()
  const timeDiff = now.getTime() - lastActivity.getTime()
  
  return timeDiff > 300000 // 5 minutes
}

// Reset stuck device
const resetStuckDevice = async (device) => {
  if (!device || !device.id) {
    $toast.error('Invalid device data')
    return
  }
  
  const deviceName = device.name || 'Unknown Device'
  if (confirm(`Are you sure you want to reset "${deviceName}"? This will stop the current connection attempt.`)) {
    try {
      // First try to disconnect the device
      await deviceStore.disconnectDevice(device.id)
      
      // Wait a moment for the disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Refresh devices to get updated status
      await deviceStore.fetchDevices()
      
      $toast.success('Device reset successfully. You can now try connecting again.')
    } catch (error) {
      $toast.error('Failed to reset device. Please try again.')
    }
  }
}
</script>

<style scoped>
.devices-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.page-header {
  position: sticky;
  top: 0;
  /* z-index: 1000; */
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

/* Button improvements */
.btn {
  transition: all 0.2s ease-in-out;
  font-weight: 500;
  border-radius: 8px;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

/* Status badge improvements */
.status-badge {
  font-size: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
}

/* Table improvements */
.table {
  border-radius: 12px;
  overflow: hidden;
}

.table th {
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  background: #f8f9fa;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td {
  vertical-align: middle;
  border-bottom: 1px solid #f1f3f4;
}

.device-row:hover {
  background-color: #f8f9fa;
}

/* Device status indicator */
.device-status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  position: relative;
}

.device-status-indicator.connected {
  background-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
}

.device-status-indicator.connecting {
  background-color: #ffc107;
  box-shadow: 0 0 0 3px rgba(255, 193, 7, 0.2);
  animation: pulse 1.5s infinite;
}

.device-status-indicator.disconnected {
  background-color: #6c757d;
  box-shadow: 0 0 0 3px rgba(108, 117, 125, 0.2);
}

.device-status-indicator.error {
  background-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* Empty state improvements */
.empty-state {
  padding: 3rem 2rem;
}

.empty-state-icon {
  position: relative;
}

.phone-icon-container {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 2px solid #dee2e6;
}

.phone-icon-container i {
  font-size: 2rem;
  color: #6c757d;
}

.max-width-400 {
  max-width: 400px;
}

/* Loading spinner */
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #25D366;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* QR Code modal */
.qr-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code-wrapper {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #e9ecef;
}

.qr-code {
  max-width: 200px;
  width: 100%;
  height: auto;
  border-radius: 8px;
}

/* Modal improvements */
.modal-content {
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  border-radius: 16px 16px 0 0;
}

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
  backdrop-filter: blur(4px);
}

/* Form improvements */
.form-control {
  border-radius: 8px;
  border: 1px solid #dee2e6;
  transition: all 0.2s ease;
}

.form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-control-lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .stat-card {
    padding: 1rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
  }
  
  .table-responsive {
    border-radius: 12px;
  }
  
  .btn-sm {
    padding: 0.375rem 0.5rem;
    font-size: 0.75rem;
  }
}

/* Breadcrumb improvements */
.breadcrumb {
  background: transparent;
  padding: 0;
  margin: 0;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: "›";
  color: #6c757d;
  font-weight: bold;
}

/* Alert improvements */
.alert {
  border-radius: 8px;
  border: none;
  font-size: 0.875rem;
}

/* Filter Section */
.filter-section {
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}

.filter-section .input-group-text {
  border-color: #dee2e6;
  background: white;
}

.filter-section .form-control {
  border-color: #dee2e6;
  border-left: none;
}

.filter-section .form-control:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.filter-section .form-select {
  border-color: #dee2e6;
}

.filter-section .form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.filter-section .badge {
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
}
</style> 