<template>
  <div class="templates-page">
    <div class="container-fluid">
      <!-- Header -->
      <div class="page-header bg-white border-bottom rounded-3 mb-4">
        <div class="d-flex justify-content-between align-items-center py-3 px-2">
          <div>
            <nav aria-label="breadcrumb" class="mb-1">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                  <NuxtLink to="/dashboard" class="text-decoration-none">
                    <i class="bi bi-house-door me-1"></i>Dashboard
                  </NuxtLink>
                </li>
                <li class="breadcrumb-item active" aria-current="page">Templates</li>
              </ol>
            </nav>
            <h1 class="h3 mb-0 text-dark fw-bold">
              <i class="bi bi-file-text me-2 text-primary"></i>Message Templates
            </h1>
            <p class="text-muted mb-0">Manage and create reusable WhatsApp message templates</p>
          </div>
          <button class="btn btn-primary d-flex align-items-center" @click="showCreateModal = true">
            <i class="bi bi-plus-circle me-2"></i><span>Create Template</span>
          </button>
        </div>
      </div>

      <!-- Templates Grid -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-bottom d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0"><i class="bi bi-list-ul me-2"></i>Templates</h5>
          <button class="btn btn-outline-primary btn-sm d-flex align-items-center" @click="showCreateModal = true"><i class="bi bi-plus-circle me-1"></i><span>New</span></button>
        </div>
        <div class="card-body">
          <div v-if="templates.length === 0" class="text-center py-5">
            <i class="bi bi-file-text text-muted fs-1 mb-3 d-block"></i>
            <h5 class="text-dark mb-2">No templates yet</h5>
            <p class="text-muted mb-3">Create your first template to speed up sending messages</p>
            <button class="btn btn-primary d-inline-flex align-items-center" @click="showCreateModal = true"><i class="bi bi-plus-circle me-1"></i><span>Create Template</span></button>
          </div>
          <div v-else class="row g-4">
            <div v-for="template in templates" :key="template.id" class="col-md-6 col-lg-4">
              <div class="card template-card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <span class="badge text-uppercase" :class="getStatusBadgeClass(template.status)">{{ template.status }}</span>
                  <small class="text-muted">{{ template.category }}</small>
                </div>
                <div class="card-body">
                  <h6 class="card-title fw-semibold">{{ template.name }}</h6>
                  <p class="card-text text-muted">{{ template.description }}</p>
                  <div class="template-content">{{ template.content }}</div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                  <button class="btn btn-sm btn-outline-primary" @click="useTemplate(template)"><i class="bi bi-arrow-right-circle me-1"></i>Use</button>
                  <button class="btn btn-sm btn-outline-secondary"><i class="bi bi-pencil me-1"></i>Edit</button>
                </div>
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
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/templates`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      templates.value = response.data.templates || []
    }
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

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
}
</style> 