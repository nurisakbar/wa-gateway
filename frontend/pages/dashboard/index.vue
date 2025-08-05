<template>
  <div class="dashboard-page">
    <!-- Welcome Section -->
    <div class="welcome-section mb-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h1 class="welcome-title">
            Selamat datang kembali, {{ user?.full_name || user?.username || 'User' }}! 👋
          </h1>
          <p class="welcome-subtitle text-muted">
            Berikut adalah ringkasan aktivitas WhatsApp Gateway Anda hari ini
          </p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-outline-primary" @click="refreshData">
            <i class="bi bi-arrow-clockwise me-2"></i>
            Refresh Data
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row mb-4">
      <div class="col-lg-3 col-md-6 mb-3">
        <div class="stat-card h-100">
          <div class="stat-content">
            <div class="stat-icon bg-primary">
              <i class="bi bi-chat-dots"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ analytics.messages?.total_messages || 0 }}</div>
              <div class="stat-label">Total Pesan</div>
              <div class="stat-change text-success">
                <i class="bi bi-arrow-up"></i>
                {{ analytics.messages?.success_rate || 0 }}% success rate
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6 mb-3">
        <div class="stat-card h-100">
          <div class="stat-content">
            <div class="stat-icon bg-success">
              <i class="bi bi-phone"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ analytics.devices?.connected_devices || 0 }}</div>
              <div class="stat-label">Device Aktif</div>
              <div class="stat-change text-muted">
                dari {{ analytics.devices?.total_devices || 0 }} total
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6 mb-3">
        <div class="stat-card h-100">
          <div class="stat-content">
            <div class="stat-icon bg-info">
              <i class="bi bi-graph-up"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ analytics.api_usage?.total_requests || 0 }}</div>
              <div class="stat-label">API Requests</div>
              <div class="stat-change text-success">
                <i class="bi bi-arrow-up"></i>
                {{ analytics.api_usage?.success_rate || 0 }}% success
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6 mb-3">
        <div class="stat-card h-100">
          <div class="stat-content">
            <div class="stat-icon bg-warning">
              <i class="bi bi-people"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ analytics.contacts?.total || 0 }}</div>
              <div class="stat-label">Total Kontak</div>
              <div class="stat-change text-muted">
                <i class="bi bi-person-plus"></i>
                {{ analytics.contacts?.new_this_month || 0 }} baru bulan ini
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row mb-4">
      <div class="col-lg-8 mb-3">
        <div class="card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">
              <i class="bi bi-graph-up me-2"></i>
              Aktivitas API (30 Hari Terakhir)
            </h5>
            <div class="btn-group btn-group-sm">
              <button 
                v-for="period in ['7d', '30d', '90d']" 
                :key="period"
                class="btn btn-outline-secondary"
                :class="{ active: selectedPeriod === period }"
                @click="changePeriod(period)"
              >
                {{ period }}
              </button>
            </div>
          </div>
          <div class="card-body">
            <canvas ref="apiChart" height="300"></canvas>
          </div>
        </div>
      </div>

      <div class="col-lg-4 mb-3">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-pie-chart me-2"></i>
              Status Pesan
            </h5>
          </div>
          <div class="card-body">
            <canvas ref="messageChart" height="300"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Activity & Quick Actions -->
    <div class="row mb-4">
      <div class="col-lg-6 mb-3">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-activity me-2"></i>
              Aktivitas Real-time
            </h5>
          </div>
          <div class="card-body">
            <div v-if="realtimeData" class="realtime-stats">
              <div class="row text-center">
                <div class="col-4">
                  <div class="realtime-stat">
                    <div class="realtime-number">{{ realtimeData.current_hour?.requests || 0 }}</div>
                    <div class="realtime-label">Requests/Jam</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="realtime-stat">
                    <div class="realtime-number">{{ realtimeData.active_devices || 0 }}</div>
                    <div class="realtime-label">Device Aktif</div>
                  </div>
                </div>
                <div class="col-4">
                  <div class="realtime-stat">
                    <div class="realtime-number">{{ realtimeData.recent_messages || 0 }}</div>
                    <div class="realtime-label">Pesan Terbaru</div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <i class="bi bi-clock fs-1"></i>
              <p>Loading real-time data...</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-3">
        <div class="card h-100">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-lightning me-2"></i>
              Quick Actions
            </h5>
          </div>
          <div class="card-body">
            <div class="row g-2">
              <div class="col-6">
                <NuxtLink to="/devices" class="btn btn-outline-primary w-100">
                  <i class="bi bi-phone me-2"></i>
                  Kelola Device
                </NuxtLink>
              </div>
              <div class="col-6">
                <NuxtLink to="/messages" class="btn btn-outline-success w-100">
                  <i class="bi bi-chat me-2"></i>
                  Kirim Pesan
                </NuxtLink>
              </div>
              <div class="col-6">
                <NuxtLink to="/contacts" class="btn btn-outline-info w-100">
                  <i class="bi bi-people me-2"></i>
                  Kelola Kontak
                </NuxtLink>
              </div>
              <div class="col-6">
                <NuxtLink to="/analytics" class="btn btn-outline-warning w-100">
                  <i class="bi bi-graph-up me-2"></i>
                  Lihat Analytics
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Activity & Top Endpoints -->
    <div class="row">
      <div class="col-lg-8 mb-3">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-clock-history me-2"></i>
              Aktivitas Terbaru
            </h5>
          </div>
          <div class="card-body">
            <div v-if="recentActivity.length > 0" class="activity-list">
              <div 
                v-for="activity in recentActivity" 
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-icon">
                  <i :class="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-description">{{ activity.description }}</div>
                  <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <i class="bi bi-inbox fs-1"></i>
              <p>Belum ada aktivitas terbaru</p>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-4 mb-3">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-list-ol me-2"></i>
              Top Endpoints
            </h5>
          </div>
          <div class="card-body">
            <div v-if="topEndpoints.length > 0" class="endpoint-list">
              <div 
                v-for="(endpoint, index) in topEndpoints" 
                :key="index"
                class="endpoint-item"
              >
                <div class="endpoint-rank">{{ index + 1 }}</div>
                <div class="endpoint-info">
                  <div class="endpoint-name">{{ endpoint.endpoint }}</div>
                  <div class="endpoint-stats">
                    {{ endpoint.count }} requests • {{ endpoint.avg_response_time?.toFixed(0) || 0 }}ms avg
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted">
              <i class="bi bi-bar-chart fs-1"></i>
              <p>Belum ada data endpoint</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard'
})

