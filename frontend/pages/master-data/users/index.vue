<template>
  <div class="users-page">
    <!-- Main Content -->
    <div class="container-fluid py-4">
      <!-- Header Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding:20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-people me-2 text-primary"></i> 
              Kelola Users
            </h5>
            <div class="d-flex gap-2">
              <button 
                class="btn btn-outline-primary d-flex align-items-center"
                @click="refreshUsers"
                :disabled="loading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                <span>Refresh</span>
              </button>
              <button 
                class="btn btn-primary d-flex align-items-center"
                @click="openCreateModal"
              >
                <i class="bi bi-plus-circle me-1"></i>
                <span>Add User</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Filter Section -->
        <div class="filter-section bg-light border-top border-bottom py-3 px-4">
          <div class="row align-items-center">
            <div class="col-md-5 mb-2 mb-md-0">
              <div class="input-group">
                <span class="input-group-text bg-white border-end-0">
                  <i class="bi bi-search text-muted"></i>
                </span>
                <input 
                  type="text" 
                  class="form-control border-start-0" 
                  placeholder="Search users by name or email..."
                  v-model="searchQuery"
                >
              </div>
            </div>
            <div class="col-md-2 mb-2 mb-md-0">
              <select class="form-select" v-model="filterRole">
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div class="col-md-2 mb-2 mb-md-0">
              <select class="form-select" v-model="filterStatus">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div class="col-md-3">
              <div class="d-flex gap-2">
                <button 
                  class="btn btn-outline-secondary btn-sm" 
                  @click="clearFilters"
                  :disabled="!searchQuery && !filterRole && !filterStatus"
                >
                  <i class="bi bi-x-circle me-1"></i>
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="text-muted mt-2">Loading users...</p>
          </div>

          <!-- Users Table -->
          <div v-else-if="users.length > 0" class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>
                    <div class="d-flex align-items-center">
                      <div class="user-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                        <i class="bi bi-person"></i>
                      </div>
                      <div>
                        <div class="fw-semibold">{{ user.full_name || user.username || 'N/A' }}</div>
                        <div class="text-muted small">@{{ user.username }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span>{{ user.email }}</span>
                    <span v-if="user.email_verified_at" class="badge bg-success ms-2">Verified</span>
                    <span v-else class="badge bg-warning ms-2">Unverified</span>
                  </td>
                  <td>
                    <span>{{ user.phone || '-' }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="getRoleBadgeClass(user.role)">
                      {{ getRoleLabel(user.role) }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="getStatusBadgeClass(user.status)">
                      {{ getStatusLabel(user.status) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="user.last_login_at" class="text-muted small">
                      {{ formatDate(user.last_login_at) }}
                    </span>
                    <span v-else class="text-muted">Never</span>
                  </td>
                  <td>
                    <div class="d-flex gap-1">
                      <button 
                        class="btn btn-sm btn-outline-primary"
                        @click="openEditModal(user)"
                        title="Edit User"
                      >
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-danger"
                        @click="confirmDelete(user)"
                        title="Delete User"
                        :disabled="user.role === 'super_admin'"
                      >
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div v-else class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <i class="bi bi-people text-muted" style="font-size: 3rem;"></i>
            </div>
            <h4 class="text-dark mb-3">No users found</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              No users match your current search criteria.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit User Modal -->
    <div class="modal fade" :class="{ show: showModal, 'd-block': showModal }" tabindex="-1" v-if="showModal">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-person me-2"></i>
              {{ isEditing ? 'Edit' : 'Create' }} User
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeModal"></button>
          </div>
          <form @submit.prevent="saveUser">
            <div class="modal-body p-4">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="userName" class="form-label fw-semibold">
                    <i class="bi bi-person me-1 text-muted"></i>Full Name *
                  </label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="userName"
                    v-model="form.full_name"
                    placeholder="Enter full name"
                    required
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="username" class="form-label fw-semibold">
                    <i class="bi bi-at me-1 text-muted"></i>Username *
                  </label>
                  <input 
                    type="text" 
                    class="form-control" 
                    id="username"
                    v-model="form.username"
                    placeholder="Enter username"
                    required
                  >
                </div>
              </div>
              
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="userEmail" class="form-label fw-semibold">
                    <i class="bi bi-envelope me-1 text-muted"></i>Email *
                  </label>
                  <input 
                    type="email" 
                    class="form-control" 
                    id="userEmail"
                    v-model="form.email"
                    placeholder="Enter email address"
                    required
                  >
                </div>
                <div class="col-md-6 mb-3">
                  <label for="userPhone" class="form-label fw-semibold">
                    <i class="bi bi-telephone me-1 text-muted"></i>Phone
                  </label>
                  <input 
                    type="tel" 
                    class="form-control" 
                    id="userPhone"
                    v-model="form.phone"
                    placeholder="Enter phone number"
                  >
                </div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="userRole" class="form-label fw-semibold">
                    <i class="bi bi-shield me-1 text-muted"></i>Role *
                  </label>
                  <select class="form-select" id="userRole" v-model="form.role" required>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="userStatus" class="form-label fw-semibold">
                    <i class="bi bi-toggle-on me-1 text-muted"></i>Status *
                  </label>
                  <select class="form-select" id="userStatus" v-model="form.status" required>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div class="mb-3" v-if="!isEditing">
                <label for="userPassword" class="form-label fw-semibold">
                  <i class="bi bi-lock me-1 text-muted"></i>Password *
                </label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="userPassword"
                  v-model="form.password"
                  placeholder="Enter password"
                  required
                >
              </div>
            </div>
            <div class="modal-footer bg-light border-0 p-4">
              <button type="button" class="btn btn-outline-secondary" @click="closeModal">
                <i class="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <i class="bi bi-check-circle me-1"></i>
                {{ isEditing ? 'Update' : 'Create' }} User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" :class="{ show: showDeleteModal, 'd-block': showDeleteModal }" tabindex="-1" v-if="showDeleteModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-danger text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-exclamation-triangle me-2"></i>
              Confirm Delete
            </h5>
            <button type="button" class="btn-close btn-close-white" @click="closeDeleteModal"></button>
          </div>
          <div class="modal-body p-4">
            <p class="mb-3">Are you sure you want to delete this user?</p>
            <div class="alert alert-warning">
              <strong>{{ userToDelete?.full_name || userToDelete?.username }}</strong><br>
              <small class="text-muted">{{ userToDelete?.email }}</small>
            </div>
            <p class="text-danger small mb-0">
              <i class="bi bi-exclamation-circle me-1"></i>
              This action cannot be undone.
            </p>
          </div>
          <div class="modal-footer bg-light border-0 p-4">
            <button type="button" class="btn btn-outline-secondary" @click="closeDeleteModal">
              <i class="bi bi-x-circle me-1"></i>
              Cancel
            </button>
            <button type="button" class="btn btn-danger" @click="deleteUser" :disabled="loading">
              <i class="bi bi-trash me-1"></i>
              Delete User
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div v-if="showModal || showDeleteModal" class="modal-backdrop fade show"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserManagementStore } from '~/stores/userManagement'

// Page metadata
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

// Store
const userManagementStore = useUserManagementStore()

// Reactive data
const searchQuery = ref('')
const filterRole = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const userToDelete = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)

// Form data
const form = ref({
  full_name: '',
  username: '',
  email: '',
  phone: '',
  role: 'user',
  status: 'active',
  password: ''
})

// Computed
const users = computed(() => userManagementStore.getUsers)
const loading = computed(() => userManagementStore.isLoading)
const pagination = computed(() => userManagementStore.getPagination)

// Methods
const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getRoleLabel = (role) => {
  const labels = {
    'user': 'User',
    'admin': 'Admin', 
    'super_admin': 'Super Admin'
  }
  return labels[role] || role
}

const getRoleBadgeClass = (role) => {
  const classes = {
    'user': 'bg-primary',
    'admin': 'bg-warning',
    'super_admin': 'bg-danger'
  }
  return classes[role] || 'bg-secondary'
}

const getStatusLabel = (status) => {
  const labels = {
    'active': 'Active',
    'inactive': 'Inactive',
    'suspended': 'Suspended'
  }
  return labels[status] || status
}

const getStatusBadgeClass = (status) => {
  const classes = {
    'active': 'bg-success',
    'inactive': 'bg-secondary', 
    'suspended': 'bg-danger'
  }
  return classes[status] || 'bg-secondary'
}

const refreshUsers = async () => {
  await userManagementStore.fetchUsers({
    page: currentPage.value,
    limit: pageSize.value,
    search: searchQuery.value,
    role: filterRole.value,
    status: filterStatus.value
  })
}

const clearFilters = () => {
  searchQuery.value = ''
  filterRole.value = ''
  filterStatus.value = ''
  currentPage.value = 1
  refreshUsers()
}

const openCreateModal = () => {
  isEditing.value = false
  form.value = {
    full_name: '',
    username: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: ''
  }
  showModal.value = true
}

const openEditModal = (user) => {
  isEditing.value = true
  form.value = { ...user, password: '' }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  form.value = {
    full_name: '',
    username: '',
    email: '',
    phone: '',
    role: 'user',
    status: 'active',
    password: ''
  }
}

const saveUser = async () => {
  try {
    let result
    if (isEditing.value) {
      result = await userManagementStore.updateUser(form.value.id, form.value)
    } else {
      result = await userManagementStore.createUser(form.value)
    }

    if (result.success) {
      const toast = useToast()
      toast.success(isEditing.value ? 'User updated successfully!' : 'User created successfully!')
      closeModal()
      await refreshUsers()
    } else {
      const toast = useToast()
      toast.error(result.error || 'Failed to save user')
    }
  } catch (error) {
    const toast = useToast()
    toast.error('An error occurred while saving the user')
  }
}

const confirmDelete = (user) => {
  userToDelete.value = user
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
  userToDelete.value = null
}

const deleteUser = async () => {
  if (!userToDelete.value) return

  try {
    const result = await userManagementStore.deleteUser(userToDelete.value.id)
    
    if (result.success) {
      const toast = useToast()
      toast.success('User deleted successfully!')
      closeDeleteModal()
      await refreshUsers()
    } else {
      const toast = useToast()
      toast.error(result.error || 'Failed to delete user')
    }
  } catch (error) {
    const toast = useToast()
    toast.error('An error occurred while deleting the user')
  }
}

// Watchers
watch([searchQuery, filterRole, filterStatus], () => {
  currentPage.value = 1
  refreshUsers()
}, { debounce: 500 })

watch(currentPage, () => {
  refreshUsers()
})

// Lifecycle
onMounted(async () => {
  await refreshUsers()
})
</script>

<style scoped>
.users-page {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.whatsapp-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: none;
}

.filter-section {
  background-color: #f8f9fa !important;
}

.empty-state {
  padding: 3rem 1rem;
}

.max-width-400 {
  max-width: 400px;
}

.table th {
  border-top: none;
  font-weight: 600;
  color: #495057;
  background-color: #f8f9fa;
}

.table td {
  vertical-align: middle;
  border-top: 1px solid #dee2e6;
}

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}

.user-avatar {
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
}
</style>
