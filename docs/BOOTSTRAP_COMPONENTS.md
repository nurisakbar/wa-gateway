# WA Gateway - Bootstrap Components Guide

## 🎨 Bootstrap 5 Integration

Panduan lengkap penggunaan Bootstrap 5 dalam aplikasi WA Gateway dengan Nuxt.js 3.

## 📦 Installation

### Dependencies
```bash
npm install bootstrap @popperjs/core
```

### Nuxt.js Configuration
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '~/assets/css/main.css'
  ],
  
  plugins: [
    '~/plugins/bootstrap.client.ts'
  ]
})
```

### Bootstrap Plugin
```typescript
// plugins/bootstrap.client.ts
import * as bootstrap from 'bootstrap'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      bootstrap
    }
  }
})
```

## 🧩 Component Examples

### 1. Navigation Bar
```vue
<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" href="#">
        <i class="bi bi-whatsapp me-2"></i>
        WA Gateway
      </a>
      
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span class="navbar-toggler-icon"></span>
      </button>
      
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="bi bi-house me-1"></i>
              Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="bi bi-chat me-1"></i>
              Messages
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="bi bi-people me-1"></i>
              Contacts
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="bi bi-folder me-1"></i>
              Files
            </a>
          </li>
        </ul>
        
        <ul class="navbar-nav">
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
              <i class="bi bi-person-circle me-1"></i>
              Admin
            </a>
            <ul class="dropdown-menu">
              <li><a class="dropdown-item" href="#">Profile</a></li>
              <li><a class="dropdown-item" href="#">Settings</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><a class="dropdown-item" href="#">Logout</a></li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>
```

### 2. Dashboard Layout
```vue
<template>
  <div class="container-fluid">
    <div class="row">
      <!-- Sidebar -->
      <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar">
        <div class="position-sticky pt-3">
          <ul class="nav flex-column">
            <li class="nav-item">
              <a class="nav-link active" href="#">
                <i class="bi bi-speedometer2 me-2"></i>
                Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="bi bi-phone me-2"></i>
                Devices
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="bi bi-chat-dots me-2"></i>
                Messages
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="bi bi-people me-2"></i>
                Contacts
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="bi bi-folder me-2"></i>
                Files
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="bi bi-graph-up me-2"></i>
                Analytics
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
        <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 class="h2">Dashboard</h1>
          <div class="btn-toolbar mb-2 mb-md-0">
            <div class="btn-group me-2">
              <button type="button" class="btn btn-sm btn-outline-secondary">Export</button>
              <button type="button" class="btn btn-sm btn-outline-secondary">Print</button>
            </div>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="row">
          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-primary shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Total Messages
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">1,234</div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-chat-dots fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-success shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Connected Devices
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">3</div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-phone fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-info shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                      Success Rate
                    </div>
                    <div class="row no-gutters align-items-center">
                      <div class="col-auto">
                        <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800">98%</div>
                      </div>
                      <div class="col">
                        <div class="progress progress-sm mr-2">
                          <div class="progress-bar bg-info" role="progressbar" style="width: 98%"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-check-circle fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6 mb-4">
            <div class="card border-left-warning shadow h-100 py-2">
              <div class="card-body">
                <div class="row no-gutters align-items-center">
                  <div class="col mr-2">
                    <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Pending Messages
                    </div>
                    <div class="h5 mb-0 font-weight-bold text-gray-800">18</div>
                  </div>
                  <div class="col-auto">
                    <i class="bi bi-clock fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