const { user } = useAuth()
const { $toast } = useNuxtApp()

// Reactive data
const analytics = ref({
  messages: { total_messages: 0, success_rate: 0 },
  devices: { connected_devices: 0, total_devices: 0 },
  api_usage: { total_requests: 0, success_rate: 0 },
  contacts: { total: 0, new_this_month: 0 }
})

const realtimeData = ref(null)
const recentActivity = ref([])
const topEndpoints = ref([])
const selectedPeriod = ref('30d')

// Chart references
const apiChart = ref(null)
const messageChart = ref(null)
let apiChartInstance = null
let messageChartInstance = null

// Fetch analytics data
const fetchAnalytics = async () => {
  try {
    const response = await $fetch('/api/v1/analytics/user', {
      query: { period: selectedPeriod.value }
    })
    
    if (response.success) {
      analytics.value = response.data
      updateCharts()
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    $toast.error('Gagal memuat data analytics')
  }
}

// Fetch real-time data
const fetchRealtimeData = async () => {
  try {
    const response = await $fetch('/api/v1/analytics/realtime')
    
    if (response.success) {
      realtimeData.value = response.data
    }
  } catch (error) {
    console.error('Error fetching real-time data:', error)
  }
}

// Update charts
const updateCharts = () => {
  updateApiChart()
  updateMessageChart()
}

// Update API activity chart
const updateApiChart = () => {
  if (!apiChart.value) return

  const ctx = apiChart.value.getContext('2d')
  
  if (apiChartInstance) {
    apiChartInstance.destroy()
  }

  const chartData = analytics.value.daily_usage || []
  
  apiChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'API Requests',
          data: chartData.map(item => item.requests),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4
        },
        {
          label: 'Response Time (ms)',
          data: chartData.map(item => item.avg_response_time),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Requests'
          }
        },
        y1: {
          position: 'right',
          beginAtZero: true,
          title: {
            display: true,
            text: 'Response Time (ms)'
          }
        }
      },
      plugins: {
        legend: {
          position: 'top'
        }
      }
    }
  })
}

