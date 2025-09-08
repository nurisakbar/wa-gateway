<template>
  <div class="messages-page">
    <!-- Enhanced Header -->
    <div class="page-header bg-white border-bottom">
      <div class="container-fluid py-3">
        <div class="row align-items-center">
          <div class="col">
            <nav aria-label="breadcrumb" class="mb-2">
              <ol class="breadcrumb mb-0">
                <li class="breadcrumb-item">
                  <NuxtLink to="/dashboard" class="text-decoration-none">
                    <i class="bi bi-house-door me-1"></i>Dashboard
                  </NuxtLink>
                </li>
                <li class="breadcrumb-item active" aria-current="page">Messages</li>
              </ol>
            </nav>
            <h1 class="h3 mb-0 fw-bold text-dark">
              <i class="bi bi-chat-dots me-3 text-primary"></i>
              Message Center
            </h1>
            <p class="text-muted mb-0">Send and manage your WhatsApp messages</p>
          </div>
          <div class="col-auto">
            <div class="d-flex gap-3">
              <button
                class="btn btn-outline-primary d-flex align-items-center"
                @click="showNewMessageModal = true"
                :disabled="messageStore.isLoading"
              >
                <i class="bi bi-plus-circle me-2"></i>
                <span class="d-none d-sm-inline">New Message</span>
                <span class="d-inline d-sm-none">New</span>
              </button>
              <button
                class="btn btn-primary d-flex align-items-center"
                @click="showBroadcastModal = true"
                :disabled="messageStore.isLoading"
              >
                <i class="bi bi-megaphone me-2"></i>
                <span class="d-none d-sm-inline">Broadcast</span>
                <span class="d-inline d-sm-none">Broadcast</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="container-fluid py-4">
      <div class="row mb-4">
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-primary bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-chat-dots text-primary fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-primary fw-bold">{{ totalMessages }}</div>
              <div class="stat-label text-muted">Total Messages</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-success bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-check-circle text-success fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-success fw-bold">{{ sentMessages }}</div>
              <div class="stat-label text-muted">Sent Today</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-info bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-people text-info fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-info fw-bold">{{ activeContacts }}</div>
              <div class="stat-label text-muted">Active Contacts</div>
            </div>
          </div>
        </div>
        <div class="col-md-3 col-sm-6">
          <div class="stat-card h-100 d-flex align-items-center">
            <div class="stat-icon bg-warning bg-opacity-10 rounded-3 p-3 me-3">
              <i class="bi bi-clock text-warning fs-4"></i>
            </div>
            <div>
              <div class="stat-number text-warning fw-bold">{{ pendingMessages }}</div>
              <div class="stat-label text-muted">Pending</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container-fluid">
      <div class="row g-4">
        <!-- Main Area (full width) -->
        <div class="col-12">
          <div class="chat-panel">
            <div v-if="!selectedContact" class="all-messages-view">
              <div class="messages-header">
                <h5 class="mb-3">
                  <i class="bi bi-chat-dots me-2"></i>
                  All Messages
                </h5>
              </div>
              
              <div class="messages-area" ref="messagesArea">
                <div v-if="messageStore.isLoading" class="text-center py-5">
                  <div class="loading-spinner mx-auto mb-2"></div>
                  <p class="text-muted">Loading messages...</p>
                </div>

                <div v-else-if="messageStore.getMessages.length === 0" class="empty-state text-center py-5">
                  <div class="empty-messages-icon mb-3">
                    <i class="bi bi-chat-dots fs-1 text-muted"></i>
                  </div>
                  <h6 class="text-dark mb-2">No messages yet</h6>
                  <p class="text-muted">Start the conversation by sending your first message!</p>
                </div>

                <div v-else class="table-responsive">
                  <table class="table table-hover mb-0">
                    <thead class="table-light">
                      <tr>
                        <th class="border-0 py-3 px-4"><i class="bi bi-clock me-2 text-muted"></i>Time</th>
                        <th class="border-0 py-3 px-4"><i class="bi bi-arrow-left-right me-2 text-muted"></i>Direction</th>
                        <th class="border-0 py-3 px-4"><i class="bi bi-file-text me-2 text-muted"></i>Type</th>
                        <th class="border-0 py-3 px-4"><i class="bi bi-telephone me-2 text-muted"></i>To / From</th>
                        <th class="border-0 py-3 px-4"><i class="bi bi-chat-dots me-2 text-muted"></i>Content</th>
                        <th class="border-0 py-3 px-4"><i class="bi bi-circle me-2 text-muted"></i>Status</th>
                        <th class="border-0 py-3 px-4"><i class="bi bi-phone me-2 text-muted"></i>Device</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="msg in messageStore.getMessages" :key="msg.id">
                        <td class="px-4 py-3"><small class="text-muted">{{ formatTime(msg.timestamp || msg.created_at) }}</small></td>
                        <td class="px-4 py-3">
                          <span class="badge" :class="msg.direction === 'outbound' ? 'bg-primary' : 'bg-secondary'">
                            {{ msg.direction === 'outbound' ? 'Outbound' : 'Inbound' }}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-capitalize">{{ msg.type }}</td>
                        <td class="px-4 py-3">
                          <div v-if="msg.direction === 'outbound'">{{ msg.to_number }}</div>
                          <div v-else>{{ msg.from_number }}</div>
                        </td>
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
                          <div v-else>
                            <small>{{ msg.content || 'Media message' }}</small>
                          </div>
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

            <div v-else class="chat-container">
              <!-- Enhanced Chat Header -->
              <div class="chat-header">
                <div class="chat-header-info">
                  <div class="contact-avatar">
                    <img v-if="selectedContact.avatar" :src="selectedContact.avatar" :alt="selectedContact.name" />
                    <i v-else class="bi bi-person"></i>
                  </div>
                  <div class="contact-details">
                    <h6 class="contact-name mb-0">{{ selectedContact.name }}</h6>
                    <div class="contact-meta">
                      <span class="phone-number">{{ selectedContact.phone_number }}</span>
                      <span class="status-indicator" :class="{ online: selectedContact.is_active }">
                        {{ selectedContact.is_active ? 'Online' : 'Offline' }}
                      </span>
                    </div>
                  </div>
                </div>
                <div class="chat-actions">
                  <button class="btn btn-sm btn-outline-primary" @click="refreshMessages" title="Refresh messages">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-secondary" @click="showContactInfo" title="Contact info">
                    <i class="bi bi-info-circle"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-danger" @click="selectedContact = null" title="Close chat">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
              </div>

              <!-- Enhanced Messages Area -->
              <div class="messages-area" ref="messagesArea">
                <div v-if="messageStore.isLoading" class="loading-state">
                  <div class="loading-spinner"></div>
                  <p class="loading-text">Loading messages...</p>
                </div>
                <div v-else-if="messages.length === 0" class="empty-messages">
                  <div class="empty-messages-icon">
                    <i class="bi bi-chat-dots"></i>
                  </div>
                  <h6 class="empty-messages-title">No messages yet</h6>
                  <p class="empty-messages-description">Start the conversation by sending your first message!</p>
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

              <!-- Enhanced Message Input -->
              <div class="message-input">
                <div class="input-container">
                  <div class="input-group">
                    <button
                      class="btn btn-outline-secondary attachment-btn"
                      type="button"
                      @click="showAttachmentMenu = !showAttachmentMenu"
                      title="Attach file"
                    >
                      <i class="bi bi-paperclip"></i>
                    </button>
                    <div class="message-input-field">
                      <textarea
                        class="form-control message-textarea"
                        v-model="newMessage"
                        placeholder="Type a message..."
                        @keydown.enter.prevent="handleEnterKey"
                        @keyup.enter="sendMessage"
                        :disabled="messageStore.isLoading"
                        rows="1"
                        ref="messageTextarea"
                      ></textarea>
                    </div>
                    <button
                      class="btn btn-primary send-btn"
                      type="button"
                      @click="sendMessage"
                      :disabled="(!newMessage.trim() && !selectedImage && !externalUrl) || messageStore.isLoading || isUploadingImage"
                      title="Send message"
                    >
                      <span v-if="isUploadingImage" class="loading-spinner me-1"></span>
                      <i v-else class="bi bi-send"></i>
                    </button>
                  </div>
                  
                  <!-- Enhanced Attachment Menu -->
                  <div v-if="showAttachmentMenu" class="attachment-menu">
                    <div class="attachment-header">
                      <h6 class="mb-0">Attach File</h6>
                      <button class="btn btn-sm btn-outline-secondary" @click="showAttachmentMenu = false">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                    <div class="attachment-options">
                      <label class="btn btn-outline-primary attachment-option" for="imageUpload">
                        <i class="bi bi-image"></i>
                        <span>Image</span>
                        <input
                          type="file"
                          id="imageUpload"
                          accept="image/*"
                          @change="handleImageSelect"
                          style="display: none;"
                        />
                      </label>
                      <button class="btn btn-outline-primary attachment-option" @click="attachDocument">
                        <i class="bi bi-file-earmark-text"></i>
                        <span>Document</span>
                      </button>
                      <button class="btn btn-outline-primary attachment-option" @click="attachLocation">
                        <i class="bi bi-geo-alt"></i>
                        <span>Location</span>
                      </button>
                      <button class="btn btn-outline-primary attachment-option" @click="attachContact">
                        <i class="bi bi-person-plus"></i>
                        <span>Contact</span>
                      </button>
                      <button class="btn btn-outline-primary attachment-option" @click="attachFromUrl">
                        <i class="bi bi-link-45deg"></i>
                        <span>From URL</span>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Image Preview -->
                  <div v-if="selectedImage" class="image-preview">
                    <div class="preview-container">
                      <img :src="imagePreview" alt="Preview" class="preview-image" />
                      <button class="btn btn-sm btn-danger remove-image" @click="removeImage">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                    <div class="preview-info">
                      <small class="text-muted">{{ imageFile?.name }}</small>
                      <small class="text-muted">{{ formatFileSize(imageFile?.size) }}</small>
                    </div>
                  </div>
                  
                  <!-- External URL Input -->
                  <div v-if="showUrlInput" class="url-input-section">
                    <div class="url-input-header">
                      <h6 class="mb-0">Send Media from URL</h6>
                      <button class="btn btn-sm btn-outline-secondary" @click="closeUrlInput">
                        <i class="bi bi-x"></i>
                      </button>
                    </div>
                    <div class="url-input-body">
                      <div class="input-group mb-3">
                        <span class="input-group-text">
                          <i class="bi bi-link-45deg"></i>
                        </span>
                        <input
                          type="url"
                          class="form-control"
                          placeholder="Enter media URL (e.g., https://example.com/file.pdf)"
                          v-model="externalUrl"
                          @input="validateUrl"
                        />
                        <button 
                          class="btn btn-outline-primary" 
                          type="button"
                          @click="previewUrlImage"
                          :disabled="!isUrlValid"
                        >
                          <i class="bi bi-eye"></i>
                        </button>
                      </div>
                      <div v-if="externalUrl && isUrlValid" class="url-preview">
                        <div class="preview-container">
                          <div v-if="isImageUrl(externalUrl)" class="image-preview">
                            <img :src="externalUrl" alt="URL Preview" class="preview-image" @error="handleUrlError" />
                          </div>
                          <div v-else class="file-preview">
                            <div class="file-icon">
                              <i :class="getFileIcon(externalUrl)"></i>
                            </div>
                            <div class="file-info">
                              <div class="file-name">{{ getFileName(externalUrl) }}</div>
                              <div class="file-type">{{ getFileType(externalUrl) }}</div>
                            </div>
                          </div>
                          <button class="btn btn-sm btn-danger remove-image" @click="removeUrlImage">
                            <i class="bi bi-x"></i>
                          </button>
                        </div>
                        <div class="preview-info">
                          <small class="text-success">
                            <i class="bi bi-check-circle"></i> Valid URL
                          </small>
                        </div>
                      </div>
                      <div v-if="externalUrl && !isUrlValid" class="url-error">
                        <small class="text-danger">
                          <i class="bi bi-exclamation-triangle"></i> Please enter a valid URL
                        </small>
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
            
            <!-- URL Attachment Option -->
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0">Attach Media</label>
                <button 
                  type="button" 
                  class="btn btn-sm btn-outline-primary"
                  @click="toggleNewMessageUrlInput"
                >
                  <i class="bi bi-link-45deg me-1"></i>
                  From URL
                </button>
              </div>
              
              <!-- URL Input Section -->
              <div v-if="showNewMessageUrlInput" class="url-input-section">
                <div class="input-group">
                  <span class="input-group-text">
                    <i class="bi bi-link-45deg"></i>
                  </span>
                  <input
                    type="url"
                    class="form-control"
                    placeholder="Enter media URL (e.g., https://example.com/file.pdf)"
                    v-model="newMessageUrl"
                    @input="validateNewMessageUrl"
                  />
                  <button 
                    class="btn btn-outline-secondary" 
                    type="button"
                    @click="closeNewMessageUrlInput"
                  >
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                
                <!-- URL Preview -->
                <div v-if="newMessageUrl && isNewMessageUrlValid" class="url-preview mt-2">
                  <div class="preview-container">
                    <div v-if="isImageUrl(newMessageUrl)" class="image-preview">
                      <img :src="newMessageUrl" alt="URL Preview" class="preview-image" @error="handleNewMessageUrlError" />
                    </div>
                    <div v-else class="file-preview">
                      <div class="file-icon">
                        <i :class="getFileIcon(newMessageUrl)"></i>
                      </div>
                      <div class="file-info">
                        <div class="file-name">{{ getFileName(newMessageUrl) }}</div>
                        <div class="file-type">{{ getFileType(newMessageUrl) }}</div>
                      </div>
                    </div>
                    <button class="btn btn-sm btn-danger remove-image" @click="removeNewMessageUrl">
                      <i class="bi bi-x"></i>
                    </button>
                  </div>
                  <div class="preview-info">
                    <small class="text-success">
                      <i class="bi bi-check-circle"></i> Valid URL
                    </small>
                  </div>
                </div>
                
                <!-- URL Error -->
                <div v-if="newMessageUrl && !isNewMessageUrlValid" class="url-error mt-2">
                  <small class="text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Please enter a valid URL
                  </small>
                </div>
              </div>
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
              :disabled="(!isNewMessageValid && !newMessageUrl) || messageStore.isLoading"
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
                        {{ tag }} ({{ (contactStore.getContactsByTag(tag) || []).length }} contacts)
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
const messageTextarea = ref(null)