```

### 3. Message Form
```vue
<template>
  <div class="card">
    <div class="card-header">
      <h5 class="card-title mb-0">
        <i class="bi bi-send me-2"></i>
        Send Message
      </h5>
    </div>
    <div class="card-body">
      <form @submit.prevent="sendMessage">
        <div class="row">
          <div class="col-md-6">
            <div class="mb-3">
              <label for="deviceSelect" class="form-label">Select Device</label>
              <select class="form-select" id="deviceSelect" v-model="selectedDevice" required>
                <option value="">Choose device...</option>
                <option v-for="device in devices" :key="device.id" :value="device.id">
                  {{ device.name }} ({{ device.phoneNumber }})
                </option>
              </select>
            </div>
          </div>
          <div class="col-md-6">
            <div class="mb-3">
              <label for="messageType" class="form-label">Message Type</label>
              <select class="form-select" id="messageType" v-model="messageType">
                <option value="text">Text Message</option>
                <option value="image">Image</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
        </div>

        <div class="mb-3">
          <label for="recipient" class="form-label">Recipient</label>
          <div class="input-group">
            <span class="input-group-text">+62</span>
            <input 
              type="tel" 
              class="form-control" 
              id="recipient" 
              v-model="recipient"
              placeholder="81234567890"
              required
            >
          </div>
        </div>

        <div class="mb-3">
          <label for="message" class="form-label">Message</label>
          <textarea 
            class="form-control" 
            id="message" 
            rows="4" 
            v-model="message"
            placeholder="Enter your message here..."
            required
          ></textarea>
        </div>

        <div v-if="messageType !== 'text'" class="mb-3">
          <label for="fileUpload" class="form-label">Upload File</label>
          <input 
            type="file" 
            class="form-control" 
            id="fileUpload"
            @change="handleFileUpload"
            :accept="getFileAccept()"
          >
          <div class="form-text">
            Maximum file size: 16MB
          </div>
        </div>

        <div class="d-flex justify-content-between">
          <button type="button" class="btn btn-secondary" @click="resetForm">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Reset
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSending">
            <i class="bi bi-send me-1"></i>
            {{ isSending ? 'Sending...' : 'Send Message' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
const selectedDevice = ref('')
const messageType = ref('text')
const recipient = ref('')
const message = ref('')
const isSending = ref(false)

const devices = ref([
  { id: 1, name: 'Device 1', phoneNumber: '81234567890' },
  { id: 2, name: 'Device 2', phoneNumber: '81234567891' }
])

const sendMessage = async () => {
  isSending.value = true
  try {
    // API call here
    await new Promise(resolve => setTimeout(resolve, 2000))
    showSuccessToast('Message sent successfully!')
    resetForm()
  } catch (error) {
    showErrorToast('Failed to send message')
  } finally {
    isSending.value = false
  }
}

const resetForm = () => {
  selectedDevice.value = ''
  messageType.value = 'text'
  recipient.value = ''
  message.value = ''
}

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file && file.size > 16 * 1024 * 1024) {
    showErrorToast('File size exceeds 16MB limit')
    event.target.value = ''
  }
}

const getFileAccept = () => {
  switch (messageType.value) {
    case 'image': return 'image/*'
    case 'document': return '.pdf,.doc,.docx,.xls,.xlsx'
    case 'audio': return 'audio/*'
    case 'video': return 'video/*'
    default: return '*'
  }
}
</script>
```

### 4. Device Management
```vue
<template>
  <div class="row">
    <div class="col-12">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">
            <i class="bi bi-phone me-2"></i>
            Device Management
          </h5>
          <button class="btn btn-primary" @click="showAddDeviceModal = true">
            <i class="bi bi-plus me-1"></i>
            Add Device
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Device Name</th>
                  <th>Phone Number</th>
                  <th>Status</th>
                  <th>Last Connected</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="device in devices" :key="device.id">
                  <td>{{ device.name }}</td>
                  <td>{{ device.phoneNumber }}</td>
                  <td>
                    <span :class="getStatusBadgeClass(device.status)">
                      {{ device.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(device.lastConnected) }}</td>
                  <td>
                    <div class="btn-group" role="group">
                      <button 
                        class="btn btn-sm btn-outline-primary"
                        @click="connectDevice(device.id)"
                        :disabled="device.status === 'connected'"
                      >
                        <i class="bi bi-plug"></i>
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-secondary"
                        @click="showQRCode(device.id)"
                      >
                        <i class="bi bi-qr-code"></i>
                      </button>
                      <button 
                        class="btn btn-sm btn-outline-danger"
                        @click="deleteDevice(device.id)"
                      >
                        <i class="bi bi-trash"></i>
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

    <!-- Add Device Modal -->
    <div class="modal fade" id="addDeviceModal" tabindex="-1" v-show="showAddDeviceModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Add New Device</h5>
            <button type="button" class="btn-close" @click="showAddDeviceModal = false"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="addDevice">
              <div class="mb-3">
                <label for="deviceName" class="form-label">Device Name</label>
                <input type="text" class="form-control" id="deviceName" v-model="newDevice.name" required>
              </div>
              <div class="mb-3">
                <label for="phoneNumber" class="form-label">Phone Number</label>
                <input type="tel" class="form-control" id="phoneNumber" v-model="newDevice.phoneNumber" required>
              </div>
              <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" v-model="newDevice.description" rows="3"></textarea>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showAddDeviceModal = false">Cancel</button>
            <button type="button" class="btn btn-primary" @click="addDevice">Add Device</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const showAddDeviceModal = ref(false)
