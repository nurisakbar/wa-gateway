<template>
  <div class="docs-container">
    <!-- Sidebar Navigation -->

    <!-- Main Content Area -->
    <div class="main-content">
      <div class="content-header">
        <h1 class="content-title">
          <i class="bi bi-journal-text me-2"></i>
          Using API Keys to Send WhatsApp
        </h1>
        <p class="content-subtitle">Panduan singkat menggunakan API Key untuk mengirim WhatsApp via Postman.</p>
      </div>

      <!-- API Key Setup Section -->
      <div class="section-card" v-if="!activeEndpoint">
        <div class="section-header">
          <h2><i class="bi bi-1-circle me-2"></i>Buat API Key (tanpa login token)</h2>
        </div>
        <div class="section-content">
          <ol>
            <li>Buka menu <code>API Keys</code> → klik <strong>Create API Key</strong>.</li>
            <li>Isi <em>Name</em>, centang <em>Permissions</em> (minimal <code>read</code> dan <code>write</code>), tentukan <em>Rate Limit</em> bila perlu.</li>
            <li>Jika menggunakan arsitektur per‑device, gunakan tombol <strong>Token</strong> pada halaman <code>Devices</code> untuk mendapatkan <strong>API key</strong> yang terikat ke device.</li>
            <li>Simpan, lalu salin <strong>Full API Key</strong> (format: <code>wg_...</code>). Simpan di tempat aman.</li>
          </ol>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="row" v-if="activeEndpoint">
        <!-- Left Column: Endpoint List -->
        <div class="col-md-3">
          <div class="endpoint-list-card">
            <!-- <div class="card-header">
              <h5 class="mb-0"><i class="bi bi-list me-2"></i>API Endpoints</h5>
            </div> -->
            <div class="card-body p-0">
              <!-- Messages Section -->
              <div class="endpoint-section">
                <div class="section-header" @click="toggleSection('messages')">
                  <i class="bi bi-folder me-2"></i>
                  <span>Messages</span>
                  <i class="bi bi-chevron-down ms-auto" v-if="sections.messages"></i>
                  <i class="bi bi-chevron-right ms-auto" v-if="!sections.messages"></i>
                </div>
                <div class="section-content" v-if="sections.messages">
                  <div class="endpoint-item" 
                       v-for="endpoint in messageEndpoints" 
                       :key="endpoint.id"
                       :class="{ 'active': activeEndpoint === endpoint.id }"
                       @click="setActiveEndpoint(endpoint.id)">
                    <span class="method-badge" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                    <span class="endpoint-name">{{ endpoint.name }}</span>
                  </div>
                </div>
              </div>

              <!-- Interactive Section -->
              <div class="endpoint-section">
                <div class="section-header" @click="toggleSection('interactive')">
                  <i class="bi bi-folder me-2"></i>
                  <span>Interactive</span>
                  <i class="bi bi-chevron-down ms-auto" v-if="sections.interactive"></i>
                  <i class="bi bi-chevron-right ms-auto" v-if="!sections.interactive"></i>
                </div>
                <div class="section-content" v-if="sections.interactive">
                  <div class="endpoint-item" 
                       v-for="endpoint in interactiveEndpoints" 
                       :key="endpoint.id"
                       :class="{ 'active': activeEndpoint === endpoint.id }"
                       @click="setActiveEndpoint(endpoint.id)">
                    <span class="method-badge" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                    <span class="endpoint-name">{{ endpoint.name }}</span>
                  </div>
                </div>
              </div>

              <!-- Devices Section -->
              <div class="endpoint-section">
                <div class="section-header" @click="toggleSection('devices')">
                  <i class="bi bi-folder me-2"></i>
                  <span>Devices</span>
                  <i class="bi bi-chevron-down ms-auto" v-if="sections.devices"></i>
                  <i class="bi bi-chevron-right ms-auto" v-if="!sections.devices"></i>
                </div>
                <div class="section-content" v-if="sections.devices">
                  <div class="endpoint-item" 
                       v-for="endpoint in deviceEndpoints" 
                       :key="endpoint.id"
                       :class="{ 'active': activeEndpoint === endpoint.id }"
                       @click="setActiveEndpoint(endpoint.id)">
                    <span class="method-badge" :class="endpoint.method.toLowerCase()">{{ endpoint.method }}</span>
                    <span class="endpoint-name">{{ endpoint.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Endpoint Details -->
        <div class="col-md-9">
          <div class="endpoint-details">
            <div class="endpoint-header">
              <h2 class="endpoint-title">
                <span class="method-badge" :class="getCurrentEndpoint().method.toLowerCase()">
                  {{ getCurrentEndpoint().method }}
                </span>
                {{ getCurrentEndpoint().name }}
              </h2>
              <div class="endpoint-url">
                <input type="text" :value="getCurrentEndpoint().url" readonly class="url-input">
                <button class="copy-btn" @click="copyToClipboard(getCurrentEndpoint().url)">
                  <i class="bi bi-clipboard"></i>
                </button>
              </div>
            </div>

            <div class="endpoint-body">
              <div class="body-section">
                <h3>Body raw (json)</h3>
                <div class="code-block">
                  <div class="code-header">
                    <span class="code-lang">json</span>
                    <button class="copy-btn" @click="copyToClipboard(getCurrentEndpoint().body)">
                      <i class="bi bi-clipboard"></i>
                    </button>
                  </div>
                  <pre class="code-content">{{ getCurrentEndpoint().body }}</pre>
                </div>
              </div>
            </div>

            <!-- Example Request/Response Panels -->
            <div class="example-panels">
              <div class="example-panel">
                <div class="panel-header">
                  <h3>Example Request</h3>
                  <select class="example-select">
                    <option>{{ getCurrentEndpoint().name }}</option>
                  </select>
                </div>
                <div class="panel-content">
                  <div class="code-block">
                    <div class="code-header">
                      <span class="code-lang">curl</span>
                      <button class="copy-btn" @click="copyToClipboard(getCurrentEndpoint().curl)">
                        <i class="bi bi-clipboard"></i>
                      </button>
                    </div>
                    <pre class="code-content">{{ getCurrentEndpoint().curl }}</pre>
                  </div>
                </div>
              </div>

              <div class="example-panel">
                <div class="panel-header">
                  <h3>Example Response</h3>
                  <div class="response-tabs">
                    <button class="tab-btn active">Body</button>
                    <button class="tab-btn">Headers (0)</button>
                  </div>
                </div>
                <div class="panel-content">
                  <div class="response-content">
                    <p class="no-response">No response body</p>
                    <p class="no-response-desc">This request doesn't return any response body</p>
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
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const config = useRuntimeConfig()
const baseUrl = computed(() => config.public.apiBase)

// Reactive data
const sidebarCollapsed = ref(false)
const activeEndpoint = ref(null)
const sections = ref({
  messages: true,
  interactive: false,
  devices: false
})

// Endpoint data
const messageEndpoints = computed(() => [
  {
    id: 'send-text',
    method: 'POST',
    name: 'send Message Text',
    url: `${baseUrl.value}/whatsapp/send-message`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "message": "Hello from API Key!"
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-message' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "message": "Hello from API Key!"
}'`
  },
  {
    id: 'send-image',
    method: 'POST',
    name: 'send Image Url',
    url: `${baseUrl.value}/whatsapp/send-message`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "media_url": "https://example.com/image.jpg",
      "message": "Check this image!",
      "mime_type": "image/jpeg",
      "file_name": "image.jpg"
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-message' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "media_url": "https://example.com/image.jpg",
  "message": "Check this image!",
  "mime_type": "image/jpeg",
  "file_name": "image.jpg"
}'`
  },
  {
    id: 'send-document',
    method: 'POST',
    name: 'send Document Url',
    url: `${baseUrl.value}/whatsapp/send-message`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "media_url": "https://example.com/document.pdf",
      "message": "Here's the document",
      "mime_type": "application/pdf",
      "file_name": "document.pdf"
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-message' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "media_url": "https://example.com/document.pdf",
  "message": "Here's the document",
  "mime_type": "application/pdf",
  "file_name": "document.pdf"
}'`
  },
  {
    id: 'send-video',
    method: 'POST',
    name: 'send Video Url',
    url: `${baseUrl.value}/whatsapp/send-message`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "media_url": "https://example.com/video.mp4",
      "message": "Watch this video!",
      "mime_type": "video/mp4",
      "file_name": "video.mp4"
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-message' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "media_url": "https://example.com/video.mp4",
  "message": "Watch this video!",
  "mime_type": "video/mp4",
  "file_name": "video.mp4"
}'`
  },
  {
    id: 'send-location',
    method: 'POST',
    name: 'send Location',
    url: `${baseUrl.value}/whatsapp/send-message`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "location": {
        "latitude": -6.200000,
        "longitude": 106.816666,
        "name": "Jakarta",
        "address": "Jakarta, Indonesia"
      }
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-message' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "location": {
    "latitude": -6.200000,
    "longitude": 106.816666,
    "name": "Jakarta",
    "address": "Jakarta, Indonesia"
  }
}'`
  }
])

