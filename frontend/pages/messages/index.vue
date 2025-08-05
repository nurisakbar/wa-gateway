<template>
  <div class="messages-page">
    <!-- Header -->
    <div class="page-header bg-white shadow-sm border-bottom">
      <div class="container-fluid">
        <div class="row align-items-center py-3">
          <div class="col">
            <h1 class="h3 mb-0 text-primary">
              <i class="bi bi-chat-dots me-2"></i>
              Messages
            </h1>
          </div>
          <div class="col-auto">
            <div class="d-flex gap-2">
              <button
                class="btn btn-outline-primary"
                @click="showNewMessageModal = true"
                :disabled="messageStore.isLoading"
              >
                <i class="bi bi-plus me-1"></i>
                New Message
              </button>
              <button
                class="btn btn-outline-success"
                @click="showBroadcastModal = true"
                :disabled="messageStore.isLoading"
              >
                <i class="bi bi-megaphone me-1"></i>
                Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid py-4">
      <div class="row">
        <!-- Sidebar - Contact List -->
        <div class="col-md-4 col-lg-3">
          <div class="whatsapp-card">
            <div class="card-header bg-transparent border-bottom">
              <h5 class="card-title mb-0">
                <i class="bi bi-people me-2"></i>
                Recent Contacts
              </h5>
            </div>
            <div class="card-body p-0">
              <div class="input-group p-3 border-bottom">
                <span class="input-group-text">
                  <i class="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  class="form-control"
                  v-model="contactSearch"
                  placeholder="Search contacts..."
                />
              </div>
              <div class="contact-list">
                <div v-if="filteredContacts.length === 0" class="text-center py-4">
                  <i class="bi bi-people text-muted fs-1 mb-3"></i>
                  <p class="text-muted">No contacts found</p>
                </div>
                <div
                  v-for="contact in filteredContacts"
                  :key="contact.id"
                  class="contact-item"
                  :class="{ active: selectedContact?.id === contact.id }"
                  @click="selectContact(contact)"
                >
                  <div class="contact-avatar">
                    <i class="bi bi-person"></i>
                  </div>
                  <div class="contact-info">
                    <h6 class="contact-name">{{ contact.name }}</h6>
                    <small class="contact-phone">{{ contact.phone_number }}</small>
                  </div>
                  <div class="contact-status" :class="{ active: contact.is_active }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="col-md-8 col-lg-9">
          <div class="whatsapp-card h-100">
            <div v-if="!selectedContact" class="card-body d-flex align-items-center justify-content-center">
              <div class="text-center">
                <i class="bi bi-chat-dots text-muted fs-1 mb-3"></i>
                <h5 class="text-muted">Select a contact to start messaging</h5>
                <p class="text-muted">Choose from your contacts or start a new conversation</p>
                <button class="btn btn-primary" @click="showNewMessageModal = true">
                  <i class="bi bi-plus me-1"></i>
                  New Message
                </button>
              </div>
            </div>

            <div v-else class="chat-container">
              <!-- Chat Header -->
              <div class="chat-header">
                <div class="d-flex align-items-center">
                  <div class="contact-avatar me-3">
                    <i class="bi bi-person"></i>
                  </div>
                  <div>
                    <h6 class="mb-0">{{ selectedContact.name }}</h6>
                    <small class="text-muted">{{ selectedContact.phone_number }}</small>
                  </div>
                </div>
                <div class="chat-actions">
                  <button class="btn btn-sm btn-outline-primary" @click="refreshMessages">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="showContactInfo">
                    <i class="bi bi-info-circle"></i>
                  </button>
                </div>
              </div>

              <!-- Messages Area -->
              <div class="messages-area" ref="messagesArea">
                <div v-if="messageStore.isLoading" class="text-center py-4">
                  <div class="loading-spinner mx-auto mb-2"></div>
                  <p class="text-muted">Loading messages...</p>
                </div>
                <div v-else-if="messages.length === 0" class="text-center py-4">
                  <i class="bi bi-chat-dots text-muted fs-1 mb-3"></i>
                  <p class="text-muted">No messages yet</p>
                  <p class="text-muted">Start the conversation!</p>
                </div>
                <div v-else class="messages-list">
                  <div
                    v-for="message in messages"
                    :key="message.id"
                    class="message-item"
                    :class="{ sent: message.direction === 'outbound', received: message.direction === 'inbound' }"
                  >
                    <div class="message-bubble">
                      <div class="message-content">
                        <div v-if="message.type === 'text'" class="message-text">
                          {{ message.content }}
                        </div>
                        <div v-else-if="message.type === 'image'" class="message-media">
                          <img :src="message.media_url" alt="Image" class="img-fluid rounded" />
                        </div>
                        <div v-else-if="message.type === 'document'" class="message-media">
                          <div class="document-preview">
                            <i class="bi bi-file-earmark-text fs-1 text-primary"></i>
                            <div class="document-info">
                              <strong>{{ message.filename || 'Document' }}</strong>
                              <small class="text-muted">{{ formatFileSize(message.file_size) }}</small>
                            </div>
                          </div>
                        </div>
                        <div v-else class="message-text">
                          [{{ message.type }} message]
                        </div>
                      </div>
                      <div class="message-meta">
                        <small class="message-time">{{ formatTime(message.timestamp) }}</small>
                        <div v-if="message.direction === 'outbound'" class="message-status">
                          <i 
                            :class="getStatusIcon(message.status)" 
                            :title="message.status"
                          ></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Message Input -->
              <div class="message-input">
                <div class="input-group">
                  <button
                    class="btn btn-outline-secondary"
                    type="button"
                    @click="showAttachmentMenu = !showAttachmentMenu"
                    title="Attach file"
                  >
                    <i class="bi bi-paperclip"></i>
                  </button>
                  <input
                    type="text"
                    class="form-control"
                    v-model="newMessage"
                    placeholder="Type a message..."
                    @keyup.enter="sendMessage"
                    :disabled="messageStore.isLoading"
                  />
                  <button
                    class="btn btn-primary"
                    type="button"
                    @click="sendMessage"
                    :disabled="!newMessage.trim() || messageStore.isLoading"
                  >
                    <i class="bi bi-send"></i>
                  </button>
                </div>
                
                <!-- Attachment Menu -->
                <div v-if="showAttachmentMenu" class="attachment-menu">
                  <div class="attachment-options">
                    <button class="btn btn-sm btn-outline-primary" @click="attachImage">
                      <i class="bi bi-image me-1"></i>
                      Image
                    </button>
                    <button class="btn btn-sm btn-outline-primary" @click="attachDocument">
                      <i class="bi bi-file-earmark-text me-1"></i>
                      Document
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Message</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeNewMessageModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label for="messageDevice" class="form-label">Device *</label>
              <select
                class="form-select"
                id="messageDevice"
                v-model="newMessageForm.device_id"
                required
              >
                <option value="">Select a device</option>
                <option
                  v-for="device in deviceStore.getConnectedDevices"
                  :key="device.id"
                  :value="device.id"
                >
                  {{ device.name }} ({{ device.phone_number }})
                </option>
              </select>
            </div>
            <div class="mb-3">
              <label for="messageTo" class="form-label">To *</label>
              <input
                type="tel"
                class="form-control"
                id="messageTo"
                v-model="newMessageForm.to_number"
                placeholder="+1234567890"
                required
              />
            </div>
            <div class="mb-3">
              <label for="messageContent" class="form-label">Message *</label>
              <textarea
                class="form-control"
                id="messageContent"
                v-model="newMessageForm.content"
                rows="4"
                placeholder="Type your message..."
                required
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeNewMessageModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="sendNewMessage"
              :disabled="!isNewMessageValid || messageStore.isLoading"
            >
              <span v-if="messageStore.isLoading" class="loading-spinner me-2"></span>
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Broadcast Modal -->
    <div
      class="modal fade"
      :class="{ show: showBroadcastModal }"
      :style="{ display: showBroadcastModal ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Send Broadcast Message</h5>
            <button
              type="button"
              class="btn-close"
              @click="closeBroadcastModal"
            ></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="broadcastDevice" class="form-label">Device *</label>
                  <select
                    class="form-select"
                    id="broadcastDevice"
                    v-model="broadcastForm.device_id"
                    required
                  >
                    <option value="">Select a device</option>
                    <option
                      v-for="device in deviceStore.getConnectedDevices"
                      :key="device.id"
                      :value="device.id"
                    >
                      {{ device.name }} ({{ device.phone_number }})
                    </option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="broadcastMessage" class="form-label">Message *</label>
                  <textarea
                    class="form-control"
                    id="broadcastMessage"
                    v-model="broadcastForm.message"
                    rows="4"
                    placeholder="Type your broadcast message..."
                    required
                  ></textarea>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label">Recipients</label>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      id="allContacts"
                      v-model="broadcastForm.recipient_type"
                      value="all"
                    />
                    <label class="form-check-label" for="allContacts">
                      All Contacts ({{ contactStore.getContactCount }})
                    </label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      id="byTag"
                      v-model="broadcastForm.recipient_type"
                      value="tag"
                    />
                    <label class="form-check-label" for="byTag">
                      By Tag
                    </label>
                  </div>
                  <div v-if="broadcastForm.recipient_type === 'tag'" class="mt-2">
                    <select class="form-select" v-model="broadcastForm.selected_tag">
                      <option value="">Select a tag</option>
                      <option
                        v-for="tag in contactStore.getUniqueTags"
                        :key="tag"
                        :value="tag"
                      >
                        {{ tag }} ({{ contactStore.getContactsByTag(tag).length }} contacts)
                      </option>
                    </select>
                  </div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    class="form-control"
                    v-model="broadcastForm.scheduled_at"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              @click="closeBroadcastModal"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="sendBroadcast"
              :disabled="!isBroadcastValid || messageStore.isLoading"
            >
              <span v-if="messageStore.isLoading" class="loading-spinner me-2"></span>
              Send Broadcast
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop -->
    <div
      v-if="showNewMessageModal || showBroadcastModal"
      class="modal-backdrop fade show"
      @click="closeModals"
    ></div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const messageStore = useMessageStore()