const newDevice = ref({
  name: '',
  phoneNumber: '',
  description: ''
})

const devices = ref([
  {
    id: 1,
    name: 'Device 1',
    phoneNumber: '81234567890',
    status: 'connected',
    lastConnected: new Date()
  },
  {
    id: 2,
    name: 'Device 2',
    phoneNumber: '81234567891',
    status: 'disconnected',
    lastConnected: new Date(Date.now() - 86400000)
  }
])

const getStatusBadgeClass = (status) => {
  return {
    'badge bg-success': status === 'connected',
    'badge bg-danger': status === 'disconnected',
    'badge bg-warning': status === 'connecting'
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const connectDevice = async (deviceId) => {
  // API call to connect device
}

const showQRCode = (deviceId) => {
  // Show QR code modal
}

const deleteDevice = async (deviceId) => {
  if (confirm('Are you sure you want to delete this device?')) {
    // API call to delete device
  }
}

const addDevice = async () => {
  // API call to add device
  showAddDeviceModal.value = false
  newDevice.value = { name: '', phoneNumber: '', description: '' }
}
</script>
```

### 5. Message History
```vue
<template>
  <div class="card">
    <div class="card-header">
      <h5 class="card-title mb-0">
        <i class="bi bi-chat-dots me-2"></i>
        Message History
      </h5>
    </div>
    <div class="card-body">
      <div class="row mb-3">
        <div class="col-md-4">
          <input 
            type="text" 
            class="form-control" 
            placeholder="Search messages..."
            v-model="searchQuery"
          >
        </div>
        <div class="col-md-3">
          <select class="form-select" v-model="statusFilter">
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div class="col-md-3">
          <select class="form-select" v-model="deviceFilter">
            <option value="">All Devices</option>
            <option v-for="device in devices" :key="device.id" :value="device.id">
              {{ device.name }}
            </option>
          </select>
        </div>
        <div class="col-md-2">
          <button class="btn btn-outline-secondary w-100" @click="refreshMessages">
            <i class="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Date</th>
              <th>Device</th>
              <th>Recipient</th>
              <th>Message</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="msg in filteredMessages" :key="msg.id">
              <td>{{ formatDate(msg.timestamp) }}</td>
              <td>{{ getDeviceName(msg.deviceId) }}</td>
              <td>{{ msg.recipient }}</td>
              <td>
                <div class="text-truncate" style="max-width: 200px;">
                  {{ msg.content }}
                </div>
              </td>
              <td>
                <span :class="getTypeBadgeClass(msg.type)">
                  {{ msg.type }}
                </span>
              </td>
              <td>
                <span :class="getStatusBadgeClass(msg.status)">
                  {{ msg.status }}
                </span>
              </td>
              <td>
                <div class="btn-group" role="group">
                  <button class="btn btn-sm btn-outline-primary" @click="viewMessage(msg.id)">
                    <i class="bi bi-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-outline-success" @click="resendMessage(msg.id)">
                    <i class="bi bi-arrow-repeat"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav aria-label="Message pagination">
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage - 1)">Previous</a>
          </li>
          <li 
            v-for="page in totalPages" 
            :key="page" 
            class="page-item"
            :class="{ active: page === currentPage }"
          >
            <a class="page-link" href="#" @click.prevent="changePage(page)">{{ page }}</a>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <a class="page-link" href="#" @click.prevent="changePage(currentPage + 1)">Next</a>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script setup>
const searchQuery = ref('')
const statusFilter = ref('')
const deviceFilter = ref('')
const currentPage = ref(1)
const totalPages = ref(10)

const messages = ref([
  {
    id: 1,
    timestamp: new Date(),
    deviceId: 1,
    recipient: '81234567890',
    content: 'Hello, this is a test message',
    type: 'text',
    status: 'sent'
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 3600000),
    deviceId: 2,
    recipient: '81234567891',
    content: 'Image message',
    type: 'image',
    status: 'delivered'
  }
])