// Update message status chart
const updateMessageChart = () => {
  if (!messageChart.value) return

  const ctx = messageChart.value.getContext('2d')
  
  if (messageChartInstance) {
    messageChartInstance.destroy()
  }

  const messageData = analytics.value.messages || {}
  const data = [
    messageData.sent_messages || 0,
    messageData.failed_messages || 0,
    (messageData.total_messages || 0) - (messageData.sent_messages || 0) - (messageData.failed_messages || 0)
  ]

  messageChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Sent', 'Failed', 'Pending'],
      datasets: [{
        data: data,
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        borderWidth: 2
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

// Change period
const changePeriod = (period) => {
  selectedPeriod.value = period
  fetchAnalytics()
}

// Refresh data
const refreshData = async () => {
  $toast.info('Memuat data terbaru...')
  await Promise.all([
    fetchAnalytics(),
    fetchRealtimeData()
  ])
  $toast.success('Data berhasil diperbarui')
}

// Format time
const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID')
}

// Get activity icon
const getActivityIcon = (type) => {
  const icons = {
    message: 'bi bi-chat-dots text-primary',
    device: 'bi bi-phone text-success',
    api: 'bi bi-code-slash text-info',
    contact: 'bi bi-person text-warning'
  }
  return icons[type] || 'bi bi-circle text-muted'
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    fetchAnalytics(),
    fetchRealtimeData()
  ])
  
  // Set up real-time updates
  setInterval(fetchRealtimeData, 30000) // Update every 30 seconds
})

// Cleanup charts on unmount
onUnmounted(() => {
  if (apiChartInstance) {
    apiChartInstance.destroy()
  }
  if (messageChartInstance) {
    messageChartInstance.destroy()
  }
})
</script>

<style scoped>
.dashboard-page {
  padding: 1.5rem;
}

.welcome-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 2rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
}

.stat-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.stat-change {
  font-size: 0.8rem;
  font-weight: 500;
}

.realtime-stats {
  padding: 1rem 0;
}

.realtime-stat {
  text-align: center;
}

.realtime-number {
  font-size: 2rem;
  font-weight: 700;
  color: #007bff;
  line-height: 1;
}

.realtime-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-top: 0.5rem;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #e9ecef;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.activity-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.8rem;
  color: #adb5bd;
}

.endpoint-list {
  max-height: 300px;
  overflow-y: auto;
}

.endpoint-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.endpoint-item:last-child {
  border-bottom: none;
}

.endpoint-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.endpoint-info {
  flex: 1;
}

.endpoint-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  font-family: monospace;
  font-size: 0.9rem;
}

.endpoint-stats {
  font-size: 0.8rem;
  color: #6c757d;
}

.card {
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
}

.card-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 1rem 1rem 0 0 !important;
}

.card-title {
  font-weight: 600;
  color: #495057;
}

.btn-group .btn.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 1rem;
  }
  
  .welcome-section {
    padding: 1.5rem;
  }
  
  .welcome-title {
    font-size: 1.5rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .realtime-number {
    font-size: 1.5rem;
  }
}
</style> 