const deviceStore = useDeviceStore()
const contactStore = useContactStore()
const { $toast } = useNuxtApp()

const selectedContact = ref(null)
const contactSearch = ref('')
const messages = ref([])
const newMessage = ref('')
const showAttachmentMenu = ref(false)
const showNewMessageModal = ref(false)
const showBroadcastModal = ref(false)
const messagesArea = ref(null)

const newMessageForm = ref({
  device_id: '',
  to_number: '',
  content: ''
})

const broadcastForm = ref({
  device_id: '',
  message: '',
  recipient_type: 'all',
  selected_tag: '',
  scheduled_at: ''
})

// Computed properties
const filteredContacts = computed(() => {
  if (!contactSearch.value) return contactStore.getContacts.slice(0, 20)
  
  const searchTerm = contactSearch.value.toLowerCase()
  return contactStore.getContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm) ||
    contact.phone_number.includes(searchTerm)
  )
})

const isNewMessageValid = computed(() => {
  return newMessageForm.value.device_id && 
         newMessageForm.value.to_number && 
         newMessageForm.value.content.trim()
})

const isBroadcastValid = computed(() => {
  return broadcastForm.value.device_id && 
         broadcastForm.value.message.trim() &&
         (broadcastForm.value.recipient_type === 'all' || 
          (broadcastForm.value.recipient_type === 'tag' && broadcastForm.value.selected_tag))
})

