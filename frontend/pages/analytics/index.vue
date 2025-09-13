<template>
  <div class="analytics-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h1 class="page-title">
            <i class="bi bi-graph-up me-2"></i>
            Analytics Dashboard
          </h1>
          <p class="page-subtitle text-muted">
            Monitor performa dan penggunaan API WhatsApp Gateway Anda
          </p>
        </div>
        <div class="col-md-4 text-end">
          <div class="btn-group">
            <button 
              v-for="period in ['7d', '30d', '90d']" 
              :key="period"
              class="btn btn-outline-primary"
              :class="{ active: selectedPeriod === period }"
              @click="changePeriod(period)"
            >
              {{ period }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="row mb-4">
      <div class="col-lg-3 col-md-6 mb-3">
        <div class="overview-card">
          <div class="overview-icon bg-primary">
            <i class="bi bi-arrow-up-circle"></i>
          </div>
          <div class="overview-content">
            <div class="overview-number">{{ analytics.api_usage?.total_requests || 0 }}</div>
            <div class="overview-label">Total Requests</div>
            <div class="overview-change text-success">
              <i class="bi bi-arrow-up"></i>
              {{ analytics.api_usage?.success_rate || 0 }}% success rate
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6 mb-3">
        <div class="overview-card">
          <div class="overview-icon bg-success">
            <i class="bi bi-chat-dots"></i>
          </div>
          <div class="overview-content">
            <div class="overview-number">{{ analytics.messages?.total_messages || 0 }}</div>
            <div class="overview-label">Messages Sent</div>
            <div class="overview-change text-success">
              <i class="bi bi-arrow-up"></i>
              {{ analytics.messages?.success_rate || 0 }}% success rate
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6 mb-3">
        <div class="overview-card">
          <div class="overview-icon bg-info">
            <i class="bi bi-speedometer2"></i>
          </div>
          <div class="overview-content">
            <div class="overview-number">{{ formatResponseTime(analytics.api_usage?.avg_response_time) }}ms</div>
            <div class="overview-label">Avg Response Time</div>
            <div class="overview-change text-info">
              <i class="bi bi-clock"></i>
              Real-time monitoring
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-3 col-md-6 mb-3">
        <div class="overview-card">
          <div class="overview-icon bg-warning">
            <i class="bi bi-exclamation-triangle"></i>
          </div>
          <div class="overview-content">
            <div class="overview-number">{{ analytics.api_usage?.failed_requests || 0 }}</div>
            <div class="overview-label">Failed Requests</div>
            <div class="overview-change text-warning">
              <i class="bi bi-arrow-down"></i>
              {{ getErrorRate() }}% error rate
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscription Plan & Usage Section -->
    <div class="row mb-4">
      <div class="col-lg-6 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-credit-card me-2"></i>
              Current Subscription Plan
            </h5>
            <div class="chart-actions">
              <NuxtLink to="/subscriptions" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-arrow-right me-1"></i>
                Manage Plan
              </NuxtLink>
            </div>
          </div>
          <div class="chart-body">
            <div v-if="subscriptionData" class="subscription-info">
              <div class="subscription-plan">
                <div class="plan-name">{{ subscriptionData.SubscriptionPlan?.name || 'Free Plan' }}</div>
                <div class="plan-price">
                  <span v-if="subscriptionData.SubscriptionPlan?.price > 0">
                    Rp {{ subscriptionData.SubscriptionPlan?.price?.toLocaleString('id-ID') }}/bulan
                  </span>
                  <span v-else class="text-success">Gratis</span>
                </div>
                <div class="plan-description">
                  {{ subscriptionData.SubscriptionPlan?.description || 'Paket gratis untuk memulai' }}
                </div>
              </div>
              
              <div class="subscription-status">
                <span class="badge bg-success">Active</span>
                <span class="text-muted ms-2">
                  Berakhir: {{ formatDate(subscriptionData.current_period_end) }}
                </span>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-credit-card fs-1"></i>
              <p>Belum ada subscription aktif</p>
              <NuxtLink to="/subscriptions" class="btn btn-primary btn-sm">
                Pilih Paket
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-speedometer2 me-2"></i>
              Usage Limits (Bulan Ini)
            </h5>
          </div>
          <div class="chart-body">
            <div v-if="usageData" class="usage-limits">
              <!-- Messages Usage -->
              <div class="usage-item">
                <div class="usage-header">
                  <div class="usage-label">
                    <i class="bi bi-chat-dots me-2"></i>
                    Messages
                  </div>
                  <div class="usage-count">
                    {{ usageData.usage?.messages_used || 0 }} / 
                    <span v-if="usageData.limits?.messages_per_month === -1">∞</span>
                    <span v-else>{{ usageData.limits?.messages_per_month || 1000 }}</span>
                  </div>
                </div>
                <div class="progress mb-2" style="height: 8px;">
                  <div 
                    class="progress-bar" 
                    :class="getUsageBarClass(usageData.usage?.messages_used, usageData.limits?.messages_per_month)"
                    :style="{ width: getUsagePercentage(usageData.usage?.messages_used, usageData.limits?.messages_per_month) + '%' }"
                  ></div>
                </div>
                <div class="usage-warning" v-if="isUsageHigh(usageData.usage?.messages_used, usageData.limits?.messages_per_month)">
                  <i class="bi bi-exclamation-triangle text-warning me-1"></i>
                  <small class="text-warning">Mendekati limit!</small>
                </div>
              </div>

              <!-- API Requests Usage -->
              <div class="usage-item">
                <div class="usage-header">
                  <div class="usage-label">
                    <i class="bi bi-arrow-up-circle me-2"></i>
                    API Requests
                  </div>
                  <div class="usage-count">
                    {{ usageData.usage?.api_requests_used || 0 }} / 
                    <span v-if="usageData.limits?.api_requests_per_month === -1">∞</span>
                    <span v-else>{{ usageData.limits?.api_requests_per_month || 500 }}</span>
                  </div>
                </div>
                <div class="progress mb-2" style="height: 8px;">
                  <div 
                    class="progress-bar" 
                    :class="getUsageBarClass(usageData.usage?.api_requests_used, usageData.limits?.api_requests_per_month)"
                    :style="{ width: getUsagePercentage(usageData.usage?.api_requests_used, usageData.limits?.api_requests_per_month) + '%' }"
                  ></div>
                </div>
                <div class="usage-warning" v-if="isUsageHigh(usageData.usage?.api_requests_used, usageData.limits?.api_requests_per_month)">
                  <i class="bi bi-exclamation-triangle text-warning me-1"></i>
                  <small class="text-warning">Mendekati limit!</small>
                </div>
              </div>

              <!-- Devices Usage -->
              <div class="usage-item">
                <div class="usage-header">
                  <div class="usage-label">
                    <i class="bi bi-phone me-2"></i>
                    Devices
                  </div>
                  <div class="usage-count">
                    {{ usageData.usage?.devices_used || 0 }} / {{ usageData.limits?.devices || 1 }}
                  </div>
                </div>
                <div class="progress mb-2" style="height: 8px;">
                  <div 
                    class="progress-bar" 
                    :class="getUsageBarClass(usageData.usage?.devices_used, usageData.limits?.devices)"
                    :style="{ width: getUsagePercentage(usageData.usage?.devices_used, usageData.limits?.devices) + '%' }"
                  ></div>
                </div>
                <div class="usage-warning" v-if="isUsageHigh(usageData.usage?.devices_used, usageData.limits?.devices)">
                  <i class="bi bi-exclamation-triangle text-warning me-1"></i>
                  <small class="text-warning">Mendekati limit!</small>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-speedometer2 fs-1"></i>
              <p>Loading usage data...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row mb-4">
      <div class="col-lg-8 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-graph-up me-2"></i>
              API Usage Trends
            </h5>
            <div class="chart-actions">
              <button class="btn btn-sm btn-outline-secondary" @click="exportChartData">
                <i class="bi bi-download me-1"></i>
                Export
              </button>
            </div>
          </div>
          <div class="chart-body">
            <canvas ref="usageChart" height="300"></canvas>
          </div>
        </div>
      </div>

      <div class="col-lg-4 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-pie-chart me-2"></i>
              Response Status
            </h5>
          </div>
          <div class="chart-body">
            <canvas ref="statusChart" height="300"></canvas>
          </div>
        </div>
      </div>
    </div>

    <!-- Real-time Metrics -->
    <div class="row mb-4">
      <div class="col-lg-6 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-activity me-2"></i>
              Real-time Activity (Last 24 Hours)
            </h5>
          </div>
          <div class="chart-body">
            <canvas ref="realtimeChart" height="250"></canvas>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-list-ol me-2"></i>
              Top Endpoints
            </h5>
          </div>
          <div class="chart-body">
            <div v-if="topEndpoints.length > 0" class="endpoint-list">
              <div 
                v-for="(endpoint, index) in topEndpoints.slice(0, 8)" 
                :key="index"
                class="endpoint-item"
              >
                <div class="endpoint-rank">{{ index + 1 }}</div>
                <div class="endpoint-info">
                  <div class="endpoint-name">{{ endpoint.endpoint }}</div>
                  <div class="endpoint-stats">
                    {{ endpoint.count }} requests • {{ formatResponseTime(endpoint.avg_response_time) }}ms avg
                  </div>
                </div>
                <div class="endpoint-percentage">
                  {{ getEndpointPercentage(endpoint.count) }}%
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-bar-chart fs-1"></i>
              <p>Belum ada data endpoint</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Tables -->
    <div class="row">
      <div class="col-lg-6 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-table me-2"></i>
              Recent API Calls
            </h5>
          </div>
          <div class="chart-body">
            <div class="table-responsive">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Endpoint</th>
                    <th>Status</th>
                    <th>Response Time</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="call in recentApiCalls" :key="call.id">
                    <td>
                      <code class="small">{{ call.endpoint }}</code>
                    </td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(call.status_code)">
                        {{ call.status_code }}
                      </span>
                    </td>
                    <td>{{ call.response_time }}ms</td>
                    <td>{{ formatTime(call.created_at) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6 mb-3">
        <div class="chart-card">
          <div class="chart-header">
            <h5 class="chart-title">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Error Analysis
            </h5>
          </div>
          <div class="chart-body">
            <div v-if="errorAnalysis.length > 0" class="error-list">
              <div 
                v-for="error in errorAnalysis" 
                :key="error.status_code"
                class="error-item"
              >
                <div class="error-code">{{ error.status_code }}</div>
                <div class="error-info">
                  <div class="error-count">{{ error.count }} occurrences</div>
                  <div class="error-percentage">{{ getErrorPercentage(error.count) }}% of total errors</div>
                </div>
                <div class="error-trend">
                  <i class="bi bi-arrow-up text-danger"></i>
                  {{ error.trend }}%
                </div>
              </div>
            </div>
            <div v-else class="text-center text-muted py-4">
              <i class="bi bi-check-circle fs-1 text-success"></i>
              <p>Tidak ada error dalam periode ini</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Chart } from 'chart.js'

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $toast } = useNuxtApp()

// Reactive data
const analytics = ref({
  api_usage: { total_requests: 0, success_rate: 0, avg_response_time: 0, failed_requests: 0 },
  messages: { total_messages: 0, success_rate: 0 },
  daily_usage: [],
  top_endpoints: []
})

const selectedPeriod = ref('30d')
const topEndpoints = ref([])
const recentApiCalls = ref([])
const errorAnalysis = ref([])
const subscriptionData = ref(null)
const usageData = ref(null)

// Chart references
const usageChart = ref(null)
const statusChart = ref(null)
const realtimeChart = ref(null)
let usageChartInstance = null
let statusChartInstance = null
let realtimeChartInstance = null

// Fetch analytics data
const fetchAnalytics = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    const response = await $fetch(`${config.public.apiBase}/analytics/user`, {
      query: { period: selectedPeriod.value },
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      analytics.value = response.data
      topEndpoints.value = response.data.top_endpoints || []
      updateCharts()
      generateMockData() // For demo purposes
    }
  } catch (error) {
    console.error('Error fetching analytics:', error)
    $toast.error('Gagal memuat data analytics')
  }
}

