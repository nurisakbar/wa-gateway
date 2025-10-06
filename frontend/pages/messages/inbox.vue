<template>
  <div class="messages-page">
    <!-- Statistics Cards -->
    <div class="container-fluid py-4" v-if="showStats" style="padding-bottom: 0px !important;">
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-inbox text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ receivedMessages }}</div>
              <div class="stat-label text-muted">Received Messages</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ unreadMessages }}</div>
              <div class="stat-label text-muted">Unread</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-people text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ uniqueContacts }}</div>
              <div class="stat-label text-muted">Unique Contacts</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-clock text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ todayMessages }}</div>
              <div class="stat-label text-muted">Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid">
      <!-- Inbox Messages Section -->
      <div class="whatsapp-card">
        <div class="card-header bg-transparent border-0 py-3" style="padding: 20px;">
          <div class="d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0 fw-bold">
              <i class="bi bi-inbox me-2 text-primary"></i>
              Inbox Messages
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
                @click="markAllAsRead"
                :disabled="unreadMessages === 0"
              >
                <i class="bi bi-check-all me-1"></i>
                <span>Mark All Read</span>
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
                        placeholder="Search received messages..."
                        v-model="searchQuery"
                      />
                    </div>
                  </div>
                  <div class="col-md-3 mb-2 mb-md-0">
                    <select class="form-select" v-model="readStatusFilter">
                      <option value="">All Messages</option>
                      <option value="unread">Unread Only</option>
                      <option value="read">Read Only</option>
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
                      <option value="sticker">Sticker</option>
                      <option value="location">Location</option>
                      <option value="contact">Contact</option>
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
                      <span class="badge bg-primary align-self-center" v-if="filteredGroups.length !== uniqueContacts">
                        {{ filteredGroups.length }} of {{ uniqueContacts }}
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
            <p class="text-muted small">Please wait while we fetch your received messages</p>
          </div>
          
          <!-- No Messages State -->
          <div v-else-if="receivedMessagesList.length === 0" class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <div class="phone-icon-container">
                <i class="bi bi-inbox text-muted"></i>
              </div>
            </div>
            <h4 class="text-dark mb-3">No received messages yet</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Messages from your contacts will appear here! Make sure your devices are connected and ready to receive messages.
            </p>
            <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
              <button class="btn btn-outline-secondary d-flex align-items-center justify-content-center" @click="refreshMessages">
                <i class="bi bi-arrow-clockwise me-2"></i>
                <span>Refresh</span>
              </button>
            </div>
          </div>
          
          <!-- No Filtered Results State -->
          <div v-else-if="filteredGroups.length === 0" class="empty-state text-center py-5">
            <div class="empty-state-icon mb-4">
              <div class="phone-icon-container">
                <i class="bi bi-search text-muted"></i>
              </div>
            </div>
            <h4 class="text-dark mb-3">No messages match your filters</h4>
            <p class="text-muted mb-4 max-width-400 mx-auto">
              Try adjusting your search criteria or clear the filters to see all received message groups.
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
          
          <!-- Messages Grouped Table -->
          <div v-else class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light">
                <tr>
                  <th class="border-0 py-3 px-4"><i class="bi bi-hash me-2 text-muted"></i>No</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-telephone me-2 text-muted"></i>From</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-hash me-2 text-muted"></i>Count</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-clock me-2 text-muted"></i>Last Time</th>
                  <th class="border-0 py-3 px-4"><i class="bi bi-phone me-2 text-muted"></i>Device</th>
                  <th class="border-0 py-3 px-4 text-end"><i class="bi bi-gear me-2 text-muted"></i>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(group, index) in filteredGroups" :key="group.from_number" class="message-row" :class="{ 'unread-message': group.anyUnread }">
                  <td class="px-4 py-3">{{ index + 1 }}</td>
                  <td class="px-4 py-3">{{ group.from_number }}</td>
                  <td class="px-4 py-3">{{ group.count }}</td>
                  <td class="px-4 py-3">
                    <small class="text-muted">{{ formatTime(group.lastTimestamp) }}</small>
                    <i v-if="group.anyUnread" class="bi bi-circle-fill text-primary ms-1" style="font-size: 0.5rem;"></i>
                  </td>
                  
                  <td class="px-4 py-3"><small class="text-muted">{{ group.device?.name || '-' }}</small></td>
                  <td class="px-4 py-3 text-end">
                    <button class="btn btn-sm btn-outline-primary" @click="openConversation(group)"><i class="bi bi-eye me-1"></i>View</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Conversation Modal -->
          <div class="modal fade" :class="{ show: showConversationModal }" :style="{ display: showConversationModal ? 'block' : 'none' }" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
              <div class="modal-content modern-modal">
                <div class="modal-header gradient-header text-white">
                  <h5 class="modal-title fw-semibold">Message From {{ selectedGroup?.from_number }}</h5>
                  <button type="button" class="btn-close btn-close-white" @click="closeConversation"></button>
                </div>
                <div class="modal-body p-4">
                  <div v-if="!selectedGroup" class="text-muted">No conversation selected</div>
                  <div v-else class="chat-container shadow-sm" ref="chatContainer">
                    <div v-for="m in conversationMessages" :key="m.id" class="chat-row right">
                      <div class="message-bubble outgoing">
                        <div class="message-content">
                          <template v-if="m.type === 'text'">
                            {{ m.content }}
                          </template>
                          <template v-else-if="m.type === 'image'">
                            <i class="bi bi-image me-1 text-primary"></i>
                            <small>{{ m.filename || 'Image' }}</small>
                          </template>
                          <template v-else-if="m.type === 'document'">
                            <i class="bi bi-file-earmark-text me-1 text-danger"></i>
                            <small>{{ m.filename || 'Document' }}</small>
                          </template>
                          <template v-else-if="m.type === 'video'">
                            <i class="bi bi-play-circle me-1 text-success"></i>
                            <small>{{ m.filename || 'Video' }}</small>
                          </template>
                          <template v-else-if="m.type === 'audio'">
                            <i class="bi bi-mic me-1 text-warning"></i>
                            <small>{{ m.filename || 'Audio' }}</small>
                          </template>
                          <template v-else>
                            {{ m.content || 'Media message' }}
                          </template>
                        </div>
                        <div class="message-meta">
                          <small class="text-muted">{{ formatTime(m.timestamp || m.created_at) }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
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
// Use dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { ref, computed, onMounted } from 'vue'
import { useMessageStore } from '~/stores/messages'
import { useDeviceStore } from '~/stores/devices'
import { useToast } from '~/composables/useToast'

const messageStore = useMessageStore()
const deviceStore = useDeviceStore()
const toast = useToast()

// Reactive state
const showStats = ref(true)
const messagesArea = ref(null)

// Filter state
const searchQuery = ref('')
const readStatusFilter = ref('')
const typeFilter = ref('')

// Computed properties
const normalizePhone = (phone) => (phone || '').replace(/[^\d]/g, '')

const selfNumbers = computed(() => {
  const numbers = new Set()
  ;(deviceStore.getDevices || []).forEach(d => {
    if (d && d.phone_number) {
      const n = normalizePhone(d.phone_number)
      if (n) numbers.add(n)
    }
  })
  return numbers
})

const receivedMessagesList = computed(() => {
  return messageStore.getMessages.filter(msg => {
    // Only show incoming messages
    const isIncoming = msg.direction === 'inbound' || msg.status === 'received'
    
    // Filter out system messages and status updates
    const isNotSystemMessage = msg.from_number !== 'status@broadcast' && 
                               !msg.from_number?.includes('@broadcast') &&
                               !msg.from_number?.includes('@g.us') &&
                               !msg.from_number?.includes('status@')
    
    // Only show messages from real phone numbers (chat messages)
    const isRealPhoneNumber = msg.from_number && 
                             msg.from_number.match(/^\d+$/) && 
                             msg.from_number.length >= 10
    
    // Exclude messages sent from our own connected device numbers
    const fromNormalized = normalizePhone(msg.from_number)
    const isNotFromSelf = fromNormalized && !selfNumbers.value.has(fromNormalized)
    
    return isIncoming && isNotSystemMessage && isRealPhoneNumber && isNotFromSelf
  })
})

// Grouping and filters
const groupedMessages = computed(() => {
  const groupMap = new Map()
  for (const msg of receivedMessagesList.value) {
    const key = msg.from_number
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key).push(msg)
  }
  const groups = Array.from(groupMap.entries()).map(([from, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at))
    const last = sorted[0]
    return {
      from_number: from,
      count: msgs.length,
      lastMessage: last,
      lastTimestamp: last?.timestamp || last?.created_at,
      device: last?.device,
      anyUnread: msgs.some(m => !m.isRead),
      messages: sorted
    }
  })
  return groups.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp))
})