// Image upload functionality
const selectedImage = ref(null)
const imagePreview = ref(null)
const imageFile = ref(null)
const isUploadingImage = ref(false)

// External URL functionality
const externalUrl = ref('')
const showUrlInput = ref(false)
const isUrlValid = ref(false)

const newMessageForm = ref({
  device_id: '',
  to_number: '',
  content: ''
})

// New message modal URL functionality
const newMessageUrl = ref('')
const showNewMessageUrlInput = ref(false)
const isNewMessageUrlValid = ref(false)

const broadcastForm = ref({
  device_id: '',
  message: '',
  recipient_type: 'all',
  selected_tag: '',
  scheduled_at: ''
})

// Computed properties
const filteredContacts = computed(() => {
  const contacts = contactStore.getContacts || []
  if (!contactSearch.value) return contacts.slice(0, 20)
  
  const searchTerm = contactSearch.value.toLowerCase()
  return contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm) ||
    contact.phone_number.includes(searchTerm)
  )
})

// Statistics computed properties
const totalMessages = computed(() => {
  return messageStore.getMessages?.length || 0
})

const sentMessages = computed(() => {
  const today = new Date().toDateString()
  return messageStore.getMessages?.filter(msg => 
    msg.direction === 'outbound' && 
    new Date(msg.timestamp).toDateString() === today
  ).length || 0
})