// Load data on mount
onMounted(async () => {
  await Promise.all([
    deviceStore.fetchDevices(),
    contactStore.fetchContacts()
  ])
  
  // Check for contact parameter in URL
  const route = useRoute()
  if (route.query.contact) {
          const contact = contactStore.getContactById(route.query.contact)
    if (contact) {
      selectContact(contact)
    }
  }
})

// Select contact
const selectContact = async (contact) => {
  selectedContact.value = contact
  await loadMessages(contact.phone_number)
  scrollToBottom()
}

// Load messages
const loadMessages = async (phoneNumber) => {
  try {
    const result = await messageStore.fetchMessages({ to_number: phoneNumber })
    if (result.success) {
      messages.value = result.messages
    }
  } catch (error) {
    $toast.error('Failed to load messages')
  }
}

// Send message
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedContact.value) return

  try {
    const result = await messageStore.sendMessage({
      device_id: deviceStore.getConnectedDevices[0]?.id,
      to_number: selectedContact.value.phone_number,
      content: newMessage.value.trim(),
      type: 'text'
    })

    if (result.success) {
      newMessage.value = ''
      await loadMessages(selectedContact.value.phone_number)
      scrollToBottom()
      $toast.success('Message sent successfully')
    } else {
      $toast.error(result.error || 'Failed to send message')
    }
  } catch (error) {
    $toast.error('Failed to send message')
  }
}

// Send new message
const sendNewMessage = async () => {
  try {
    const result = await messageStore.sendMessage({
      device_id: newMessageForm.value.device_id,
      to_number: newMessageForm.value.to_number,
      content: newMessageForm.value.content.trim(),
      type: 'text'
    })

    if (result.success) {
      closeNewMessageModal()
      $toast.success('Message sent successfully')
    } else {
      $toast.error(result.error || 'Failed to send message')
    }
  } catch (error) {
    $toast.error('Failed to send message')
  }
}