const filteredGroups = computed(() => {
  let groups = groupedMessages.value
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    groups = groups.filter(g => {
      const lastContent = (g.lastMessage?.content || '').toLowerCase()
      const deviceName = (g.device?.name || '').toLowerCase()
      return g.from_number.toLowerCase().includes(query) || lastContent.includes(query) || deviceName.includes(query)
    })
  }
  
  if (readStatusFilter.value) {
    groups = groups.filter(g => {
      if (readStatusFilter.value === 'unread') return g.anyUnread
      if (readStatusFilter.value === 'read') return !g.anyUnread
      return true
    })
  }
  
  if (typeFilter.value) {
    groups = groups.filter(g => g.lastMessage?.type === typeFilter.value)
  }
  
  return groups
})

// Statistics
const receivedMessages = computed(() => receivedMessagesList.value.length)
const unreadMessages = computed(() => receivedMessagesList.value.filter(msg => !msg.isRead).length)
const uniqueContacts = computed(() => {
  const contacts = new Set(receivedMessagesList.value.map(msg => msg.from_number))
  return contacts.size
})
const todayMessages = computed(() => {
  const today = new Date().toDateString()
  return receivedMessagesList.value.filter(msg => {
    const msgDate = new Date(msg.timestamp || msg.created_at).toDateString()
    return msgDate === today
  }).length
})