const activeContacts = computed(() => {
  return contactStore.getContacts?.filter(contact => contact.is_active).length || 0
})

const pendingMessages = computed(() => {
  return messageStore.getMessages?.filter(msg => 
    msg.direction === 'outbound' && 
    msg.status === 'pending'
  ).length || 0
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
    contactStore.fetchContacts(),
    messageStore.fetchMessages() // Load messages on page mount
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
  if ((!newMessage.value.trim() && !selectedImage.value && !externalUrl.value) || !selectedContact.value) return

  try {
    isUploadingImage.value = true
    
    let result
    
    if (selectedImage.value && imageFile.value) {
      // Send uploaded image message
      result = await sendImageMessage()
    } else if (externalUrl.value && isUrlValid.value) {
      // Send external URL image message
      result = await sendUrlImageMessage()
    } else {
      // Send text message
      result = await messageStore.sendMessage({
        device_id: deviceStore.getConnectedDevices[0]?.id,
        to_number: selectedContact.value.phone_number,
        content: newMessage.value.trim(),
        type: 'text'
      })
    }

    if (result.success) {
      newMessage.value = ''
      removeImage() // Clear image after sending
      removeUrlImage() // Clear URL after sending
      await loadMessages(selectedContact.value.phone_number)
      scrollToBottom()
      $toast.success('Message sent successfully')
    } else {
      $toast.error(result.error || 'Failed to send message')
    }
  } catch (error) {
    $toast.error('Failed to send message')
  } finally {
    isUploadingImage.value = false
  }
}

// Send image message
const sendImageMessage = async () => {
  try {
    // First upload the image
    const uploadResult = await uploadImage(imageFile.value)
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || 'Failed to upload image')
    }
    
    // Then send the message with image URL
    return await messageStore.sendMessage({
      device_id: deviceStore.getConnectedDevices[0]?.id,
      to_number: selectedContact.value.phone_number,
      content: newMessage.value.trim() || 'Image',
      type: 'image',
      media_url: uploadResult.data.url,
      filename: imageFile.value.name
    })
  } catch (error) {
    throw error
  }
}