const interactiveEndpoints = computed(() => [
  {
    id: 'send-buttons',
    method: 'POST',
    name: 'send Template Buttons',
    url: `${baseUrl.value}/whatsapp/send-interactive`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "message": "Choose an action:",
      "template_buttons": [
        {
          "index": 1,
          "urlButton": {
            "displayText": "Visit Website",
            "url": "https://example.com"
          }
        },
        {
          "index": 2,
          "callButton": {
            "displayText": "Call Us",
            "phoneNumber": "+62123456789"
          }
        },
        {
          "index": 3,
          "quickReplyButton": {
            "displayText": "OK",
            "id": "ok-pressed"
          }
        }
      ]
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-interactive' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "message": "Choose an action:",
  "template_buttons": [
    {
      "index": 1,
      "urlButton": {
        "displayText": "Visit Website",
        "url": "https://example.com"
      }
    },
    {
      "index": 2,
      "callButton": {
        "displayText": "Call Us",
        "phoneNumber": "+62123456789"
      }
    },
    {
      "index": 3,
      "quickReplyButton": {
        "displayText": "OK",
        "id": "ok-pressed"
      }
    }
  ]
}'`
  },
  {
    id: 'send-list',
    method: 'POST',
    name: 'send List Message',
    url: `${baseUrl.value}/whatsapp/send-interactive`,
    body: JSON.stringify({
      "to": "62812xxxxxxx",
      "list_message": {
        "title": "Menu Options",
        "text": "Please select an option:",
        "button_text": "Choose",
        "sections": [
          {
            "title": "Main Menu",
            "rows": [
              {
                "title": "Option A",
                "rowId": "option-a",
                "description": "This is option A"
              },
              {
                "title": "Option B",
                "rowId": "option-b",
                "description": "This is option B"
              }
            ]
          }
        ]
      }
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/whatsapp/send-interactive' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "to": "62812xxxxxxx",
  "list_message": {
    "title": "Menu Options",
    "text": "Please select an option:",
    "button_text": "Choose",
    "sections": [
      {
        "title": "Main Menu",
        "rows": [
          {
            "title": "Option A",
            "rowId": "option-a",
            "description": "This is option A"
          },
          {
            "title": "Option B",
            "rowId": "option-b",
            "description": "This is option B"
          }
        ]
      }
    ]
  }
}'`
  }
])

