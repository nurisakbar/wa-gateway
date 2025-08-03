<template>
  <div class="templates-page">
    <div class="container-fluid">
      <!-- Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0">
            <i class="bi bi-file-text me-2"></i>
            Message Templates
          </h1>
          <p class="text-muted mb-0">Manage and create message templates</p>
        </div>
        <button class="btn btn-primary" @click="showCreateModal = true">
          <i class="bi bi-plus-lg me-2"></i>
          Create Template
        </button>
      </div>

      <!-- Templates Grid -->
      <div class="row g-4">
        <div v-for="template in templates" :key="template.id" class="col-md-6 col-lg-4">
          <div class="card template-card h-100">
            <div class="card-header">
              <span class="badge" :class="getStatusBadgeClass(template.status)">
                {{ template.status }}
              </span>
            </div>
            
            <div class="card-body">
              <h6 class="card-title">{{ template.name }}</h6>
              <p class="card-text">{{ template.description }}</p>
              <div class="template-content">
                {{ template.content }}
              </div>
            </div>
            
            <div class="card-footer">
              <div class="d-flex justify-content-between">
                <small class="text-muted">{{ template.category }}</small>
                <button class="btn btn-sm btn-primary" @click="useTemplate(template)">
                  Use Template
                </button>
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

const templates = ref([])
const showCreateModal = ref(false)

const loadTemplates = async () => {
  try {
    const response = await $fetch('/api/v1/templates')
    templates.value = response.data || []
  } catch (error) {
    console.error('Error loading templates:', error)
  }
}

const getStatusBadgeClass = (status) => {
  const classes = {
    draft: 'bg-secondary',
    pending: 'bg-warning',
    approved: 'bg-success',
    rejected: 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

const useTemplate = (template) => {
  navigateTo(`/messages?template=${template.id}`)
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.template-card {
  transition: transform 0.2s;
}

.template-card:hover {
  transform: translateY(-2px);
}

.template-content {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  max-height: 100px;
  overflow: hidden;
}
</style> 