// Send broadcast
const sendBroadcast = async () => {
  try {
    const broadcastData = {
      device_id: broadcastForm.value.device_id,
      message: broadcastForm.value.message.trim(),
      recipient_type: broadcastForm.value.recipient_type,
      tag: broadcastForm.value.selected_tag,
      scheduled_at: broadcastForm.value.scheduled_at || null
    }

    const result = await messageStore.sendBroadcast(broadcastData)

    if (result.success) {
      closeBroadcastModal()
      $toast.success('Broadcast scheduled successfully')
    } else {
      $toast.error(result.error || 'Failed to send broadcast')
    }
  } catch (error) {
    $toast.error('Failed to send broadcast')
  }
}

// Refresh messages
const refreshMessages = async () => {
  if (selectedContact.value) {
    await loadMessages(selectedContact.value.phone_number)
    $toast.success('Messages refreshed')
  }
}

// Show contact info
const showContactInfo = () => {
  // Navigate to contact details
  if (selectedContact.value) {
    navigateTo(`/contacts/${selectedContact.value.id}`)
  }
}

// Attach file functions
const attachImage = () => {
  // Implement image attachment
  showAttachmentMenu.value = false
  $toast.info('Image attachment feature coming soon')
}

const attachDocument = () => {
  // Implement document attachment
  showAttachmentMenu.value = false
  $toast.info('Document attachment feature coming soon')
}

// Modal functions
const closeNewMessageModal = () => {
  showNewMessageModal.value = false
  newMessageForm.value = { device_id: '', to_number: '', content: '' }
}

const closeBroadcastModal = () => {
  showBroadcastModal.value = false
  broadcastForm.value = {
    device_id: '',
    message: '',
    recipient_type: 'all',
    selected_tag: '',
    scheduled_at: ''
  }
}

const closeModals = () => {
  closeNewMessageModal()
  closeBroadcastModal()
}

// Utility functions
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight
    }
  })
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const formatFileSize = (bytes) => {
  if (!bytes) return ''
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

const getStatusIcon = (status) => {
  const icons = {
    sent: 'bi bi-check',
    delivered: 'bi bi-check-double',
    read: 'bi bi-check-double text-primary',
    failed: 'bi bi-x-circle text-danger'
  }
      return icons[status] || 'bi bi-clock'
}

// Watch for new messages
onMounted(() => {
  const { $socket } = useNuxtApp()
  const socket = $socket.get()

  if (socket) {
    socket.on('message_received', (data) => {
      if (selectedContact.value && data.from_number === selectedContact.value.phone_number) {
        loadMessages(selectedContact.value.phone_number)
        scrollToBottom()
      }
    })

    socket.on('message_sent', (data) => {
      if (selectedContact.value && data.to_number === selectedContact.value.phone_number) {
        loadMessages(selectedContact.value.phone_number)
        scrollToBottom()
      }
    })
  }
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background-color: var(--light-color);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 1000;
}

.contact-list {
  max-height: 400px;
  overflow-y: auto;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.contact-item:hover {
  background-color: rgba(37, 211, 102, 0.1);
}

.contact-item.active {
  background-color: rgba(37, 211, 102, 0.2);
  border-left: 3px solid var(--primary-color);
}

.contact-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.contact-info {
  flex: 1;
}

.contact-name {
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.contact-phone {
  color: var(--gray-color);
}

.contact-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #dc3545;
}

.contact-status.active {
  background-color: #28a745;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  background: var(--white-color);
}

.chat-actions {
  display: flex;
  gap: 0.5rem;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-item {
  display: flex;
}

.message-item.sent {
  justify-content: flex-end;
}

.message-item.received {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
}

.message-item.sent .message-bubble {
  background-color: var(--primary-light);
  color: var(--dark-color);
  border-bottom-right-radius: 0.25rem;
}

.message-item.received .message-bubble {
  background-color: var(--white-color);
  color: var(--dark-color);
  border-bottom-left-radius: 0.25rem;
  box-shadow: var(--box-shadow-sm);
}

.message-content {
  margin-bottom: 0.5rem;
}

.message-text {
  word-wrap: break-word;
}

.message-media img {
  max-width: 200px;
  max-height: 200px;
}

.document-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
}

.document-info {
  display: flex;
  flex-direction: column;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--gray-color);
}

.message-status {
  margin-left: 0.5rem;
}

.message-input {
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.125);
  background: var(--white-color);
  position: relative;
}

.attachment-menu {
  position: absolute;
  bottom: 100%;
  left: 1rem;
  background: var(--white-color);
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.5rem;
  padding: 0.5rem;
  box-shadow: var(--box-shadow);
  z-index: 1000;
}

.attachment-options {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style> 