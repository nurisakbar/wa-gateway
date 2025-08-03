<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header bg-white shadow-sm border-bottom">
      <div class="container-fluid">
        <div class="row align-items-center py-3">
          <div class="col">
            <h1 class="h3 mb-0 text-primary">
              <i class="bi bi-speedometer2 me-2"></i>
              Dashboard
            </h1>
          </div>
          <div class="col-auto">
            <div class="d-flex align-items-center gap-3">
              <div class="text-muted">
                <small>Last updated: {{ lastUpdated }}</small>
              </div>
              <button
                class="btn btn-outline-primary btn-sm"
                @click="refreshData"
                :disabled="loading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <!-- Statistics Cards -->
      <div class="dashboard-stats">
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

        <div class="stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded p-3 me-3">
              <i class="bi bi-wifi text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number">{{ deviceStore.getConnectedCount }}</div>
              <div class="stat-label">Connected Devices</div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded p-3 me-3">
              <i class="bi bi-chat-dots text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number">{{ messageStats.total || 0 }}</div>
              <div class="stat-label">Total Messages</div>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded p-3 me-3">
              <i class="bi bi-people text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number">{{ contactStats.total || 0 }}</div>
              <div class="stat-label">Total Contacts</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="row mb-4">
        <div class="col-lg-8">
          <div class="whatsapp-card">
            <div class="card-header bg-transparent border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-graph-up me-2"></i>
                Message Activity (Last 7 Days)
              </h5>
            </div>
            <div class="card-body">
              <canvas ref="messageChart" height="100"></canvas>
            </div>
          </div>
        </div>
        <div class="col-lg-4">
          <div class="whatsapp-card">
            <div class="card-header bg-transparent border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-pie-chart me-2"></i>
                Device Status
              </h5>
            </div>
            <div class="card-body">
              <canvas ref="deviceChart" height="100"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Devices and Recent Activity -->
      <div class="row">
        <div class="col-lg-8">
          <div class="whatsapp-card">
            <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
              <h5 class="card-title mb-0">
                <i class="bi bi-phone me-2"></i>
                Your Devices
              </h5>
              <NuxtLink to="/devices" class="btn btn-primary btn-sm">
                <i class="bi bi-plus me-1"></i>
                Add Device
              </NuxtLink>
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
                <NuxtLink to="/devices/new" class="btn btn-primary">
                  <i class="bi bi-plus me-1"></i>
                  Add Device
                </NuxtLink>
              </div>
              <div v-else class="list-group list-group-flush">
                <div
                  v-for="device in deviceStore.getDevices.slice(0, 5)"
                  :key="device.id"
                  class="list-group-item list-group-item-action"
                  @click="selectDevice(device)"
                >
                  <div class="d-flex align-items-center">
                    <div class="whatsapp-status me-3" :class="device.status"></div>
                    <div class="flex-grow-1">
                      <h6 class="mb-1">{{ device.name }}</h6>
                      <small class="text-muted">
                        {{ device.phone_number || 'No phone number' }}
                      </small>
                    </div>
                    <div class="text-end">
                      <span class="badge" :class="getStatusBadgeClass(device.status)">
                        {{ device.status }}
                      </span>
                      <small class="d-block text-muted">
                        {{ formatDate(device.last_activity) }}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-footer bg-transparent">
              <NuxtLink to="/devices" class="btn btn-outline-primary btn-sm">
                View All Devices
              </NuxtLink>
            </div>
          </div>
        </div>

        <div class="col-lg-4">
          <div class="whatsapp-card">
            <div class="card-header bg-transparent border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-clock-history me-2"></i>
                Recent Activity
              </h5>
            </div>
            <div class="card-body p-0">
              <div v-if="recentActivity.length === 0" class="text-center py-4">
                <i class="bi bi-clock text-muted fs-1 mb-3"></i>
                <p class="text-muted">No recent activity</p>
              </div>
              <div v-else class="list-group list-group-flush">
                <div
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  class="list-group-item"
                >
                  <div class="d-flex align-items-start">
                    <div class="activity-icon me-3">
                      <i :class="getActivityIcon(activity.type)" class="text-primary"></i>
                    </div>
                    <div class="flex-grow-1">
                      <h6 class="mb-1">{{ activity.title }}</h6>
                      <p class="mb-1 text-muted">{{ activity.description }}</p>
                      <small class="text-muted">{{ formatDate(activity.timestamp) }}</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const authStore = useAuthStore()