const devices = ref([
  { id: 1, name: 'Device 1' },
  { id: 2, name: 'Device 2' }
])

const filteredMessages = computed(() => {
  return messages.value.filter(msg => {
    const matchesSearch = msg.content.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                         msg.recipient.includes(searchQuery.value)
    const matchesStatus = !statusFilter.value || msg.status === statusFilter.value
    const matchesDevice = !deviceFilter.value || msg.deviceId === parseInt(deviceFilter.value)
    
    return matchesSearch && matchesStatus && matchesDevice
  })
})

const getTypeBadgeClass = (type) => {
  return {
    'badge bg-primary': type === 'text',
    'badge bg-success': type === 'image',
    'badge bg-info': type === 'document',
    'badge bg-warning': type === 'audio',
    'badge bg-secondary': type === 'video'
  }
}

const getStatusBadgeClass = (status) => {
  return {
    'badge bg-success': status === 'sent',
    'badge bg-info': status === 'delivered',
    'badge bg-primary': status === 'read',
    'badge bg-danger': status === 'failed'
  }
}

const getDeviceName = (deviceId) => {
  const device = devices.value.find(d => d.id === deviceId)
  return device ? device.name : 'Unknown'
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const refreshMessages = () => {
  // API call to refresh messages
}

const viewMessage = (messageId) => {
  // Show message details modal
}

const resendMessage = async (messageId) => {
  // API call to resend message
}

const changePage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Load messages for this page
  }
}
</script>
```

## 🎯 Custom CSS Classes

### Custom Utility Classes
```css
/* Custom spacing */
.mt-6 { margin-top: 4rem !important; }
.mb-6 { margin-bottom: 4rem !important; }
.py-6 { padding-top: 4rem !important; padding-bottom: 4rem !important; }

/* Custom shadows */
.shadow-sm { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075) !important; }
.shadow-md { box-shadow: 0 .5rem 1rem rgba(0,0,0,.15) !important; }
.shadow-lg { box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important; }

