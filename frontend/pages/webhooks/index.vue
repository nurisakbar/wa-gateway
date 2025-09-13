<template>
  <div class="webhooks-page">
    <div class="page-header mb-4">
      <div class="row align-items-center">
        <div class="col-md-8">
          <h1 class="page-title">
            <i class="bi bi-webhook me-2"></i>
            Webhook Management
          </h1>
          <p class="page-subtitle text-muted">
            Kelola webhook untuk menerima notifikasi real-time
          </p>
        </div>
        <div class="col-md-4 text-end">
          <button class="btn btn-primary" @click="showCreateModal = true">
            <i class="bi bi-plus me-2"></i>
            Create Webhook
          </button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">
              <i class="bi bi-list me-2"></i>
              Your Webhooks
            </h5>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
              <p class="mt-2 text-muted">Loading webhooks...</p>
            </div>

            <div v-else-if="webhooks.length === 0" class="text-center py-5">
              <i class="bi bi-webhook text-muted fs-1 mb-3 d-block"></i>
              <h5 class="text-muted mb-2">No Webhooks Found</h5>
              <p class="text-muted mb-4">Create your first webhook to receive real-time notifications</p>
              <button class="btn btn-primary" @click="showCreateModal = true">
                <i class="bi bi-plus me-2"></i>
                Create First Webhook
              </button>
            </div>

            <div v-else class="webhooks-list">
              <div v-for="webhook in webhooks" :key="webhook.id" class="webhook-item">
                <div class="webhook-header">
                  <div class="webhook-info">
                    <h6 class="webhook-name">{{ webhook.name }}</h6>
                    <div class="webhook-url">
                      <code>{{ webhook.url }}</code>
                    </div>
                  </div>
                  <div class="webhook-status">
                    <span class="badge" :class="webhook.is_active ? 'bg-success' : 'bg-secondary'">
                      {{ webhook.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>

                <div class="webhook-details">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Events:</span>
                        <div class="events-list">
                          <span v-for="event in webhook.events" :key="event" class="badge bg-primary me-1">
                            {{ event }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Retry Count:</span>
                        <span class="detail-value">{{ webhook.retry_count }} times</span>
                      </div>
                    </div>
                  </div>

                  <div class="row mt-2">
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Created:</span>
                        <span class="detail-value">{{ formatDate(webhook.created_at) }}</span>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="detail-item">
                        <span class="detail-label">Last Delivery:</span>
                        <span class="detail-value">
                          {{ webhook.last_delivery_at ? formatDate(webhook.last_delivery_at) : 'Never' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="webhook-actions">
                  <button class="btn btn-sm btn-outline-primary" @click="viewWebhook(webhook)">
                    <i class="bi bi-eye me-1"></i>View
                  </button>
                  <button class="btn btn-sm btn-outline-warning" @click="editWebhook(webhook)">
                    <i class="bi bi-pencil me-1"></i>Edit
                  </button>
                  <button class="btn btn-sm btn-outline-info" @click="testWebhook(webhook)">
                    <i class="bi bi-play me-1"></i>Test
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="toggleWebhook(webhook)">
                    <i class="bi" :class="webhook.is_active ? 'bi-pause' : 'bi-play'"></i>
                    {{ webhook.is_active ? 'Disable' : 'Enable' }}
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="deleteWebhook(webhook)">
                    <i class="bi bi-trash me-1"></i>Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal -->
    <div class="modal fade" :class="{ show: showCreateModal }" :style="{ display: showCreateModal ? 'block' : 'none' }" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingWebhook ? 'Edit Webhook' : 'Create Webhook' }}</h5>
            <button type="button" class="btn-close" @click="closeCreateModal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Name *</label>
                <input class="form-control" v-model="form.name" placeholder="My Webhook" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Status</label>
                <select class="form-select" v-model="form.is_active">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Callback URL *</label>
                <input class="form-control" v-model="form.url" placeholder="https://example.com/webhook" />
                <small class="text-muted">Pastikan URL dapat menerima POST request dari server</small>
              </div>
              <div class="col-md-6">
                <label class="form-label">Secret (optional)</label>
                <input class="form-control" v-model="form.secret" placeholder="Used to sign payloads" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Retry Count</label>
                <input type="number" min="0" class="form-control" v-model.number="form.retry_count" />
              </div>
              <div class="col-12">
                <label class="form-label">Events *</label>
                <div class="d-flex flex-wrap gap-2">
                  <label v-for="event in availableEvents" :key="event" class="badge bg-light border text-dark p-2">
                    <input class="form-check-input me-2" type="checkbox" :value="event" v-model="form.events" /> {{ event }}
                  </label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeCreateModal">Cancel</button>
            <button class="btn btn-primary" :disabled="!canSubmit || saving" @click="saveWebhook">
              <span v-if="saving" class="spinner-border spinner-border-sm me-2"></span>
              {{ editingWebhook ? 'Save Changes' : 'Create Webhook' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showCreateModal" class="modal-backdrop fade show" @click="closeCreateModal"></div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { $toast } = useNuxtApp()

const loading = ref(false)
const webhooks = ref([])
const showCreateModal = ref(false)
const saving = ref(false)
const editingWebhook = ref(null)
const availableEvents = [
  'message.received',
  'message.sent',
  'device.connected',
  'device.disconnected'
]

const form = ref({
  name: '',
  url: '',
  events: ['message.received'],
  secret: '',
  is_active: true,
  retry_count: 0
})

const fetchWebhooks = async () => {
  loading.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    const response = await $fetch(`${config.public.apiBase}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      const raw = response.data
      webhooks.value = Array.isArray(raw) ? raw : (raw?.webhooks || [])
    }
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    $toast.error('Gagal memuat webhooks')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('id-ID')
}

onMounted(() => {
  fetchWebhooks()
})

const canSubmit = computed(() => form.value.name && form.value.url && form.value.events.length > 0)

const closeCreateModal = () => {
  showCreateModal.value = false
  editingWebhook.value = null
  form.value = { name: '', url: '', events: ['message.received'], secret: '', is_active: true, retry_count: 0 }
}

const saveWebhook = async () => {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    const url = editingWebhook.value
      ? `${config.public.apiBase}/webhooks/${editingWebhook.value.id}`
      : `${config.public.apiBase}/webhooks`
    const method = editingWebhook.value ? 'PUT' : 'POST'

    const res = await $fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: { ...form.value }
    })

    if (res.success) {
      $toast.success(editingWebhook.value ? 'Webhook updated' : 'Webhook created')
      closeCreateModal()
      await fetchWebhooks()
    } else {
      $toast.error(res.message || 'Failed to save webhook')
    }
  } catch (err) {
    console.error('Save webhook error:', err)
    $toast.error(err?.data?.message || err.message || 'Failed to save webhook')
  } finally {
    saving.value = false
  }
}

const viewWebhook = (w) => {}
const editWebhook = (w) => { editingWebhook.value = w; form.value = { name: w.name, url: w.url, events: w.events || [], secret: w.secret || '', is_active: !!w.is_active, retry_count: w.retry_count || 0 }; showCreateModal.value = true }
const testWebhook = async (w) => {}
const toggleWebhook = async (w) => {}
const deleteWebhook = async (w) => {}
</script>

<style scoped>
.webhooks-page {
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

.webhook-item {
  border: 1px solid #e9ecef;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: white;
  transition: box-shadow 0.2s;
}

.webhook-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.webhook-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.webhook-name {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #2c3e50;
}

.webhook-url {
  font-family: monospace;
  color: #6c757d;
  font-size: 0.9rem;
}

.webhook-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
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

.events-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
</style> 