const deviceStore = useDeviceStore()
const { $toast } = useNuxtApp()

const loading = ref(false)
const lastUpdated = ref('')
const messageStats = ref({ total: 0 })
const contactStats = ref({ total: 0 })
const recentActivity = ref([])

const messageChart = ref<HTMLCanvasElement>()
const deviceChart = ref<HTMLCanvasElement>()

// Initialize dashboard
onMounted(async () => {
  await loadDashboardData()
  initializeCharts()
  startAutoRefresh()
})

// Load dashboard data
const loadDashboardData = async () => {
  loading.value = true
  try {
    await Promise.all([
      deviceStore.fetchDevices(),
      fetchMessageStats(),
      fetchContactStats(),
      fetchRecentActivity()
    ])
    lastUpdated.value = new Date().toLocaleTimeString()
  } catch (error) {
    $toast.error('Failed to load dashboard data')
  } finally {
    loading.value = false
  }
}

// Fetch message statistics
const fetchMessageStats = async () => {
  try {
    const { $api } = useNuxtApp()
    const response = await $api.get('/analytics/messages')
    if (response.data.success) {
      messageStats.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch message stats:', error)
  }
}

// Fetch contact statistics
const fetchContactStats = async () => {
  try {
    const { $api } = useNuxtApp()
    const response = await $api.get('/analytics/contacts')
    if (response.data.success) {
      contactStats.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch contact stats:', error)
  }
}

// Fetch recent activity
const fetchRecentActivity = async () => {
  try {
    const { $api } = useNuxtApp()
    const response = await $api.get('/analytics/activity')
    if (response.data.success) {
      recentActivity.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to fetch recent activity:', error)
  }
}

// Initialize charts
const initializeCharts = () => {
  if (messageChart.value) {
    const ctx = messageChart.value.getContext('2d')
    if (ctx) {
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Messages Sent',
            data: [12, 19, 3, 5, 2, 3, 7],
            borderColor: '#25D366',
            backgroundColor: 'rgba(37, 211, 102, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
    }
  }

  if (deviceChart.value) {
    const ctx = deviceChart.value.getContext('2d')
    if (ctx) {
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Connected', 'Disconnected', 'Error'],
          datasets: [{
            data: [
              deviceStore.getConnectedCount,
              deviceStore.getDeviceCount - deviceStore.getConnectedCount,
              0
            ],
            backgroundColor: ['#28a745', '#6c757d', '#dc3545']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
    }
  }
}

// Refresh data
const refreshData = async () => {
  await loadDashboardData()
  $toast.success('Dashboard refreshed')
}

// Auto refresh every 30 seconds
const startAutoRefresh = () => {
  setInterval(() => {
    if (!loading.value) {
      loadDashboardData()
    }
  }, 30000)
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

const getActivityIcon = (type: string) => {
  const icons = {
    message: 'bi bi-chat-dots',
    device: 'bi bi-phone',
    broadcast: 'bi bi-megaphone',
    contact: 'bi bi-person'
  }
  return icons[type as keyof typeof icons] || 'bi bi-info-circle'
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString()
}

const selectDevice = (device: any) => {
  deviceStore.selectDevice(device)
  navigateTo(`/devices/${device.id}`)
}

// Listen for real-time updates
onMounted(() => {
  const { $socket } = useNuxtApp()
  const socket = $socket.get()
  
  if (socket) {
    socket.on('device_status', (data: any) => {
      deviceStore.handleDeviceStatusUpdate(data)
    })
    
    socket.on('message_sent', () => {
      fetchMessageStats()
    })
  }
})
</script>

<style scoped>
.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.activity-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(37, 211, 102, 0.1);
  border-radius: 50%;
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
</style> 