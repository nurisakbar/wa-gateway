<template>
  <div class="templates-page">
    <!-- Statistics Cards -->
    <div class="container-fluid py-4" v-if="showStats" style="padding-bottom: 0px !important;">
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-file-text text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ totalTemplates }}</div>
              <div class="stat-label text-muted">Total Templates</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ approvedTemplates }}</div>
              <div class="stat-label text-muted">Approved</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-clock text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ pendingTemplates }}</div>
              <div class="stat-label text-muted">Pending</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-tags text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ uniqueCategories }}</div>
              <div class="stat-label text-muted">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid">
      <!-- Templates Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-file-text me-2 text-primary"></i>
              Templates
            </h5>
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-primary d-flex align-items-center"
                @click="refreshTemplates"
                :disabled="isLoading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
              <button
                class="btn btn-primary d-flex align-items-center"
                @click="showCreateModal = true"
                :disabled="isLoading"
              >
                <i class="bi bi-plus-circle me-1"></i>
                Create Template
              </button>
            </div>
          </div>
        </div>
              
              <!-- Filter Section -->
              <div class="filter-section bg-light border-top border-bottom py-3 px-4">
                <div class="row align-items-center">
                  <div class="col-md-4 mb-2 mb-md-0">
                    <div class="input-group">
                      <span class="input-group-text bg-white border-end-0">
                        <i class="bi bi-search text-muted"></i>
                      </span>
                      <input
                        type="text"
                        class="form-control border-start-0"
                        placeholder="Search templates..."
                        v-model="searchQuery"
                      />
                    </div>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="statusFilter">
                      <option value="">All Status</option>
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="categoryFilter">
                      <option value="">All Categories</option>
                      <option value="utility">Utility</option>
                      <option value="marketing">Marketing</option>
                      <option value="authentication">Authentication</option>
                    </select>
                  </div>
                  <div class="col-md-2 mb-2 mb-md-0">
                    <button class="btn btn-outline-secondary w-100" @click="clearFilters">
                      <i class="bi bi-x-circle me-1"></i>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="isLoading" class="text-center py-5">
            <div class="loading-spinner mx-auto mb-3"></div>
            <h6 class="text-muted mb-0">Loading templates...</h6>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="templates.length === 0" class="empty-state text-center py-5">
            <i class="bi bi-file-text text-muted fs-1 mb-3 d-block"></i>
            <h5 class="text-dark mb-2">No templates yet</h5>
            <p class="text-muted mb-3">Create your first template to speed up sending messages</p>
            <button class="btn btn-primary d-inline-flex align-items-center" @click="showCreateModal = true">
              <i class="bi bi-plus-circle me-1"></i>
              <span>Create Template</span>
            </button>
          </div>
          
          <!-- Templates Table -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4"><i class="bi bi-circle me-2 text-muted"></i>Status</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-file-text me-2 text-muted"></i>Name</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-tags me-2 text-muted"></i>Category</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-chat-text me-2 text-muted"></i>Content</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-clock me-2 text-muted"></i>Updated</th>
                  <th class="border-0 py-3 px-4 text-end"><i class="bi bi-gear me-2 text-muted"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="template in filteredTemplates" :key="template.id">
                  <td class="px-4 py-3">
                    <span class="badge text-uppercase" :class="getStatusBadgeClass(template.status)">{{ template.status }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <div class="fw-semibold">{{ template.name }}</div>
                      <small class="text-muted">{{ template.description }}</small>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-capitalize">{{ template.category }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="template-content-table">
                      <pre class="mb-0">{{ template.content }}</pre>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ formatDate(template.updated_at) }}</small>
                  </td>
                  <td class="px-4 py-3 text-end">
                    <div class="d-flex gap-2 justify-content-end">
                      <button class="btn btn-sm btn-outline-primary d-flex align-items-center" @click="useTemplate(template)" title="Use Template">
                        <i class="bi bi-arrow-right-circle me-1"></i><span>Use</span>
                      </button>
                      <button class="btn btn-sm btn-outline-secondary d-flex align-items-center" @click="editTemplate(template)" title="Edit Template">
                        <i class="bi bi-pencil me-1"></i><span>Edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div class="modal fade" :class="{ show: showCreateModal }" :style="{ display: showCreateModal ? 'block' : 'none' }" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ editingTemplate ? 'Edit Template' : 'Create Template' }}</h5>
              <button type="button" class="btn-close" @click="closeCreateModal"></button>
            </div>
            <div class="modal-body">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label">Name *</label>
                  <input class="form-control" v-model="form.name" placeholder="Welcome Template" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Category</label>
                  <select class="form-select" v-model="form.category">
                    <option value="utility">Utility</option>
                    <option value="marketing">Marketing</option>
                    <option value="authentication">Authentication</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Status</label>
                  <select class="form-select" v-model="form.status">
                    <option value="draft">Draft</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
                <div class="col-12">
                  <label class="form-label">Description</label>
                  <input class="form-control" v-model="form.description" placeholder="Short description" />
                </div>
                <div class="col-12">
                  <label class="form-label">Content *</label>
                  <textarea class="form-control" rows="5" v-model="form.content" placeholder="Hi {{name}}, ..."></textarea>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeCreateModal">Cancel</button>
              <button class="btn btn-primary" :disabled="!form.name || !form.content" @click="saveTemplate">
                {{ editingTemplate ? 'Save Changes' : 'Create Template' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="showCreateModal" class="modal-backdrop fade show" @click="closeCreateModal"></div>
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
const editingTemplate = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const form = ref({ name: '', category: 'utility', status: 'draft', description: '', content: '' })
const isLoading = ref(false)
const showStats = ref(true)

const refreshTemplates = async () => {
  await loadTemplates()
  const { $toast } = useNuxtApp()
  $toast?.success('Templates refreshed')
}

const loadTemplates = async () => {
  try {
    isLoading.value = true
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
// console.error('Error loading templates:', error)
  } finally {
    isLoading.value = false
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

const editTemplate = (template) => {
  editingTemplate.value = template
  form.value = { 
    name: template.name, 
    category: template.category || 'utility', 
    status: template.status || 'draft', 
    description: template.description || '', 
    content: template.content || '' 
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  editingTemplate.value = null
  form.value = { name: '', category: 'utility', status: 'draft', description: '', content: '' }
}

const saveTemplate = async () => {
  try {
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    const url = editingTemplate.value ? `${config.public.apiBase}/templates/${editingTemplate.value.id}` : `${config.public.apiBase}/templates`
    const method = editingTemplate.value ? 'PUT' : 'POST'
    const payload = { ...form.value }

    const response = await $fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: payload
    })
    if (response.success) {
      await loadTemplates()
      closeCreateModal()
      const { $toast } = useNuxtApp()
      $toast?.success(editingTemplate.value ? 'Template updated' : 'Template created')
    }
  } catch (error) {
// console.error('Save template error:', error)
    const { $toast } = useNuxtApp()
    $toast?.error('Failed to save template')
  }
}

const filteredTemplates = computed(() => {
  let list = templates.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => (t.name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.content || '').toLowerCase().includes(q))
  }
  if (statusFilter.value) list = list.filter(t => (t.status || '').toLowerCase() === statusFilter.value)
  if (categoryFilter.value) list = list.filter(t => (t.category || '').toLowerCase() === categoryFilter.value)
  return list
})

const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  categoryFilter.value = ''
}

