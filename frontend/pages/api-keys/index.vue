<template>
  <div class="api-keys-page">
    <!-- Header -->
    <div class="page-header mb-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h1 class="page-title">
            <i class="bi bi-key me-2"></i>
            API Key Management
          </h1>
          <p class="page-subtitle text-muted">
            Kelola API key untuk mengakses WhatsApp Gateway API
          </p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" @click="showCreateModal = true">
            <i class="bi bi-plus me-2"></i>
            Create API Key
          </button>
        </div>
      </div>
    </div>

    <!-- API Keys List -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-list me-2"></i>
              Your API Keys
            </h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2 text-muted">Loading API keys...</p>
            </div>

            <div v-else-if="apiKeys.length === 0" class="text-center py-5">
              <div class="empty-state">
                <i class="bi bi-key text-muted fs-1 mb-3 d-block"></i>
                <h5 class="text-muted mb-2">No API Keys Found</h5>
                <p class="text-muted mb-4">Create your first API key to start using the WhatsApp Gateway API</p>
                <button class="btn btn-primary" @click="showCreateModal = true">
                  <i class="bi bi-plus me-2"></i>
                  Create First API Key
                </button>
              </div>
            </div>

            <div v-else class="api-keys-list">
              <div 
                v-for="apiKey in apiKeys" 
                :key="apiKey.id"
                class="api-key-item"
              >
                <div class="api-key-header">
                  <div class="api-key-info">
                    <h6 class="api-key-name">{{ apiKey.name }}</h6>
                    <div class="api-key-prefix">
                      <code>{{ apiKey.key_prefix }}...</code>
                    </div>
                  </div>
                  <div class="api-key-status">
                    <span class="badge" :class="apiKey.is_active ? 'bg-success' : 'bg-secondary'">
                      {{ apiKey.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>

                <div class="api-key-details">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Permissions:</span>
                        <div class="permissions-list">
                          <span 
                            v-for="(value, key) in apiKey.permissions" 
                            :key="key"
                            class="badge bg-light text-dark me-1"
                          >
                            {{ key }}: {{ value ? 'Yes' : 'No' }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Rate Limit:</span>
                        <span class="detail-value">{{ apiKey.rate_limit || 'Unlimited' }} requests/hour</span>
                      </div>
                    </div>
                  </div>

                  <div class="row mt-2">
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">{{ formatDate(apiKey.created_at) }}</span>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Last Used:</span>
                        <span class="detail-value">
                          {{ apiKey.last_used_at ? formatDate(apiKey.last_used_at) : 'Never' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div v-if="apiKey.expires_at" class="row mt-2">
                    <div class="col-12">
                      <div class="detail-item">
                        <span class="detail-label">Expires:</span>
                        <span class="detail-value" :class="isExpired(apiKey.expires_at) ? 'text-danger' : ''">
                          {{ formatDate(apiKey.expires_at) }}
                          <span v-if="isExpired(apiKey.expires_at)" class="badge bg-danger ms-2">Expired</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="api-key-actions">
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    @click="viewApiKey(apiKey)"
                  >
                    <i class="bi bi-eye me-1"></i>
                    View
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-warning"
                    @click="editApiKey(apiKey)"
                  >
                    <i class="bi bi-pencil me-1"></i>
                    Edit
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-info"
                    @click="regenerateApiKey(apiKey)"
                  >
                    <i class="bi bi-arrow-clockwise me-1"></i>
                    Regenerate
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-secondary"
                    @click="toggleApiKey(apiKey)"
                  >
                    <i class="bi" :class="apiKey.is_active ? 'bi-pause' : 'bi-play'"></i>
                    {{ apiKey.is_active ? 'Disable' : 'Enable' }}
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger"
                    @click="deleteApiKey(apiKey)"
                  >
                    <i class="bi bi-trash me-1"></i>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal fade" :class="{ show: showCreateModal || showEditModal }" :style="{ display: (showCreateModal || showEditModal) ? 'block' : 'none' }">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-key me-2"></i>
              {{ showEditModal ? 'Edit API Key' : 'Create New API Key' }}
            </h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitForm">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">API Key Name *</label>
                    <input 
                      v-model="form.name"
                      type="text" 
                      class="form-control"
                      placeholder="e.g., Production API Key"
                      required
                    >
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Rate Limit (requests/hour)</label>
                    <input 
                      v-model="form.rate_limit"
                      type="number" 
                      class="form-control"
                      placeholder="1000"
                      min="1"
                    >
                    <div class="form-text">Leave empty for unlimited</div>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Permissions</label>
                <div class="row">
                  <div class="col-md-4">
                    <div class="form-check">
                      <input 
                        v-model="form.permissions.read"
                        type="checkbox" 
                        class="form-check-input"
                        id="perm-read"
                      >
                      <label class="form-check-label" for="perm-read">
                        Read Access
                      </label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-check">
                      <input 
                        v-model="form.permissions.write"
                        type="checkbox" 
                        class="form-check-input"
                        id="perm-write"
                      >
                      <label class="form-check-label" for="perm-write">
                        Write Access
                      </label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-check">
                      <input 
                        v-model="form.permissions.admin"
                        type="checkbox" 
                        class="form-check-input"
                        id="perm-admin"
                      >
                      <label class="form-check-label" for="perm-admin">
                        Admin Access
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">IP Whitelist</label>
                    <textarea 
                      v-model="form.ip_whitelist"
                      class="form-control"
                      rows="3"
                      placeholder="192.168.1.1&#10;10.0.0.0/8"
                    ></textarea>
                    <div class="form-text">One IP per line. Leave empty for no restrictions</div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Expiration Date</label>
                    <input 
                      v-model="form.expires_at"
                      type="datetime-local" 
                      class="form-control"
                    >
                    <div class="form-text">Leave empty for no expiration</div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal">Cancel</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="submitForm"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              {{ showEditModal ? 'Update API Key' : 'Create API Key' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View API Key Modal -->
    <div class="modal fade" :class="{ show: showViewModal }" :style="{ display: showViewModal ? 'block' : 'none' }">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              <i class="bi bi-eye me-2"></i>
              API Key Details
            </h5>
            <button type="button" class="btn-close" @click="closeViewModal"></button>
          </div>
          <div class="modal-body">
            <div v-if="selectedApiKey" class="api-key-details-view">
              <div class="mb-3">
                <label class="form-label fw-bold">API Key (Full)</label>
                <div class="input-group">
                  <input 
                    :value="selectedApiKey.full_key || selectedApiKey.key_prefix + '...'"
                    type="text" 
                    class="form-control"
                    readonly
                  >
                  <button 
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="copyToClipboard(selectedApiKey.full_key || selectedApiKey.key_prefix + '...')"
                  >
                    <i class="bi bi-clipboard"></i>
                  </button>
                </div>
                <div class="form-text text-warning">
                  <i class="bi bi-exclamation-triangle me-1"></i>
                  Copy this key now. You won't be able to see it again!
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="detail-item">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">{{ selectedApiKey.name }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span class="badge" :class="selectedApiKey.is_active ? 'bg-success' : 'bg-secondary'">
                      {{ selectedApiKey.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="detail-item">
                    <span class="detail-label">Created:</span>
                    <span class="detail-value">{{ formatDate(selectedApiKey.created_at) }}</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="detail-item">
                    <span class="detail-label">Last Used:</span>
                    <span class="detail-value">
                      {{ selectedApiKey.last_used_at ? formatDate(selectedApiKey.last_used_at) : 'Never' }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="detail-item">
                    <span class="detail-label">Rate Limit:</span>
                    <span class="detail-value">{{ selectedApiKey.rate_limit || 'Unlimited' }} requests/hour</span>
                  </div>
                </div>
                <div class="col-md-6" v-if="selectedApiKey.expires_at">
                  <div class="detail-item">
                    <span class="detail-label">Expires:</span>
                    <span class="detail-value" :class="isExpired(selectedApiKey.expires_at) ? 'text-danger' : ''">
                      {{ formatDate(selectedApiKey.expires_at) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <span class="detail-label">Permissions:</span>
                <div class="permissions-list mt-1">
                  <span 
                    v-for="(value, key) in selectedApiKey.permissions" 
                    :key="key"
                    class="badge bg-light text-dark me-1"
                  >
                    {{ key }}: {{ value ? 'Yes' : 'No' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeViewModal">Close</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Backdrop -->
    <div 
      v-if="showCreateModal || showEditModal || showViewModal"
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

const { $toast } = useNuxtApp()

// Reactive data
const loading = ref(false)
const submitting = ref(false)
const apiKeys = ref([])
const selectedApiKey = ref(null)

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showViewModal = ref(false)

// Form data
const form = ref({
  name: '',
  permissions: {
    read: true,
    write: false,
    admin: false
  },
  rate_limit: '',
  ip_whitelist: '',
  expires_at: ''
})

// Fetch API keys
const fetchApiKeys = async () => {
  loading.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/api-keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      apiKeys.value = response.data.apiKeys || []
    }
  } catch (error) {
    console.error('Error fetching API keys:', error)
    $toast.error('Gagal memuat API keys')
  } finally {
    loading.value = false
  }
}

// Create API key
const createApiKey = async () => {
  submitting.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/api-keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: form.value
    })
    
    if (response.success) {
      $toast.success('API key berhasil dibuat')
      closeModal()
      await fetchApiKeys()
      
      // Show the full key to user
      selectedApiKey.value = response.data
      showViewModal.value = true
    }
  } catch (error) {
    console.error('Error creating API key:', error)
    $toast.error('Gagal membuat API key')
  } finally {
    submitting.value = false
  }
}

// Update API key
const updateApiKey = async () => {
  submitting.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/api-keys/${selectedApiKey.value.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: selectedApiKey.value
    })
    
    if (response.success) {
      $toast.success('API key berhasil diperbarui')
      closeModal()
      await fetchApiKeys()
    }
  } catch (error) {
    console.error('Error updating API key:', error)
    $toast.error('Gagal memperbarui API key')
  } finally {
    submitting.value = false
  }
}

// Delete API key
const deleteApiKey = async (apiKey) => {
  if (!confirm(`Are you sure you want to delete the API key "${apiKey.name}"?`)) {
    return
  }
  
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/api-keys/${apiKey.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      $toast.success('API key berhasil dihapus')
      await fetchApiKeys()
    }
  } catch (error) {
    console.error('Error deleting API key:', error)
    $toast.error('Gagal menghapus API key')
  }
}

// Regenerate API key
const regenerateApiKey = async (apiKey) => {
  if (!confirm(`Are you sure you want to regenerate the API key "${apiKey.name}"? The old key will be invalidated.`)) {
    return
  }
  
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/api-keys/${apiKey.id}/regenerate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      $toast.success('API key berhasil diregenerasi')
      await fetchApiKeys()
      
      // Show the new key to user
      selectedApiKey.value = response.data
      showViewModal.value = true
    }
  } catch (error) {
    console.error('Error regenerating API key:', error)
    $toast.error('Gagal meregenerasi API key')
  }
}

// Toggle API key status
const toggleApiKey = async (apiKey) => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/api-keys/${apiKey.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        is_active: !apiKey.is_active
      }
    })
    
    if (response.success) {
      $toast.success(`API key berhasil ${apiKey.is_active ? 'dinonaktifkan' : 'diaktifkan'}`)
      await fetchApiKeys()
    }
  } catch (error) {
    console.error('Error toggling API key:', error)
    $toast.error('Gagal mengubah status API key')
  }
}