// Fetch subscription data
const fetchSubscriptionData = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    const response = await $fetch(`${config.public.apiBase}/subscriptions/my-subscription`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      subscriptionData.value = response.data
    }
  } catch (error) {
    console.error('Error fetching subscription:', error)
    // Don't show error toast for subscription, as user might not have one
  }
}

// Fetch usage data
const fetchUsageData = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    const response = await $fetch(`${config.public.apiBase}/subscriptions/usage`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.success) {
      usageData.value = response.data
    }
  } catch (error) {
    console.error('Error fetching usage:', error)
    // Don't show error toast for usage, as user might not have subscription
  }
}

// Update charts
const updateCharts = () => {
  updateUsageChart()
  updateStatusChart()
  updateRealtimeChart()
}

// Update usage chart
const updateUsageChart = () => {
  if (!usageChart.value) return

  const ctx = usageChart.value.getContext('2d')
  
  if (usageChartInstance) {
    usageChartInstance.destroy()
  }

  const chartData = analytics.value.daily_usage || []
  
  usageChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [
        {
          label: 'API Requests',
          data: chartData.map(item => item.requests),
          borderColor: '#007bff',
          backgroundColor: 'rgba(0, 123, 255, 0.1)',
          tension: 0.4,
          fill: true
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
      interaction: {
        mode: 'index',
        intersect: false,
      },
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
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += context.parsed.y.toLocaleString();
              }
              return label;
            }
          }
        }
      }
    }
  })
}