// Computed properties for statistics
const totalTemplates = computed(() => templates.value.length)
const approvedTemplates = computed(() => templates.value.filter(t => t.status === 'approved').length)
const pendingTemplates = computed(() => templates.value.filter(t => t.status === 'pending').length)
const uniqueCategories = computed(() => {
  const categories = new Set()
  templates.value.forEach(template => {
    if (template.category) {
      categories.add(template.category)
    }
  })
  return categories.size
})

const counts = computed(() => {
  const acc = { draft: 0, pending: 0, approved: 0, rejected: 0 }
  templates.value.forEach(t => {
    const s = (t.status || '').toLowerCase()
    if (acc[s] !== undefined) acc[s]++
  })
  return acc
})

const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString() } catch { return '-' }
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.templates-page {
  min-height: 100vh;
  background-color: var(--light-color);
  overflow-x: hidden;
}

.filter-section {
  background: #f8f9fa !important;
  border-top: 1px solid #dee2e6;
  border-bottom: 1px solid #dee2e6;
}

.filter-section .input-group-text {
  background: white;
  border-color: #ced4da;
}

.filter-section .form-control,
.filter-section .form-select {
  border-color: #ced4da;
  font-size: 0.875rem;
}

.filter-section .form-control:focus,
.filter-section .form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
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
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.2;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-responsive .table {
  margin-bottom: 0;
  width: 100%;
  min-width: 600px;
}

.overview-toolbar .chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f7fa;
  border: 1px solid #eef0f3;
  color: #475569;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: .85rem;
}
.overview-toolbar .chip strong { color: #111827; margin-left: 2px; }
.chip-approved { background: #e9f9ef; border-color: #d3f1df; color: #0f766e; }
.chip-pending { background: #fff7ed; border-color: #ffedd5; color: #b45309; }
.chip-rejected { background: #fef2f2; border-color: #fee2e2; color: #b91c1c; }
.chip-draft { background: #f3f4f6; border-color: #e5e7eb; color: #374151; }

.view-toggle .btn { border-radius: 10px; }

.template-card {
  transition: transform 0.2s;
  border: 1px solid #ecedf0;
  border-radius: 14px;
  overflow: hidden;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(30, 41, 59, 0.08);
}

.template-card .card-header { padding: .75rem 1rem; }
.template-card .card-body { padding: 1.5rem 1.5rem 1rem 1.5rem; }

.template-content {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 16px 18px;
  max-height: 140px;
  overflow: hidden;
  margin-top: .25rem;
}

.template-content-table {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 14px;
  max-height: 100px;
  overflow: hidden;
}

.template-content pre { 
  white-space: pre-wrap; 
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; 
  font-size: .9rem; color: #495057; line-height: 1.5;
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
}

.filter-input { min-width: 240px; }

/* Toolbar polish */
.card-header .form-select,
.card-header .form-control,
.card-header .input-group-text,
.card-header .btn {
  border-radius: 10px;
}

.card-header .input-group-text { background: #f3f5f7; border-color: #ecedf0; }
.card-header .form-control { background: #f9fafb; border-color: #ecedf0; }
.card-header .form-select { background: #fff; border-color: #ecedf0; }

/* Card header and footer aesthetics */
.template-card .card-header { background: #fbfcfd; border-bottom: 1px solid #f0f1f3; }
.template-card .card-footer { background: #fff; border-top: 1px solid #f0f1f3; padding: 1rem 1.25rem; }
.template-card .card-footer .btn { border-radius: 10px; padding: 6px 12px; }
.template-card .card-footer .badge { padding: 6px 10px; border-radius: 10px; }

/* Meta list under content */
.template-card .meta { list-style: none !important; padding-left: 0 !important; margin: 1rem 0 .25rem !important; }
.template-card .meta li { display: flex; align-items: center; gap: .5rem; color: #475569; font-size: .95rem; margin-bottom: .4rem; }

/* Badges */
.template-card .badge { letter-spacing: .04em; font-weight: 600; }
</style>