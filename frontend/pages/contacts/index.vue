<template>
  <div class="contacts-page">
    <!-- Statistics Cards -->
    <div class="container-fluid py-4" v-if="showStats" style="padding-bottom: 0px !important;">
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-people text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ totalContacts }}</div>
              <div class="stat-label text-muted">Total Contacts</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ activeContacts }}</div>
              <div class="stat-label text-muted">Active Contacts</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-tags text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ uniqueTags }}</div>
              <div class="stat-label text-muted">Unique Tags</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-envelope text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ contactsWithEmail }}</div>
              <div class="stat-label text-muted">With Email</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid">
      <!-- Contacts Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-people me-2 text-primary"></i>
              Contacts
            </h5>
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-primary d-flex align-items-center"
                @click="refreshContacts"
                :disabled="contactStore.isLoading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
              <button
                class="btn btn-primary d-flex align-items-center"
                @click="showAddModal = true"
                :disabled="contactStore.isLoading"
              >
                <i class="bi bi-plus-circle me-1"></i>
                Add Contact
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
                        placeholder="Search contacts..."
                        v-model="searchQuery"
                      />
                    </div>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="selectedTag">
                      <option value="">All Tags</option>
                      <option v-for="tag in uniqueTags" :key="tag" :value="tag">
                        {{ tag }}
                      </option>
                    </select>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="statusFilter">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
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
          <div v-if="contactStore.isLoading" class="text-center py-5">
            <div class="loading-spinner mx-auto mb-3"></div>
            <h6 class="text-muted mb-0">Loading contacts...</h6>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="filteredContacts.length === 0" class="empty-state text-center py-5">
            <i class="bi bi-people text-muted fs-1 mb-3 d-block"></i>
            <h5 class="text-dark mb-2">No contacts found</h5>
            <p class="text-muted mb-3">
              {{ contactStore.getContacts.length === 0 ? 'Add your first contact to get started' : 'No contacts match your search criteria' }}
            </p>
            <button class="btn btn-primary" @click="showAddModal = true">
              <i class="bi bi-plus-circle me-1"></i>
              Add Contact
            </button>
          </div>
          
          <!-- Contacts Table -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4"><i class="bi bi-person me-2 text-muted"></i>Name</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-telephone me-2 text-muted"></i>Phone</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-envelope me-2 text-muted"></i>Email</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-tags me-2 text-muted"></i>Tags</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-circle me-2 text-muted"></i>Status</th>
                  <th class="border-0 py-3 px-4 text-end"><i class="bi bi-gear me-2 text-muted"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="contact in filteredContacts" :key="contact.id" class="align-middle">
                  <td class="px-4 py-3 fw-semibold text-dark">{{ contact.name }}</td>
                  <td class="px-4 py-3 text-primary">{{ contact.phone_number }}</td>
                  <td class="px-4 py-3"><small class="text-muted">{{ contact.email || '-' }}</small></td>
                  <td class="px-4 py-3">
                    <span v-if="!contact.tags || contact.tags.length === 0" class="text-muted small">-</span>
                    <div v-else>
                      <span v-for="tag in contact.tags.slice(0,3)" :key="tag" class="badge bg-light text-dark me-1">{{ tag }}</span>
                      <span v-if="contact.tags.length > 3" class="badge bg-secondary">+{{ contact.tags.length - 3 }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="status-badge" :class="contact.is_active ? 'bg-success text-white' : 'bg-secondary text-white'">
                      <i class="bi" :class="contact.is_active ? 'bi-check-circle me-1' : 'bi-x-circle me-1'"></i>
                      {{ contact.is_active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-end">
                    <div class="d-flex gap-2 justify-content-end">
                      <button class="btn btn-sm btn-outline-primary d-flex align-items-center" @click="editContact(contact)">
                        <i class="bi bi-pencil me-1"></i><span>Edit</span>
                      </button>
                      <button class="btn btn-sm btn-outline-success d-flex align-items-center" @click="sendMessage(contact)">
                        <i class="bi bi-chat-dots me-1"></i><span>Message</span>
                      </button>
                      <button class="btn btn-sm btn-outline-danger d-flex align-items-center" @click="deleteContact(contact)" :disabled="contactStore.isLoading">
                        <i class="bi bi-trash me-1"></i><span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Contact Modal -->
    <div
      class="modal fade"
      :class="{ show: showAddModal || showEditModal }"
      :style="{ display: (showAddModal || showEditModal) ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ showEditModal ? 'Edit Contact' : 'Add New Contact' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
            ></button>
          </div>
          <form @submit.prevent="saveContact">
            <div class="modal-body">
              <div class="mb-3">
                <label for="contactName" class="form-label">Name *</label>
                <input
                  type="text"
                  class="form-control"
                  :class="{ 'is-invalid': errors.name }"
                  id="contactName"
                  v-model="contactForm.name"
                  placeholder="Enter contact name"
                  required
                />
                <div class="invalid-feedback" v-if="errors.name">
                  {{ errors.name }}
                </div>
              </div>

              <div class="mb-3">
                <label for="contactPhone" class="form-label">Phone Number *</label>
                <input
                  type="tel"
                  class="form-control"
                  :class="{ 'is-invalid': errors.phone_number }"
                  id="contactPhone"
                  v-model="contactForm.phone_number"
                  placeholder="+1234567890"
                  required
                />
                <div class="invalid-feedback" v-if="errors.phone_number">
                  {{ errors.phone_number }}
                </div>
              </div>

              <div class="mb-3">
                <label for="contactEmail" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': errors.email }"
                  id="contactEmail"
                  v-model="contactForm.email"
                  placeholder="contact@example.com"
                />
                <div class="invalid-feedback" v-if="errors.email">
                  {{ errors.email }}
                </div>
              </div>

              <div class="mb-3">
                <label for="contactTags" class="form-label">Tags</label>
                <input
                  type="text"
                  class="form-control"
                  id="contactTags"
                  v-model="contactForm.tags"
                  placeholder="tag1, tag2, tag3"
                />
                <small class="form-text text-muted">
                  Separate tags with commas
                </small>
              </div>

              <div class="mb-3">
                <div class="form-check">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="contactActive"
                    v-model="contactForm.is_active"
                  />
                  <label class="form-check-label" for="contactActive">
                    Active Contact
                  </label>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                @click="closeModal"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="contactStore.isLoading"
              >
                <span v-if="contactStore.isLoading" class="loading-spinner me-2"></span>
                {{ showEditModal ? 'Update Contact' : 'Add Contact' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <div
      class="modal fade"
      :class="{ show: showImportModal }"
      :style="{ display: showImportModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Import Contacts</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeImportModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="importFile" class="form-label">CSV File</label>
              <input
                type="file"
                class="form-control"
                id="importFile"
                accept=".csv"
                @change="handleFileUpload"
              />
              <small class="form-text text-muted">
                Upload a CSV file with columns: name, phone_number, email, tags
              </small>
            </div>
            <div v-if="importPreview.length > 0" class="mb-3">
              <h6>Preview ({{ importPreview.length }} contacts)</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th>Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(contact, index) in importPreview.slice(0, 5)" :key="index">
                      <td>{{ contact.name }}</td>
                      <td>{{ contact.phone_number }}</td>
                      <td>{{ contact.email || '-' }}</td>
                      <td>{{ contact.tags?.join(', ') || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <small class="text-muted">
                Showing first 5 contacts. Total: {{ importPreview.length }}
              </small>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeImportModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="importContacts"
              :disabled="importPreview.length === 0 || contactStore.isLoading"
            >
              <span v-if="contactStore.isLoading" class="loading-spinner me-2"></span>
              Import {{ importPreview.length }} Contacts
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showAddModal || showEditModal || showImportModal"
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

const contactStore = useContactStore()
const { $toast } = useNuxtApp()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const selectedContact = ref(null)
const searchQuery = ref('')
const selectedTag = ref('')
const statusFilter = ref('')
const importPreview = ref([])

const contactForm = ref({
  name: '',
  phone_number: '',
  email: '',
  tags: '',
  is_active: true
})

const errors = ref({
  name: '',
  phone_number: '',
  email: ''
})

// Reactive state
const showStats = ref(true)

// Computed properties
const totalContacts = computed(() => contactStore.getContacts.length)
const activeContacts = computed(() => contactStore.getContacts.filter(c => c.is_active).length)
const uniqueTags = computed(() => {
  const tags = new Set()
  contactStore.getContacts.forEach(contact => {
    if (contact.tags) {
      contact.tags.forEach(tag => tags.add(tag))
    }
  })
  return Array.from(tags).sort()
})
const contactsWithEmail = computed(() => contactStore.getContacts.filter(c => c.email).length)

const filteredContacts = computed(() => {
  let contacts = contactStore.getContacts

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    contacts = contacts.filter(contact =>
      contact.name.toLowerCase().includes(query) ||
      contact.phone_number.includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query))
    )
  }

  // Tag filter
  if (selectedTag.value) {
    contacts = contacts.filter(contact =>
      contact.tags && contact.tags.includes(selectedTag.value)
    )
  }

  // Status filter
  if (statusFilter.value) {
    contacts = contacts.filter(contact =>
      statusFilter.value === 'active' ? contact.is_active : !contact.is_active
    )
  }

  return contacts
})

// Load contacts on mount
onMounted(async () => {
  await contactStore.fetchContacts()
})

// Refresh contacts
const refreshContacts = async () => {
  await contactStore.fetchContacts()
  $toast.success('Contacts refreshed')
}

// Filter contacts
const filterContacts = () => {
  // Reactive filtering is handled by computed property
}

// Clear filters
const clearFilters = () => {
  searchQuery.value = ''
  selectedTag.value = ''
  statusFilter.value = ''
}

// Edit contact
const editContact = (contact) => {
  selectedContact.value = contact
  contactForm.value = {
    name: contact.name,
    phone_number: contact.phone_number,
    email: contact.email || '',
    tags: contact.tags ? contact.tags.join(', ') : '',
    is_active: contact.is_active
  }
  showEditModal.value = true
}

// Save contact
const saveContact = async () => {
  // Reset errors
  errors.value = { name: '', phone_number: '', email: '' }

  // Validate form
  if (!contactForm.value.name.trim()) {
    errors.value.name = 'Name is required'
    return
  }

  if (!contactForm.value.phone_number.trim()) {
    errors.value.phone_number = 'Phone number is required'
    return
  }

  if (!isValidPhoneNumber(contactForm.value.phone_number)) {
    errors.value.phone_number = 'Invalid phone number format'
    return
  }

  if (contactForm.value.email && !isValidEmail(contactForm.value.email)) {
    errors.value.email = 'Invalid email format'
    return
  }

  // Prepare contact data
  const contactData = {
    name: contactForm.value.name.trim(),
    phone_number: contactForm.value.phone_number.trim(),
    email: contactForm.value.email.trim() || null,
    tags: contactForm.value.tags ? contactForm.value.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
    is_active: contactForm.value.is_active
  }

  try {
    if (showEditModal.value && selectedContact.value) {
      // Update contact
      const result = await contactStore.updateContact(selectedContact.value.id, contactData)
      if (result.success) {
        $toast.success('Contact updated successfully')
        closeModal()
      } else {
        $toast.error(result.error || 'Failed to update contact')
      }
    } else {
      // Create contact
      const result = await contactStore.createContact(contactData)
      if (result.success) {
        $toast.success('Contact created successfully')
        closeModal()
      } else {
        $toast.error(result.error || 'Failed to create contact')
      }
    }
  } catch (error) {
    $toast.error('Failed to save contact')
  }
}

// Delete contact
const deleteContact = async (contact) => {
  if (confirm(`Are you sure you want to delete "${contact.name}"?`)) {
    try {
      const result = await contactStore.deleteContact(contact.id)
      if (result.success) {
        $toast.success('Contact deleted successfully')
      } else {
        $toast.error(result.error || 'Failed to delete contact')
      }
    } catch (error) {
      $toast.error('Failed to delete contact')
    }
  }
}

// Send message (placeholder)
const sendMessage = (contact) => {
  // Navigate to message page with contact pre-filled
  navigateTo(`/messages?contact=${contact.id}`)
}

// Export contacts
const exportContacts = async () => {
  try {
    const response = await $fetch('/api/v1/contacts/export', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
    
    // Create download link
    const blob = new Blob([response], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    
    $toast.success('Contacts exported successfully')
  } catch (error) {
    $toast.error('Failed to export contacts')
  }
}

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
          const csv = e.target?.result
    const lines = csv.split('\n')
    const headers = lines[0].split(',')
    
    importPreview.value = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',')
      return {
        name: values[0]?.trim() || '',
        phone_number: values[1]?.trim() || '',
        email: values[2]?.trim() || '',
        tags: values[3]?.trim() ? values[3].trim().split(';') : []
      }
    })
  }
  reader.readAsText(file)
}

// Import contacts
const importContacts = async () => {
  try {
    const result = await contactStore.importContacts(importPreview.value)
    if (result.success) {
      $toast.success(`Successfully imported ${result.imported_count} contacts`)
      closeImportModal()
      await contactStore.fetchContacts()
    } else {
      $toast.error(result.error || 'Failed to import contacts')
    }
  } catch (error) {
    $toast.error('Failed to import contacts')
  }
}

// Close modal
const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  selectedContact.value = null
  contactForm.value = { name: '', phone_number: '', email: '', tags: '', is_active: true }
  errors.value = { name: '', phone_number: '', email: '' }
}