// Send URL image message
const sendUrlImageMessage = async () => {
  try {
    // Send the message with external URL directly
    return await messageStore.sendMessage({
      device_id: deviceStore.getConnectedDevices[0]?.id,
      to_number: selectedContact.value.phone_number,
      content: newMessage.value.trim() || 'Image from URL',
      type: 'image',
      media_url: externalUrl.value,
      filename: externalUrl.value.split('/').pop() || 'image.jpg'
    })
  } catch (error) {
    throw error
  }
}

// Upload image to server
const uploadImage = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    const config = useRuntimeConfig()
    const token = localStorage.getItem('auth_token')
    
    const response = await $fetch(`${config.public.apiBase}/files/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    return response
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: error.data?.message || error.message || 'Failed to upload image'
    }
  }
}

// Send new message
const sendNewMessage = async () => {
  try {
    let result
    
    if (newMessageUrl.value && isNewMessageUrlValid.value) {
      // Send image message from URL
      result = await messageStore.sendMessage({
        device_id: newMessageForm.value.device_id,
        to_number: newMessageForm.value.to_number,
        content: newMessageForm.value.content.trim() || 'Image from URL',
        type: 'image',
        media_url: newMessageUrl.value,
        filename: newMessageUrl.value.split('/').pop() || 'image.jpg'
      })
    } else {
      // Send text message
      result = await messageStore.sendMessage({
        device_id: newMessageForm.value.device_id,
        to_number: newMessageForm.value.to_number,
        content: newMessageForm.value.content.trim(),
        type: 'text'
      })
    }

    if (result.success) {
      closeNewMessageModal()
      removeNewMessageUrl() // Clear URL after sending
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

// Enhanced attach file functions
const handleImageSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      $toast.error('Please select a valid image file')
      return
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      $toast.error('Image size must be less than 10MB')
      return
    }
    
    imageFile.value = file
    selectedImage.value = true
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
    
    showAttachmentMenu.value = false
    $toast.success('Image selected successfully')
  }
}

const removeImage = () => {
  selectedImage.value = false
  imagePreview.value = null
  imageFile.value = null
  // Reset file input
  const fileInput = document.getElementById('imageUpload')
  if (fileInput) {
    fileInput.value = ''
  }
}

const attachDocument = () => {
  showAttachmentMenu.value = false
  $toast.info('Document attachment feature coming soon')
}

const attachLocation = () => {
  showAttachmentMenu.value = false
  $toast.info('Location sharing feature coming soon')
}

const attachContact = () => {
  showAttachmentMenu.value = false
  $toast.info('Contact sharing feature coming soon')
}

const attachFromUrl = () => {
  showAttachmentMenu.value = false
  showUrlInput.value = true
  externalUrl.value = ''
  isUrlValid.value = false
}

const closeUrlInput = () => {
  showUrlInput.value = false
  externalUrl.value = ''
  isUrlValid.value = false
}

const validateUrl = () => {
  try {
    const url = new URL(externalUrl.value)
    // Check if URL has valid protocol
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      isUrlValid.value = true
    } else {
      isUrlValid.value = false
    }
  } catch {
    isUrlValid.value = false
  }
}

const previewUrlImage = () => {
  if (isUrlValid.value) {
    $toast.success('URL preview loaded')
  }
}

const handleUrlError = () => {
  $toast.error('Failed to load media from URL')
  isUrlValid.value = false
}

const removeUrlImage = () => {
  externalUrl.value = ''
  isUrlValid.value = false
}

// Helper functions for file type detection
const isImageUrl = (url) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  return imageExtensions.some(ext => url.toLowerCase().includes(ext))
}

const getFileIcon = (url) => {
  const extension = url.split('.').pop()?.toLowerCase()
  switch (extension) {
    case 'pdf':
      return 'bi bi-file-earmark-pdf text-danger'
    case 'doc':
    case 'docx':
      return 'bi bi-file-earmark-word text-primary'
    case 'xls':
    case 'xlsx':
      return 'bi bi-file-earmark-excel text-success'
    case 'ppt':
    case 'pptx':
      return 'bi bi-file-earmark-ppt text-warning'
    case 'txt':
      return 'bi bi-file-earmark-text text-secondary'
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'bi bi-file-earmark-play text-info'
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'bi bi-file-earmark-music text-purple'
    default:
      return 'bi bi-file-earmark text-muted'
  }
}

const getFileName = (url) => {
  return url.split('/').pop() || 'Unknown file'
}

const getFileType = (url) => {
  const extension = url.split('.').pop()?.toLowerCase()
  return extension ? extension.toUpperCase() : 'FILE'
}

// New Message Modal URL functions
const toggleNewMessageUrlInput = () => {
  showNewMessageUrlInput.value = !showNewMessageUrlInput.value
  if (!showNewMessageUrlInput.value) {
    newMessageUrl.value = ''
    isNewMessageUrlValid.value = false
  }
}

const closeNewMessageUrlInput = () => {
  showNewMessageUrlInput.value = false
  newMessageUrl.value = ''
  isNewMessageUrlValid.value = false
}

const validateNewMessageUrl = () => {
  try {
    const url = new URL(newMessageUrl.value)
    // Check if URL has valid protocol
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      isNewMessageUrlValid.value = true
    } else {
      isNewMessageUrlValid.value = false
    }
  } catch {
    isNewMessageUrlValid.value = false
  }
}

const handleNewMessageUrlError = () => {
  $toast.error('Failed to load media from URL')
  isNewMessageUrlValid.value = false
}

const removeNewMessageUrl = () => {
  newMessageUrl.value = ''
  isNewMessageUrlValid.value = false
}

// Refresh contacts
const refreshContacts = async () => {
  try {
    await contactStore.fetchContacts()
    $toast.success('Contacts refreshed')
  } catch (error) {
    $toast.error('Failed to refresh contacts')
  }
}

// Handle enter key for textarea
const handleEnterKey = (event) => {
  if (event.shiftKey) {
    // Allow new line with Shift+Enter
    return
  } else {
    // Send message with Enter
    event.preventDefault()
    sendMessage()
  }
}

// Format relative time
const formatRelativeTime = (timestamp) => {
  if (!timestamp) return ''
  
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now - time) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  
  return time.toLocaleDateString()
}

// Modal functions
const closeNewMessageModal = () => {
  showNewMessageModal.value = false
  newMessageForm.value = { device_id: '', to_number: '', content: '' }
  // Clear URL input
  newMessageUrl.value = ''
  showNewMessageUrlInput.value = false
  isNewMessageUrlValid.value = false
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

const getStatusBadgeClass = (status) => {
  const classes = {
    sent: 'bg-success text-white',
    delivered: 'bg-success text-white',
    read: 'bg-primary text-white',
    pending: 'bg-warning text-dark',
    failed: 'bg-danger text-white'
  }
  return classes[status] || 'bg-secondary text-white'
}

// Watch for new messages
onMounted(() => {
  const { $socket } = useNuxtApp()
  const socket = $socket.socket

  if (socket && socket.value) {
    socket.value.on('message_received', (data) => {
      if (selectedContact.value && data.from_number === selectedContact.value.phone_number) {
        loadMessages(selectedContact.value.phone_number)
        scrollToBottom()
      }
    })

    socket.value.on('message_sent', (data) => {
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
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.page-header {
  position: sticky;
  top: 0;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}
/* Button improvements to match Devices */
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

/* Statistics Cards */
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

.stat-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.25rem;
}

/* Contacts Panel */
.contacts-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: 600px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.panel-title {
  font-weight: 600;
  color: #2c3e50;
}

.panel-search {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.search-input-group {
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  z-index: 2;
}

.search-input {
  padding-left: 40px;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  font-size: 0.9rem;
}

.search-input:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

/* Empty States */
.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #6c757d;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: #adb5bd;
}

.empty-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.empty-description {
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

/* Contact Items */
.contact-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.contact-item:hover {
  background: rgba(0, 123, 255, 0.05);
}

.contact-item.active {
  background: rgba(0, 123, 255, 0.1);
  border-left: 4px solid #007bff;
}

.contact-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  font-size: 1.2rem;
  overflow: hidden;
}

.contact-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: #2c3e50;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-phone {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.contact-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.last-message {
  font-size: 0.8rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-time {
  font-size: 0.75rem;
  color: #adb5bd;
}

.contact-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.contact-status {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dc3545;
}

.contact-status.active {
  background: #28a745;
  box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.2);
}

.unread-count {
  background: #dc3545;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Chat Panel */
.chat-panel {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  height: 600px;
  display: flex;
  flex-direction: column;
}

/* Chat Empty State */
.chat-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
}

.empty-chat-content {
  text-align: center;
  max-width: 400px;
}

.empty-chat-icon {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007bff, #0056b3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  font-size: 3rem;
  color: white;
}

.empty-chat-title {
  font-weight: 700;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.empty-chat-description {
  color: #6c757d;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.empty-chat-actions {
  margin-bottom: 2rem;
}

.empty-chat-features {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #495057;
}

/* Chat Container */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Chat Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: #f8f9fa;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.contact-details {
  flex: 1;
}

.contact-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.phone-number {
  font-size: 0.85rem;
  color: #6c757d;
}

.status-indicator {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: #dc3545;
  color: white;
  font-weight: 500;
}

.status-indicator.online {
  background: #28a745;
}

.chat-actions {
  display: flex;
  gap: 0.5rem;
}

/* Messages Area */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background: #f8f9fa;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0, 123, 255, 0.3);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

.loading-text {
  font-size: 0.9rem;
  margin: 0;
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;
}

.empty-messages-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  font-size: 2rem;
  color: #adb5bd;
}

.empty-messages-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #495057;
}

.empty-messages-description {
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
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
  border-radius: 18px;
  position: relative;
}

.message-item.sent .message-bubble {
  background: linear-gradient(135deg, #007bff, #0056b3);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-item.received .message-bubble {
  background: white;
  color: #2c3e50;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.message-content {
  margin-bottom: 0.5rem;
}

.message-text {
  word-wrap: break-word;
  line-height: 1.4;
}

.message-media img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
}

.document-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
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
  opacity: 0.8;
}

.message-status {
  margin-left: 0.5rem;
}

/* Message Input */
.message-input {
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  position: relative;
}

.input-container {
  position: relative;
}

.input-group {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}

.attachment-btn {
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e9ecef;
}

.message-input-field {
  flex: 1;
}

.message-textarea {
  border-radius: 12px;
  border: 1px solid #e9ecef;
  resize: none;
  min-height: 40px;
  max-height: 120px;
  font-size: 0.9rem;
  line-height: 1.4;
}

.message-textarea:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.send-btn {
  border-radius: 12px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #007bff, #0056b3);
  border: none;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3, #004085);
  transform: translateY(-1px);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Attachment Menu */
.attachment-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-bottom: 0.5rem;
}

.attachment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.attachment-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.attachment-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  background: #f8f9fa;
  transition: all 0.2s ease;
}

.attachment-option:hover {
  background: #e9ecef;
  border-color: #007bff;
}

.attachment-option i {
  font-size: 1.5rem;
  color: #007bff;
}

.attachment-option span {
  font-size: 0.8rem;
  font-weight: 500;
  color: #495057;
}

/* Animations */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.2rem;
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
  
  .contacts-panel,
  .chat-panel {
    height: 500px;
  }
  
  .empty-chat-icon {
    width: 80px;
    height: 80px;
    font-size: 2rem;
  }
  
  .attachment-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .page-header .btn {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .contact-item {
    padding: 0.75rem 1rem;
  }
  
  .contact-avatar {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .message-bubble {
    max-width: 85%;
  }
}

/* Image Preview */
.image-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.preview-container {
  position: relative;
  display: inline-block;
  margin-bottom: 0.5rem;
}

.preview-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-preview {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  max-width: 200px;
}

.file-icon {
  font-size: 2rem;
  margin-right: 12px;
}

.file-info {
  flex: 1;
}

.file-name {
  font-weight: 500;
  color: #212529;
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.file-type {
  font-size: 0.75rem;
  color: #6c757d;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* All Messages View Styles */
.all-messages-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.messages-header {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  background: #fff;
}

.empty-messages-actions {
  margin-top: 1rem;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
}

/* Status badge for messages table */
.status-badge {
  font-size: 0.75rem;
  padding: 0.35rem 0.6rem;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  text-transform: capitalize;
}

.status-badge.bg-primary { background-color: #0d6efd !important; }
.status-badge.bg-secondary { background-color: #6c757d !important; }
.status-badge.bg-success { background-color: #198754 !important; }
.status-badge.bg-warning { background-color: #ffc107 !important; color: #212529; }
.status-badge.bg-danger { background-color: #dc3545 !important; }

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

/* Enhanced Attachment Options */
.attachment-option {
  position: relative;
  overflow: hidden;
}

.attachment-option input[type="file"] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

/* URL Input Section */
.url-input-section {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.url-input-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.url-input-body {
  /* Additional styling for URL input body */
}

.url-preview {
  margin-top: 1rem;
}

.url-error {
  margin-top: 0.5rem;
}

/* Loading Spinner for Send Button */
.send-btn .loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
}

/* Modal Styles */
.modal.show {
  display: block !important;
}

.modal-backdrop.show {
  opacity: 0.5;
}
</style> 