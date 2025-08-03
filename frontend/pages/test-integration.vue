<template>
  <div class="test-integration-page">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0">
            <i class="bi bi-gear me-2"></i>
            Integration Test
          </h1>
          <p class="text-muted mb-0">Test frontend-backend integration</p>
        </div>
      </div>

      <!-- Connection Status -->
      <div class="row g-4 mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Connection Status</h5>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center mb-3">
                <div class="status-indicator me-3" :class="{ 'connected': isConnected }"></div>
                <div>
                  <strong>Socket Connection:</strong>
                  <span :class="isConnected ? 'text-success' : 'text-danger'">
                    {{ isConnected ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>
              </div>
              
              <div class="d-flex align-items-center mb-3">
                <div class="status-indicator me-3" :class="{ 'connected': apiConnected }"></div>
                <div>
                  <strong>API Connection:</strong>
                  <span :class="apiConnected ? 'text-success' : 'text-danger'">
                    {{ apiConnected ? 'Connected' : 'Disconnected' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Test Actions</h5>
            </div>
            <div class="card-body">
              <div class="d-grid gap-2">
                <button class="btn btn-primary" @click="testAPI">
                  Test API Connection
                </button>
                <button class="btn btn-success" @click="testSocket">
                  Test Socket Connection
                </button>
                <button class="btn btn-warning" @click="testAuth">
                  Test Authentication
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Test Results -->
      <div class="row g-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">API Test Results</h5>
            </div>
            <div class="card-body">
              <div v-for="(result, index) in apiResults" :key="index" class="mb-2">
                <div class="d-flex justify-content-between align-items-center">
                  <span>{{ result.endpoint }}</span>
                  <span :class="result.success ? 'text-success' : 'text-danger'">
                    {{ result.success ? '✓' : '✗' }}
                  </span>
                </div>
                <small class="text-muted">{{ result.message }}</small>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Socket Test Results</h5>
            </div>
            <div class="card-body">
              <div v-for="(result, index) in socketResults" :key="index" class="mb-2">
                <div class="d-flex justify-content-between align-items-center">
                  <span>{{ result.event }}</span>
                  <span :class="result.success ? 'text-success' : 'text-danger'">
                    {{ result.success ? '✓' : '✗' }}
                  </span>
                </div>
                <small class="text-muted">{{ result.message }}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Events -->
      <div class="row g-4 mt-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Real-time Events</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="event in realtimeEvents" :key="event.id">
                      <td>{{ formatTime(event.timestamp) }}</td>
                      <td>
                        <span class="badge" :class="getEventBadgeClass(event.type)">
                          {{ event.type }}
                        </span>
                      </td>
                      <td>
                        <code>{{ JSON.stringify(event.data) }}</code>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const isConnected = ref(false)
const apiConnected = ref(false)
const apiResults = ref([])
const socketResults = ref([])
const realtimeEvents = ref([])
let eventCounter = 0

// Real-time updates
const { isConnected: socketConnected } = useRealtime()

// Watch socket connection
watch(socketConnected, (connected) => {
  isConnected.value = connected
  addRealtimeEvent('connection', { status: connected ? 'connected' : 'disconnected' })
})

const testAPI = async () => {
  apiResults.value = []
  
  const endpoints = [
    { name: 'Health Check', url: '/api/v1/health' },
    { name: 'User Profile', url: '/api/v1/auth/me' },
    { name: 'Devices', url: '/api/v1/devices' },
    { name: 'Messages', url: '/api/v1/messages' },
    { name: 'Contacts', url: '/api/v1/contacts' }
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await $fetch(endpoint.url)
      apiResults.value.push({
        endpoint: endpoint.name,
        success: true,
        message: 'Success'
      })
    } catch (error) {
      apiResults.value.push({
        endpoint: endpoint.name,
        success: false,
        message: error.message
      })
    }
  }

  apiConnected.value = apiResults.value.every(r => r.success)
}

const testSocket = () => {
  socketResults.value = []
  const { $socket } = useNuxtApp()

  if ($socket.isConnected) {
    socketResults.value.push({
      event: 'Connection',
      success: true,
      message: 'Socket is connected'
    })

    // Test emit
    try {
      $socket.emit('test:ping', { message: 'Hello from frontend' })
      socketResults.value.push({
        event: 'Emit Test',
        success: true,
        message: 'Message sent successfully'
      })
    } catch (error) {
      socketResults.value.push({
        event: 'Emit Test',
        success: false,
        message: error.message
      })
    }
  } else {
    socketResults.value.push({
      event: 'Connection',
      success: false,
      message: 'Socket is not connected'
    })
  }
}

const testAuth = async () => {
  try {
    const response = await $fetch('/api/v1/auth/me')
    apiResults.value.push({
      endpoint: 'Authentication',
      success: true,
      message: `Authenticated as ${response.user.name}`
    })
  } catch (error) {
    apiResults.value.push({
      endpoint: 'Authentication',
      success: false,
      message: error.message
    })
  }
}

const addRealtimeEvent = (type, data) => {
  realtimeEvents.value.unshift({
    id: ++eventCounter,
    type,
    data,
    timestamp: new Date()
  })

  // Keep only last 50 events
  if (realtimeEvents.value.length > 50) {
    realtimeEvents.value.pop()
  }
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const getEventBadgeClass = (type) => {
  const classes = {
    connection: 'bg-primary',
    message: 'bg-success',
    device: 'bg-warning',
    error: 'bg-danger'
  }
  return classes[type] || 'bg-secondary'
}

// Listen for real-time events
onMounted(() => {
  if (process.client) {
    // Listen for various socket events
    const events = [
      'message:received',
      'message:sent',
      'device:connected',
      'device:disconnected',
      'broadcast:started',
      'broadcast:completed'
    ]

    events.forEach(eventType => {
      window.addEventListener(eventType, (e) => {
        addRealtimeEvent(eventType, e.detail)
      })
    })
  }
})
</script>

<style scoped>
.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #dc3545;
  transition: background-color 0.3s ease;
}

.status-indicator.connected {
  background-color: #28a745;
}

code {
  font-size: 0.8rem;
  background: #f8f9fa;
  padding: 2px 4px;
  border-radius: 4px;
}
</style> 