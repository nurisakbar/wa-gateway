<template>
  <div class="messages-page">
    <!-- Statistics Cards -->
    <div class="container-fluid py-4" v-if="showStats" style="padding-bottom: 0px !important;">
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-send text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ sentMessages }}</div>
              <div class="stat-label text-muted">Sent Messages</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ deliveredMessages }}</div>
              <div class="stat-label text-muted">Delivered</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-eye text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ readMessages }}</div>
              <div class="stat-label text-muted">Read</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-danger bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-x-circle text-danger fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-danger fw-bold">{{ failedMessages }}</div>
              <div class="stat-label text-muted">Failed</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid">
      <!-- Sent Messages Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-send me-2 text-primary"></i>
              Sent Messages
            </h5>
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-primary d-flex align-items-center"
                @click="refreshMessages"
                :disabled="messageStore.isLoading"
              >
                <i class="bi bi-arrow-clockwise me-1"></i>
                <span>Refresh</span>
              </button>
              <button
                class="btn btn-primary d-flex align-items-center"
                @click="showNewMessageModal = true"
                :disabled="messageStore.isLoading"
              >
                <i class="bi bi-plus-circle me-1"></i>
                <span>New Message</span>
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
                        placeholder="Search sent messages..."
                        v-model="searchQuery"
                      />
                    </div>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="statusFilter">
                      <option value="">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="sent">Sent</option>
                      <option value="delivered">Delivered</option>
                      <option value="read">Read</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="typeFilter">
                      <option value="">All Types</option>
                      <option value="text">Text</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="audio">Audio</option>
                      <option value="list_message">List Message</option>
                      <option value="template_buttons">Template Buttons</option>
                    </select>
                  </div>
                  <div class="col-md-2">
                    <div class="d-flex gap-2">
                      <button
                        class="btn btn-outline-secondary btn-sm"
                        @click="clearFilters"
                        :disabled="!hasActiveFilters"
                      >
                        <i class="bi bi-x-circle me-1"></i>
                        Clear
                      </button>
                      <span class="badge bg-primary align-self-center" v-if="filteredMessages.length !== sentMessagesList.length">
                        {{ filteredMessages.length }} of {{ sentMessagesList.length }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
        
        <div class="card-body p-0">
          <!-- Loading State -->
          <div v-if="messageStore.isLoading" class="text-center py-5">
            <div class="loading-spinner mx-auto mb-3"></div>
            <h6 class="text-muted mb-1">Loading messages...</h6>
            <p class="text-muted small">Please wait while we fetch your sent messages</p>
          </div>
          
          <!-- No Messages State -->
          <div v-else-if="sentMessagesList.length === 0" class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <div class="phone-icon-container">
                <i class="bi bi-send text-muted"></i>
              </div>
            </div>
            <h4 class="text-dark mb-3">No sent messages yet</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Start sending messages to your contacts! You can send text, media, or interactive messages.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button class="btn btn-primary btn-lg d-flex align-items-center justify-content-center" @click="showNewMessageModal = true">
                <i class="bi bi-plus-circle me-2"></i>
                <span>Send Your First Message</span>
              </button>
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center" @click="refreshMessages">
                <i class="bi bi-arrow-clockwise me-2"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <!-- No Filtered Results State -->
          <div v-else-if="filteredMessages.length === 0" class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <div class="phone-icon-container">
                <i class="bi bi-search text-muted"></i>
              </div>
            </div>
            <h4 class="text-dark mb-3">No messages match your filters</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Try adjusting your search criteria or clear the filters to see all sent messages.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button class="btn btn-outline-primary d-flex align-items-center justify-content-center" @click="clearFilters">
                <i class="bi bi-x-circle me-2"></i>
                <span>Clear Filters</span>
              </button>
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center" @click="refreshMessages">
                <i class="bi bi-arrow-clockwise me-2"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <!-- Messages Table -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-clock me-2 text-muted"></i>Time
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-file-text me-2 text-muted"></i>Type
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-telephone me-2 text-muted"></i>To
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-chat-dots me-2 text-muted"></i>Content
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-circle me-2 text-muted"></i>Status
                  </th>
                  <th class="border-0 py-3 px-4">
                    <i class="bi bi-phone me-2 text-muted"></i>Device
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="msg in filteredMessages" :key="msg.id" class="message-row">
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ formatTime(msg.timestamp || msg.created_at) }}</small>
                  </td>
                  <td class="px-4 py-3 text-capitalize">{{ msg.type }}</td>
                  <td class="px-4 py-3">{{ msg.to_number }}</td>
                  <td class="px-4 py-3">
                    <div v-if="msg.type === 'text'">{{ msg.content }}</div>
                    <div v-else-if="msg.type === 'image'">
                      <i class="bi bi-image me-1 text-primary"></i>
                      <small>{{ msg.filename || 'Image' }}</small>
                    </div>
                    <div v-else-if="msg.type === 'document'">
                      <i class="bi bi-file-earmark-text me-1 text-danger"></i>
                      <small>{{ msg.filename || 'Document' }}</small>
                    </div>
                    <div v-else-if="msg.type === 'video'">
                      <i class="bi bi-play-circle me-1 text-success"></i>
                      <small>{{ msg.filename || 'Video' }}</small>
                    </div>
                    <div v-else-if="msg.type === 'audio'">
                      <i class="bi bi-mic me-1 text-warning"></i>
                      <small>{{ msg.filename || 'Audio' }}</small>
                    </div>
                    <div v-else>{{ msg.content || 'Media message' }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="status-badge fw-medium" :class="getStatusBadgeClass(msg.status)">
                      <i :class="getStatusIcon(msg.status)" class="me-1"></i>{{ msg.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ msg.device?.name || '-' }}</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- New Message Modal -->
    <div
      class="modal fade"
      :class="{ show: showNewMessageModal }"
      :style="{ display: showNewMessageModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header bg-primary text-white border-0">
            <h5 class="modal-title fw-bold">
              <i class="bi bi-send me-2"></i>
              Send New Message
            </h5>
            <button
              type="button"
              class="btn-close btn-close-white"
              @click="closeNewMessageModal"
            ></button>
          </div>
          <form @submit.prevent="sendMessage">
            <div class="modal-body p-4">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="deviceSelect" class="form-label fw-semibold">
                    <i class="bi bi-phone me-1 text-muted"></i>Select Device *
                  </label>
                  <select
                    id="deviceSelect"
                    v-model="messageForm.device_id"
                    class="form-select"
                    :class="{ 'is-invalid': errors.device_id }"
                    required
                  >
                    <option value="">Choose a device...</option>
                    <option
                      v-for="device in availableDevices"
                      :key="device.id"
                      :value="device.id"
                    >
                      {{ device.name }} ({{ device.phone_number }})
                    </option>
                  </select>
                  <div v-if="errors.device_id" class="invalid-feedback">
                    {{ errors.device_id }}
                  </div>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="toNumber" class="form-label fw-semibold">
                    <i class="bi bi-telephone me-1 text-muted"></i>To Number *
                  </label>
                  <input
                    id="toNumber"
                    v-model="messageForm.to_number"
                    type="tel"
                    class="form-control"
                    :class="{ 'is-invalid': errors.to_number }"
                    placeholder="e.g., 6281234567890"
                    required
                  />
                  <div v-if="errors.to_number" class="invalid-feedback">
                    {{ errors.to_number }}
                  </div>
                  <div class="form-text">Enter phone number with country code (e.g., 6281234567890)</div>
                </div>
              </div>
              
              <div class="mb-3">
                <label for="messageContent" class="form-label fw-semibold">
                  <i class="bi bi-chat-text me-1 text-muted"></i>Message Content *
                </label>
                <textarea
                  id="messageContent"
                  v-model="messageForm.message"
                  class="form-control"
                  :class="{ 'is-invalid': errors.message }"
                  rows="4"
                  placeholder="Type your message here..."
                  required
                ></textarea>
                <div v-if="errors.message" class="invalid-feedback">
                  {{ errors.message }}
                </div>
                <div class="form-text">Enter the message content you want to send</div>
              </div>

              <div class="mb-3">
                <label for="mediaUrl" class="form-label fw-semibold">
                  <i class="bi bi-link-45deg me-1 text-muted"></i>Media URL (Optional)
                </label>
                <input
                  id="mediaUrl"
                  v-model="messageForm.media_url"
                  type="url"
                  class="form-control"
                  :class="{ 'is-invalid': errors.media_url }"
                  placeholder="https://example.com/image.jpg"
                />
                <div v-if="errors.media_url" class="invalid-feedback">
                  {{ errors.media_url }}
                </div>
                <div class="form-text">Enter URL of image, document, video, or audio file to send as media</div>
              </div>
            </div>
            <div class="modal-footer bg-light border-0 p-4">
              <button
                type="button"
                class="btn btn-outline-secondary"
                @click="closeNewMessageModal"
              >
                <i class="bi bi-x-circle me-1"></i>
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isSendingMessage"
              >
                <div v-if="isSendingMessage" class="spinner-border spinner-border-sm me-2" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <i v-else class="bi bi-send me-1"></i>
                <span>{{ isSendingMessage ? 'Sending...' : 'Send Message' }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showNewMessageModal"
      class="modal-backdrop fade show"
      @click="closeNewMessageModal"
    ></div>
  </div>
</template>

<script setup>
// Use dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { ref, computed, onMounted } from 'vue'
import { useMessageStore } from '~/stores/messages'
import { useDeviceStore } from '~/stores/devices'
import { useToast } from '~/composables/useToast'
import Swal from 'sweetalert2'

const messageStore = useMessageStore()
const deviceStore = useDeviceStore()
const toast = useToast()

// Reactive state
const showStats = ref(true)
const showNewMessageModal = ref(false)
const messagesArea = ref(null)
const isSendingMessage = ref(false)

// Form state
const messageForm = ref({
  device_id: '',
  to_number: '',
  message: '',
  media_url: ''
})

const errors = ref({
  device_id: '',
  to_number: '',
  message: '',
  media_url: ''
})

// Filter state
const searchQuery = ref('')
const statusFilter = ref('')
const typeFilter = ref('')

// Computed properties
const sentMessagesList = computed(() => {
  return messageStore.getMessages.filter(msg => 
    msg.direction === 'outbound' || msg.direction === 'outgoing' || msg.status === 'sent'
  )
})

const filteredMessages = computed(() => {
  let messages = sentMessagesList.value
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    messages = messages.filter(message => {
      if (!message) return false
      const content = (message.content || '').toLowerCase()
      const toNumber = (message.to_number || '').toLowerCase()
      const deviceName = (message.device?.name || '').toLowerCase()
      return content.includes(query) || 
             toNumber.includes(query) || 
             deviceName.includes(query)
    })
  }
  
  // Filter by status
  if (statusFilter.value) {
    messages = messages.filter(message => {
      if (!message) return false
      return message.status === statusFilter.value
    })
  }
  
  // Filter by type
  if (typeFilter.value) {
    messages = messages.filter(message => {
      if (!message) return false
      return message.type === typeFilter.value
    })
  }
  
  return messages
})

// Statistics
const sentMessages = computed(() => sentMessagesList.value.length)
const deliveredMessages = computed(() => sentMessagesList.value.filter(msg => msg.status === 'delivered' || msg.status === 'read').length)
const readMessages = computed(() => sentMessagesList.value.filter(msg => msg.status === 'read').length)
const failedMessages = computed(() => sentMessagesList.value.filter(msg => msg.status === 'failed').length)

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || 
         statusFilter.value !== '' || 
         typeFilter.value !== ''
})