const deviceEndpoints = computed(() => [
  {
    id: 'get-devices',
    method: 'GET',
    name: 'Get All Devices',
    url: `${baseUrl.value}/devices`,
    body: JSON.stringify({}, null, 2),
    curl: `curl --location '${baseUrl.value}/devices' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json'`
  },
  {
    id: 'get-device-detail',
    method: 'GET',
    name: 'Get Device Detail',
    url: `${baseUrl.value}/devices/{device_id}`,
    body: JSON.stringify({}, null, 2),
    curl: `curl --location '${baseUrl.value}/devices/{device_id}' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json'`
  },
  {
    id: 'create-device',
    method: 'POST',
    name: 'Create Device',
    url: `${baseUrl.value}/devices`,
    body: JSON.stringify({
      "name": "My Device",
      "description": "Device for WhatsApp Business"
    }, null, 2),
    curl: `curl --location '${baseUrl.value}/devices' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "name": "My Device",
  "description": "Device for WhatsApp Business"
}'`
  },
  {
    id: 'update-device',
    method: 'PUT',
    name: 'Update Device',
    url: `${baseUrl.value}/devices/{device_id}`,
    body: JSON.stringify({
      "name": "Updated Device Name",
      "description": "Updated description"
    }, null, 2),
    curl: `curl --location --request PUT '${baseUrl.value}/devices/{device_id}' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json' \\
--data '{
  "name": "Updated Device Name",
  "description": "Updated description"
}'`
  },
  {
    id: 'delete-device',
    method: 'DELETE',
    name: 'Delete Device',
    url: `${baseUrl.value}/devices/{device_id}`,
    body: JSON.stringify({}, null, 2),
    curl: `curl --location --request DELETE '${baseUrl.value}/devices/{device_id}' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json'`
  },
  {
    id: 'device-status',
    method: 'GET',
    name: 'Get Device Status',
    url: `${baseUrl.value}/devices/{device_id}/status`,
    body: JSON.stringify({}, null, 2),
    curl: `curl --location '${baseUrl.value}/devices/{device_id}/status' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json'`
  },
  {
    id: 'device-qr',
    method: 'GET',
    name: 'Get Device QR Code',
    url: `${baseUrl.value}/devices/{device_id}/qr`,
    body: JSON.stringify({}, null, 2),
    curl: `curl --location '${baseUrl.value}/devices/{device_id}/qr' \\
--header 'Authorization: Bearer <YOUR_API_KEY>' \\
--header 'Content-Type: application/json'`
  }
])

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleSection = (sectionName) => {
  sections.value[sectionName] = !sections.value[sectionName]
}