/* Custom borders */
.border-left-primary { border-left: 0.25rem solid #0d6efd !important; }
.border-left-success { border-left: 0.25rem solid #198754 !important; }
.border-left-info { border-left: 0.25rem solid #0dcaf0 !important; }
.border-left-warning { border-left: 0.25rem solid #ffc107 !important; }

/* Custom text colors */
.text-gray-800 { color: #5a5c69 !important; }
.text-gray-300 { color: #dddfeb !important; }

/* Custom background colors */
.bg-gradient-primary { background: linear-gradient(180deg, #0d6efd 10%, #0b5ed7 100%) !important; }
.bg-gradient-success { background: linear-gradient(180deg, #198754 10%, #157347 100%) !important; }

/* Custom components */
.device-card {
  transition: transform 0.2s ease-in-out;
}

.device-card:hover {
  transform: translateY(-2px);
}

.message-bubble {
  border-radius: 1rem;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
}

.message-bubble.sent {
  background-color: #0d6efd;
  color: white;
  margin-left: auto;
}

.message-bubble.received {
  background-color: #f8f9fa;
  color: #212529;
  margin-right: auto;
}
```

## 📱 Responsive Design

### Mobile-First Approach
```css
/* Extra small devices (phones, 576px and down) */
@media (max-width: 575.98px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .card-body {
    padding: 1rem;
  }
  
  .btn-group {
    flex-direction: column;
  }
  
  .btn-group .btn {
    border-radius: 0.375rem !important;
    margin-bottom: 0.25rem;
  }
}

/* Small devices (landscape phones, 576px and up) */
@media (min-width: 576px) and (max-width: 767.98px) {
  .table-responsive {
    font-size: 0.875rem;
  }
}

/* Medium devices (tablets, 768px and up) */
@media (min-width: 768px) and (max-width: 991.98px) {
  .sidebar {
    position: static;
    height: auto;
    padding-top: 0;
  }
}

/* Large devices (desktops, 992px and up) */
@media (min-width: 992px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    padding-top: 0.5rem;
    overflow-x: hidden;
    overflow-y: auto;
  }
}
```

## 🎨 Theme Customization

### Bootstrap Variables Override
```css
:root {
  /* Primary Colors */
  --bs-primary: #0d6efd;
  --bs-primary-rgb: 13, 110, 253;
  --bs-primary-text-emphasis: #052c65;
  --bs-primary-bg-subtle: #cfe2ff;
  --bs-primary-border-subtle: #9ec5fe;

  /* Secondary Colors */
  --bs-secondary: #6c757d;
  --bs-secondary-rgb: 108, 117, 125;
  --bs-secondary-text-emphasis: #495057;
  --bs-secondary-bg-subtle: #f8f9fa;
  --bs-secondary-border-subtle: #dee2e6;

  /* Success Colors */
  --bs-success: #198754;
  --bs-success-rgb: 25, 135, 84;
  --bs-success-text-emphasis: #0f5132;
  --bs-success-bg-subtle: #d1e7dd;
  --bs-success-border-subtle: #a3cfbb;

  /* Info Colors */
  --bs-info: #0dcaf0;
  --bs-info-rgb: 13, 202, 240;
  --bs-info-text-emphasis: #055160;
  --bs-info-bg-subtle: #cff4fc;
  --bs-info-border-subtle: #9eeaf9;

  /* Warning Colors */
  --bs-warning: #ffc107;
  --bs-warning-rgb: 255, 193, 7;
  --bs-warning-text-emphasis: #664d03;
  --bs-warning-bg-subtle: #fff3cd;
  --bs-warning-border-subtle: #ffeaa7;

  /* Danger Colors */
  --bs-danger: #dc3545;
  --bs-danger-rgb: 220, 53, 69;
  --bs-danger-text-emphasis: #58151c;
  --bs-danger-bg-subtle: #f8d7da;
  --bs-danger-border-subtle: #f1aeb5;

  /* Border Radius */
  --bs-border-radius: 0.375rem;
  --bs-border-radius-sm: 0.25rem;
  --bs-border-radius-lg: 0.5rem;
  --bs-border-radius-xl: 0.75rem;
  --bs-border-radius-2xl: 1rem;

  /* Shadows */
  --bs-box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
  --bs-box-shadow-sm: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  --bs-box-shadow-lg: 0 1rem 3rem rgba(0, 0, 0, 0.175);
}
```

Dokumentasi ini memberikan panduan lengkap untuk menggunakan Bootstrap 5 dalam aplikasi WA Gateway dengan komponen-komponen yang sudah disesuaikan dengan kebutuhan aplikasi. 