// View API key
const viewApiKey = (apiKey) => {
  selectedApiKey.value = apiKey
  showViewModal.value = true
}

// Edit API key
const editApiKey = (apiKey) => {
  selectedApiKey.value = apiKey
  form.value = {
    name: apiKey.name,
    permissions: { ...apiKey.permissions },
    rate_limit: apiKey.rate_limit || '',
    ip_whitelist: apiKey.ip_whitelist || '',
    expires_at: apiKey.expires_at ? new Date(apiKey.expires_at).toISOString().slice(0, 16) : ''
  }
  showEditModal.value = true
}

// Submit form
const submitForm = () => {
  if (showEditModal.value) {
    updateApiKey()
  } else {
    createApiKey()
  }
}

// Close modals
const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  resetForm()
}

const closeViewModal = () => {
  showViewModal.value = false
  selectedApiKey.value = null
}

// Reset form
const resetForm = () => {
  form.value = {
    name: '',
    permissions: {
      read: true,
      write: false,
      admin: false
    },
    rate_limit: '',
    ip_whitelist: '',
    expires_at: ''
  }
  selectedApiKey.value = null
}

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('id-ID')
}

const isExpired = (dateString) => {
  return new Date(dateString) < new Date()
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    $toast.success('API key berhasil disalin ke clipboard')
  } catch (error) {
    console.error('Error copying to clipboard:', error)
    $toast.error('Gagal menyalin API key')
  }
}