// Close import modal
const closeImportModal = () => {
  showImportModal.value = false
  importPreview.value = []
}

// Utility functions
const isValidPhoneNumber = (phone) => {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check if it's a valid international phone number
  // Must start with + or country code, and be 7-15 digits long
  const phoneRegex = /^(\+\d{1,3}|\d{1,3})?\d{7,14}$/;
  return phoneRegex.test(cleaned) && cleaned.length >= 7 && cleaned.length <= 15;
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
</script>

<style scoped>
.contacts-page {
  min-height: 100vh;
  background-color: var(--light-color);
}

.page-header {
  position: sticky;
  top: 0;
  /* z-index: 1000; */
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
}

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Table improvements to match Devices */
.table {
  border-radius: 12px;
  overflow: hidden;
}

.table th {
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #dee2e6;
  background: #f8f9fa;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table td { vertical-align: middle; }

.status-badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.6rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
}

.contact-card:hover {
  box-shadow: var(--box-shadow-lg);
  transform: translateY(-2px);
}

.contact-header {
  position: relative;
  padding: 1rem;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  text-align: center;
}

.contact-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.5rem;
  font-size: 1.5rem;
}

.contact-status {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #dc3545;
  border: 2px solid white;
}

.contact-status.active {
  background-color: #28a745;
}

.contact-body {
  padding: 1rem;
}

.contact-name {
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--dark-color);
}

.contact-phone {
  margin-bottom: 0.25rem;
  color: var(--primary-color);
  font-weight: 500;
}

.contact-email {
  margin-bottom: 0.5rem;
  color: var(--gray-color);
  font-size: 0.875rem;
}

.contact-tags {
  margin-bottom: 0.5rem;
}

.contact-actions {
  padding: 0.75rem 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.125);
  display: flex;
  gap: 0.5rem;
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

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style> 