// Available devices for sending messages
const availableDevices = computed(() => {
  return deviceStore.getDevices.filter(device => 
    device && device.status === 'connected'
  )
})

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  statusFilter.value = ''
  typeFilter.value = ''
  toast.info('Filters cleared')
}

// Functions
const refreshMessages = async () => {
  console.log('Refreshing sent messages...')
  await messageStore.fetchSentMessages()
  console.log('All messages after refresh:', messageStore.getMessages)
  console.log('Sent messages after refresh:', sentMessagesList.value)
  toast.success('Sent messages refreshed')
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

const getStatusBadgeClass = (status) => {
  const statusClasses = {
    pending: 'bg-warning text-dark',
    sent: 'bg-info text-white',
    delivered: 'bg-primary text-white',
    read: 'bg-success text-white',
    failed: 'bg-danger text-white',
    received: 'bg-secondary text-white'
  }
  return statusClasses[status] || 'bg-secondary text-white'
}

const getStatusIcon = (status) => {
  const statusIcons = {
    pending: 'bi bi-clock',
    sent: 'bi bi-check',
    delivered: 'bi bi-check-circle',
    read: 'bi bi-eye',
    failed: 'bi bi-x-circle',
    received: 'bi bi-arrow-down-circle'
  }
  return statusIcons[status] || 'bi bi-question-circle'
}

// Modal functions
const closeNewMessageModal = () => {
  showNewMessageModal.value = false
  resetForm()
}

const resetForm = () => {
  messageForm.value = {
    device_id: '',
    to_number: '',
    message: '',
    media_url: ''
  }
  errors.value = {
    device_id: '',
    to_number: '',
    message: '',
    media_url: ''
  }
}

// Form validation
const validateForm = () => {
  let isValid = true
  
  // Reset errors
  errors.value = {
    device_id: '',
    to_number: '',
    message: '',
    media_url: ''
  }
  
  // Validate device selection
  if (!messageForm.value.device_id) {
    errors.value.device_id = 'Please select a device'
    isValid = false
  }
  
  // Validate phone number
  if (!messageForm.value.to_number) {
    errors.value.to_number = 'Please enter a phone number'
    isValid = false
  } else if (!/^[0-9+\-\s()]+$/.test(messageForm.value.to_number)) {
    errors.value.to_number = 'Please enter a valid phone number'
    isValid = false
  }
  
  // Validate message content
  if (!messageForm.value.message.trim()) {
    errors.value.message = 'Please enter a message'
    isValid = false
  }
  
  // Validate media URL if provided
  if (messageForm.value.media_url.trim()) {
    try {
      new URL(messageForm.value.media_url)
    } catch {
      errors.value.media_url = 'Please enter a valid URL'
      isValid = false
    }
  }
  
  return isValid
}

// Get message type based on media URL
const getMessageTypeFromUrl = (url) => {
  if (!url) return 'text'
  
  const extension = url.split('.').pop().toLowerCase()
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a']
  const documentExtensions = ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx']
  
  if (imageExtensions.includes(extension)) return 'image'
  if (videoExtensions.includes(extension)) return 'video'
  if (audioExtensions.includes(extension)) return 'audio'
  if (documentExtensions.includes(extension)) return 'document'
  
  return 'text'
}

// Send message
const sendMessage = async () => {
  if (!validateForm()) {
    toast.error('Please fix the form errors')
    return
  }
  
  // Set loading state
  isSendingMessage.value = true
  
  try {
    // Determine message type based on media URL
    const messageType = getMessageTypeFromUrl(messageForm.value.media_url)
    
    // Prepare request body
    const requestBody = {
      to_number: messageForm.value.to_number,
      message: messageForm.value.message,
      options: {
        message_type: messageType
      }
    }
    
    // Add media URL if provided
    if (messageForm.value.media_url.trim()) {
      requestBody.options.media_url = messageForm.value.media_url
    }
    
    // Use real WhatsApp endpoint
    const response = await $fetch('http://localhost:3001/api/v1/messages/device/' + messageForm.value.device_id + '/text', {
      method: 'POST',
      body: requestBody,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (response.success) {
      // Show SweetAlert success
      await Swal.fire({
        icon: 'success',
        title: 'Message Sent!',
        text: 'Your message has been sent successfully to WhatsApp.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#198754',
        timer: 3000,
        timerProgressBar: true
      })
      
      closeNewMessageModal()
      await refreshMessages()
    } else {
      // Show SweetAlert error
      await Swal.fire({
        icon: 'error',
        title: 'Failed to Send',
        text: response.message || 'Failed to send message. Please try again.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545'
      })
    }
  } catch (error) {
    console.error('Error sending message:', error)
    
    // Show SweetAlert error
    await Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to send message. Please check your connection and try again.',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    })
  } finally {
    // Clear loading state
    isSendingMessage.value = false
  }
}

// Load data on mount
onMounted(async () => {
  console.log('Loading sent messages on mount...')
  await messageStore.fetchSentMessages()
  await deviceStore.fetchDevices()
  console.log('All messages:', messageStore.getMessages)
  console.log('Sent messages:', sentMessagesList.value)
  console.log('Available devices:', availableDevices.value)
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
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
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6c757d;
  margin-top: 0.25rem;
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

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

.table td {
  vertical-align: middle;
  border-bottom: 1px solid #f1f3f4;
}

.message-row:hover {
  background-color: #f8f9fa;
}

.table-responsive {
  overflow-x: auto;
}

.table-responsive .table {
  margin-bottom: 0;
  width: 100%;
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

/* Empty state improvements */
.empty-state {
  padding: 3rem 2rem;
}

.empty-state-icon {
  position: relative;
}

.phone-icon-container {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  border: 2px solid #dee2e6;
}

.phone-icon-container i {
  font-size: 2rem;
  color: #6c757d;
}

.max-width-400 {
  max-width: 400px;
}

/* Loading spinner */
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #25D366;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  transition: all 0.2s ease-in-out;
  font-weight: 500;
  border-radius: 8px;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.empty-state {
  padding: 3rem 2rem;
}

.empty-messages-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 50%;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #0d6efd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Modal styles */
.modal {
  z-index: 1055;
}

.modal-backdrop {
  z-index: 1050;
}

.modal-dialog {
  max-width: 600px;
}

.modal-content {
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
}

.modal-body {
  padding: 2rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 0.5rem;
}

.form-control,
.form-select {
  border-radius: 8px;
  border: 1px solid #ced4da;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-control:focus,
.form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.form-text {
  font-size: 0.75rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.invalid-feedback {
  display: block;
  font-size: 0.75rem;
  color: #dc3545;
  margin-top: 0.25rem;
}

.is-invalid {
  border-color: #dc3545;
}

.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}
</style>