// Initialize data
onMounted(() => {
  fetchApiKeys()
})
</script>

<style scoped>
.api-keys-page {
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

.api-keys-list {
  max-height: 600px;
  overflow-y: auto;
}

.api-key-item {
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: white;
  transition: box-shadow 0.2s;
}

.api-key-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.api-key-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.api-key-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.api-key-prefix {
  font-family: monospace;
  color: #6c757d;
  font-size: 0.9rem;
}

.api-key-details {
  margin-bottom: 1rem;
}

.detail-item {
  margin-bottom: 0.5rem;
}

.detail-label {
  font-weight: 600;
  color: #495057;
  margin-right: 0.5rem;
}

.detail-value {
  color: #6c757d;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.api-key-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  padding: 3rem 1rem;
}

.empty-state i {
  opacity: 0.5;
}

.modal {
  z-index: 1050;
}

.modal-backdrop {
  z-index: 1040;
}

.api-key-details-view .detail-item {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .api-keys-page {
    padding: 1rem;
  }
  
  .page-header {
    padding: 1.5rem;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .api-key-header {
    flex-direction: column;
    gap: 1rem;
  }
  
  .api-key-actions {
    justify-content: center;
  }
  
  .api-key-actions .btn {
    flex: 1;
    min-width: 80px;
  }
}
</style> 