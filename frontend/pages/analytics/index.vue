<template>
  <div class="analytics-page">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0">
            <i class="bi bi-graph-up me-2"></i>
            Analytics Dashboard
          </h1>
          <p class="text-muted mb-0">Message statistics and insights</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="row g-4 mb-4">
        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title text-muted">Total Messages</h6>
              <h3 class="mb-0">{{ stats.totalMessages }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title text-muted">Sent Messages</h6>
              <h3 class="mb-0">{{ stats.sentMessages }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title text-muted">Received Messages</h6>
              <h3 class="mb-0">{{ stats.receivedMessages }}</h3>
            </div>
          </div>
        </div>

        <div class="col-md-3">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title text-muted">Delivery Rate</h6>
              <h3 class="mb-0">{{ stats.deliveryRate }}%</h3>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="row g-4">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Message Activity</h5>
            </div>
            <div class="card-body">
              <canvas ref="messageChart"></canvas>
            </div>
          </div>
        </div>

        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Message Types</h5>
            </div>
            <div class="card-body">
              <canvas ref="typeChart"></canvas>
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

const stats = ref({
  totalMessages: 0,
  sentMessages: 0,
  receivedMessages: 0,
  deliveryRate: 0
})

const loadAnalytics = async () => {
  try {
    const response = await $fetch('/api/v1/analytics')
    stats.value = response.stats || stats.value
  } catch (error) {
    console.error('Error loading analytics:', error)
  }
}

onMounted(() => {
  loadAnalytics()
})
</script>

<style scoped>
.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.device-status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.device-status.connected {
  background: #28a745;
}

.device-status.disconnected {
  background: #dc3545;
}

.device-status.connecting {
  background: #ffc107;
}

.device-status.error {
  background: #dc3545;
}
</style> 