const setActiveEndpoint = (endpointId) => {
  activeEndpoint.value = endpointId
}

const getCurrentEndpoint = () => {
  const allEndpoints = [...messageEndpoints.value, ...interactiveEndpoints.value, ...deviceEndpoints.value]
  return allEndpoints.find(ep => ep.id === activeEndpoint.value) || allEndpoints[0]
}

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
    console.log('Copied to clipboard')
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

// Initialize with first endpoint
onMounted(() => {
  if (messageEndpoints.value.length > 0) {
    activeEndpoint.value = messageEndpoints.value[0].id
  }
  // Open messages section by default
  sections.value.messages = true
})
</script>

<style scoped>
.docs-container {
  display: flex;
  height: 100vh;
  background: #f8f9fa;
}

/* Sidebar Styles */
.sidebar {
  width: 280px;
  background: #2c3e50;
  color: white;
  transition: width 0.3s ease;
  overflow-y: auto;
  border-right: 1px solid #34495e;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1.5rem 1rem;
  border-bottom: 1px solid #34495e;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: #ecf0f1;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.sidebar-toggle:hover {
  background: #34495e;
}

.sidebar-nav {
  padding: 1rem 0;
}

.nav-section {
  margin-bottom: 0.5rem;
}

.nav-section-title {
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #bdc3c7;
  transition: background-color 0.2s;
  font-weight: 500;
}

.nav-section-title:hover {
  background: #34495e;
}

.nav-section-content {
  margin-left: 1rem;
}

.nav-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #95a5a6;
  transition: all 0.2s;
  border-radius: 4px;
  margin: 0.25rem 0;
}

.nav-item:hover {
  background: #34495e;
  color: #ecf0f1;
}

.nav-item.active {
  background: #3498db;
  color: white;
}