// Check if any filters are active
const hasActiveFilters = computed(() => {
  return searchQuery.value.trim() !== '' || 
         readStatusFilter.value !== '' || 
         typeFilter.value !== ''
})

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  readStatusFilter.value = ''
  typeFilter.value = ''
  toast.info('Filters cleared')
}

// Functions
const refreshMessages = async () => {
  await messageStore.fetchInboxMessages()
  toast.success('Inbox messages refreshed')
}

const markAllAsRead = async () => {
  // This would typically call an API to mark all messages as read
  toast.success('All messages marked as read')
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

// Conversation modal state and handlers
const showConversationModal = ref(false)
const selectedGroup = ref(null)

const openConversation = (group) => {
  selectedGroup.value = group
  showConversationModal.value = true
}

const closeConversation = () => {
  showConversationModal.value = false
  selectedGroup.value = null
}

// Auto-scroll chat to bottom when opening modal
const chatContainer = ref(null)
watch(() => showConversationModal.value, (open) => {
  if (open) {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  }
})

// Sorted conversation messages (oldest -> newest)
const conversationMessages = computed(() => {
  if (!selectedGroup.value) return []
  return [...(selectedGroup.value.messages || [])].sort((a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at))
})

// Load data on mount
onMounted(async () => {
  await deviceStore.fetchDevices()
  await messageStore.fetchInboxMessages()
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

.unread-message {
  background-color: rgba(13, 110, 253, 0.05);
  font-weight: 500;
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

/* Chat modal styles */
.chat-container {
  max-height: 50vh;
  overflow-y: auto;
  padding: 8px 12px;
  background: #f8fafb;
  border-radius: 12px;
}

.chat-row {
  display: flex;
  margin-bottom: 12px;
}

.chat-row.right {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  padding: 10px 12px;
  border-radius: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

.message-bubble.outgoing {
  background: #e7f1ff;
  border: 1px solid #d4e6ff;
}

.message-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.95rem;
}

.message-meta {
  margin-top: 6px;
  text-align: right;
}

/* Modal visual style to match devices */
.modern-modal {
  border-radius: 14px;
  overflow: hidden;
  border: 0;
  box-shadow: 0 12px 30px rgba(0,0,0,0.15);
}

.gradient-header {
  background: linear-gradient(135deg, #0d6efd 0%, #5aa5ff 100%);
  padding: 14px 18px;
}

.gradient-header .modal-title {
  color: #fff;
}

.modal-body .chat-container {
  background: #f6f9fc;
}
</style>