// Update status chart
const updateStatusChart = () => {
  if (!statusChart.value) return

  const ctx = statusChart.value.getContext('2d')
  
  if (statusChartInstance) {
    statusChartInstance.destroy()
  }

  const apiUsage = analytics.value.api_usage || {}
  const totalRequests = apiUsage.total_requests || 0
  const successfulRequests = apiUsage.successful_requests || 0
  const failedRequests = apiUsage.failed_requests || 0

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Success', 'Failed', 'Other'],
      datasets: [{
        data: [successfulRequests, failedRequests, totalRequests - successfulRequests - failedRequests],
        backgroundColor: ['#28a745', '#dc3545', '#6c757d'],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} (${percentage}%)`;
            }
          }
        }
      }
    }
  })
}

// Update realtime chart
const updateRealtimeChart = () => {
  if (!realtimeChart.value) return

  const ctx = realtimeChart.value.getContext('2d')
  
  if (realtimeChartInstance) {
    realtimeChartInstance.destroy()
  }

  // Generate mock real-time data
  const hours = Array.from({length: 24}, (_, i) => i)
  const requests = hours.map(() => Math.floor(Math.random() * 100) + 20)

  realtimeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hours.map(h => `${h}:00`),
      datasets: [{
        label: 'Requests per Hour',
        data: requests,
        backgroundColor: 'rgba(0, 123, 255, 0.8)',
        borderColor: '#007bff',
        borderWidth: 1
      }]
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
        }
      },
      plugins: {
        legend: {
          display: false
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

// Export chart data
const exportChartData = () => {
  $toast.info('Exporting chart data...')
  // Implementation for export functionality
  setTimeout(() => {
    $toast.success('Data exported successfully')
  }, 1000)
}

// Utility functions
const getErrorRate = () => {
  const apiUsage = analytics.value.api_usage || {}
  const total = apiUsage.total_requests || 0
  const failed = apiUsage.failed_requests || 0
  return total > 0 ? ((failed / total) * 100).toFixed(1) : 0
}

const formatResponseTime = (time) => {
  if (time === null || time === undefined || typeof time !== 'number') {
    return 0
  }
  return time.toFixed(0)
}

const getEndpointPercentage = (count) => {
  const total = analytics.value.api_usage?.total_requests || 0
  return total > 0 ? ((count / total) * 100).toFixed(1) : 0
}

const getErrorPercentage = (count) => {
  const total = analytics.value.api_usage?.failed_requests || 0
  return total > 0 ? ((count / total) * 100).toFixed(1) : 0
}

const getStatusBadgeClass = (statusCode) => {
  if (statusCode >= 200 && statusCode < 300) return 'bg-success'
  if (statusCode >= 400 && statusCode < 500) return 'bg-warning'
  if (statusCode >= 500) return 'bg-danger'
  return 'bg-secondary'
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('id-ID')
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('id-ID')
}

// Usage calculation functions
const getUsagePercentage = (used, limit) => {
  if (limit === -1) return 0 // Unlimited
  if (!limit || limit === 0) return 0
  return Math.min((used / limit) * 100, 100)
}

const getUsageBarClass = (used, limit) => {
  const percentage = getUsagePercentage(used, limit)
  if (percentage >= 90) return 'bg-danger'
  if (percentage >= 75) return 'bg-warning'
  return 'bg-success'
}

const isUsageHigh = (used, limit) => {
  if (limit === -1) return false // Unlimited
  if (!limit || limit === 0) return false
  return (used / limit) >= 0.75
}

// Generate mock data for demo
const generateMockData = () => {
  // Mock recent API calls
  recentApiCalls.value = [
    { id: 1, endpoint: '/api/v1/whatsapp/send-message', status_code: 200, response_time: 150, created_at: new Date() },
    { id: 2, endpoint: '/api/v1/whatsapp/send-template', status_code: 200, response_time: 120, created_at: new Date(Date.now() - 300000) },
    { id: 3, endpoint: '/api/v1/devices/status', status_code: 404, response_time: 50, created_at: new Date(Date.now() - 600000) },
    { id: 4, endpoint: '/api/v1/analytics/user', status_code: 200, response_time: 200, created_at: new Date(Date.now() - 900000) },
    { id: 5, endpoint: '/api/v1/webhooks/test', status_code: 500, response_time: 300, created_at: new Date(Date.now() - 1200000) }
  ]

  // Mock error analysis
  errorAnalysis.value = [
    { status_code: 404, count: 15, trend: 5.2 },
    { status_code: 500, count: 8, trend: -2.1 },
    { status_code: 429, count: 3, trend: 1.8 },
    { status_code: 401, count: 2, trend: 0.5 }
  ]
}

// Initialize data
onMounted(async () => {
  await Promise.all([
    fetchAnalytics(),
    fetchSubscriptionData(),
    fetchUsageData()
  ])
})

// Cleanup charts on unmount
onUnmounted(() => {
  if (usageChartInstance) {
    usageChartInstance.destroy()
  }
  if (statusChartInstance) {
    statusChartInstance.destroy()
  }
  if (realtimeChartInstance) {
    realtimeChartInstance.destroy()
  }
})
</script>

<style scoped>
.analytics-page {
  padding: 1.5rem;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.page-subtitle {
  font-size: 1.1rem;
  margin-bottom: 0;
}

.overview-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  height: 100%;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.overview-content {
  text-align: center;
}

.overview-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.overview-label {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.overview-change {
  font-size: 0.8rem;
  font-weight: 500;
}

.chart-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  height: 100%;
}

.chart-header {
  padding: 1.5rem 1.5rem 0;
  display: flex;
  justify-content: between;
  align-items: center;
}

.chart-title {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0;
}

.chart-actions {
  margin-left: auto;
}

.chart-body {
  padding: 1.5rem;
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

.endpoint-percentage {
  font-weight: 600;
  color: #007bff;
  font-size: 0.9rem;
}

.error-list {
  max-height: 300px;
  overflow-y: auto;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.error-item:last-child {
  border-bottom: none;
}

.error-code {
  width: 60px;
  height: 30px;
  background: #dc3545;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.error-info {
  flex: 1;
}

.error-count {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.error-percentage {
  font-size: 0.8rem;
  color: #6c757d;
}

.error-trend {
  font-weight: 600;
  color: #dc3545;
  font-size: 0.9rem;
}

.table {
  font-size: 0.9rem;
}

.table th {
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
}

.table td {
  vertical-align: middle;
}

.badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.btn-group .btn.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
}

/* Subscription and Usage Styles */
.subscription-info {
  text-align: center;
}

.subscription-plan {
  margin-bottom: 1.5rem;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.plan-price {
  font-size: 1.2rem;
  font-weight: 600;
  color: #007bff;
  margin-bottom: 0.5rem;
}

.plan-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.subscription-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.usage-limits {
  /* space-y equivalent */
}

.usage-item {
  margin-bottom: 1.5rem;
}

.usage-item:last-child {
  margin-bottom: 0;
}

.usage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.usage-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #495057;
}

.usage-count {
  font-weight: 600;
  color: #007bff;
  font-size: 0.9rem;
}

.usage-warning {
  display: flex;
  align-items: center;
  margin-top: 0.25rem;
}

.progress {
  border-radius: 0.5rem;
  background-color: #e9ecef;
}

.progress-bar {
  border-radius: 0.5rem;
  transition: width 0.3s ease;
}

@media (max-width: 768px) {
  .analytics-page {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .overview-number {
    font-size: 1.5rem;
  }
  
  .chart-header {
    padding: 1rem 1rem 0;
  }
  
  .chart-body {
    padding: 1rem;
  }
}
</style> 