.method-badge {
  background: #e74c3c;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.method-badge.post {
  background: #e74c3c;
}

.method-badge.get {
  background: #27ae60;
}

.method-badge.put {
  background: #f39c12;
}

.method-badge.delete {
  background: #e67e22;
}

.endpoint-name {
  font-size: 0.9rem;
  flex: 1;
}

/* Main Content Styles */
.main-content {
  flex: 1;
  background: white;
  overflow-y: auto;
  padding: 2rem;
}

.content-header {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.content-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
}

.content-subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin: 0;
}

/* Section Cards */
.section-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.section-header {
  background: #f8f9fa;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.section-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
}

.section-content {
  padding: 1.5rem;
}

.section-content ol {
  margin: 0;
  padding-left: 1.5rem;
}

.section-content li {
  margin-bottom: 0.75rem;
  line-height: 1.6;
}

/* Endpoint Details */
.endpoint-details {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.endpoint-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.endpoint-title {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.endpoint-url {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.url-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f8f9fa;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
}

.copy-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.copy-btn:hover {
  background: #2980b9;
}

.endpoint-body {
  padding: 1.5rem;
}

.body-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

/* Code Blocks */
.code-block {
  background: #2c3e50;
  border-radius: 8px;
  overflow: hidden;
  margin: 1rem 0;
}

.code-header {
  background: #34495e;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #4a5f7a;
}

.code-lang {
  color: #bdc3c7;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: uppercase;
}

.code-content {
  padding: 1.5rem;
  margin: 0;
  color: #ecf0f1;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  overflow-x: auto;
  white-space: pre-wrap;
}

/* Endpoint List Card */
.endpoint-list-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  overflow: hidden;
}

.endpoint-section {
  border-bottom: 1px solid #e9ecef;
}

.endpoint-section:last-child {
  border-bottom: none;
}

.section-header {
  padding: 1rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  font-weight: 600;
  color: #2c3e50;
  transition: background-color 0.2s;
}

.section-header:hover {
  background: #e9ecef;
}

.section-content {
  padding: 0.5rem 0;
}

.endpoint-item {
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6c757d;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.endpoint-item:hover {
  background: #f8f9fa;
  color: #2c3e50;
}

.endpoint-item.active {
  background: #e3f2fd;
  color: #1976d2;
  border-left-color: #1976d2;
}

.endpoint-item .method-badge {
  background: #e74c3c;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 50px;
  text-align: center;
}

.endpoint-item .method-badge.post {
  background: #e74c3c;
}

.endpoint-item .method-badge.get {
  background: #27ae60;
}

.endpoint-item .method-badge.put {
  background: #f39c12;
}

.endpoint-item .method-badge.delete {
  background: #e67e22;
}

.endpoint-item .endpoint-name {
  font-size: 0.9rem;
  flex: 1;
}

/* Example Panels */
.example-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 2rem;
}

.example-panel {
  background: #2c3e50;
  border-radius: 8px;
  overflow: hidden;
  color: white;
}

.panel-header {
  background: #34495e;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #4a5f7a;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.example-select {
  background: #2c3e50;
  color: white;
  border: 1px solid #4a5f7a;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.panel-content {
  padding: 1.5rem;
}

.response-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  padding: 0.5rem 1rem;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #3498db;
  color: white;
}

.response-content {
  text-align: center;
  padding: 2rem;
}

.no-response {
  color: #bdc3c7;
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
}

.no-response-desc {
  color: #95a5a6;
  font-size: 0.9rem;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .docs-container {
    flex-direction: column;
    height: auto;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
  }
  
  .example-panels {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 1rem;
  }
  
  /* Stack columns on mobile */
  .row {
    flex-direction: column;
  }
  
  .col-md-4,
  .col-md-8 {
    width: 100%;
    max-width: 100%;
  }
}

/* Utility Classes */
code {
  background: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9em;
  color: #e74c3c;
}

strong {
  font-weight: 600;
  color: #2c3e50;
}

em {
  font-style: italic;
  color: #6c757d;
}
</style>

