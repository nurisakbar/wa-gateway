# WA Gateway - Nuxt.js Frontend Setup Guide

## 🚀 Nuxt.js 3 Setup

### Prerequisites
- Node.js 18+ 
- npm atau yarn
- Git

### Step 1: Create Nuxt.js Project
```bash
# Navigate to frontend directory
cd frontend

# Create Nuxt.js project
npx nuxi@latest init .

# Install dependencies
npm install
```

### Step 2: Install Required Modules
```bash
# Core modules
npm install bootstrap
npm install @popperjs/core
npm install @pinia/nuxt
npm install @nuxtjs/color-mode
npm install @nuxtjs/i18n

# UI and components
npm install @headlessui/vue
npm install @heroicons/vue
npm install vue-dropzone
npm install vue-toastification

# Charts and analytics
npm install chart.js
npm install vue-chartjs

# Real-time communication
npm install socket.io-client

# QR Code handling
npm install vue-qrcode-reader

# File handling
npm install @nuxtjs/axios
```

### Step 3: Configure nuxt.config.ts
```typescript
export default defineNuxtConfig({
  // Enable modules
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    '@nuxtjs/i18n',
    '@nuxtjs/axios'
  ],

  // Runtime config
  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
      wsUrl: process.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:3001'
    }
  },

  // App config
  app: {
    head: {
      title: 'WA Gateway',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'WhatsApp Gateway Application' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // CSS
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'vue-toastification/dist/index.css',
    '~/assets/css/main.css'
  ],

  // Build configuration
  build: {
    transpile: ['vue-toastification']
  },

  // Development
  devtools: { enabled: true },

  // SSR
  ssr: true,

  // Nitro configuration
  nitro: {
    preset: 'node-server'
  }
})
```

### Step 4: Project Structure
```
frontend/
├── components/           # Vue components
│   ├── Dashboard/
│   │   ├── DeviceStatus.vue
│   │   ├── MessageStats.vue
│   │   └── QuickActions.vue
│   ├── Messages/
│   │   ├── MessageForm.vue
│   │   ├── MessageList.vue
│   │   └── FileUpload.vue
│   ├── Contacts/
│   │   ├── ContactList.vue
│   │   ├── ContactForm.vue
│   │   └── ImportExport.vue
│   ├── Files/
│   │   ├── FileManager.vue
│   │   ├── FileUpload.vue
│   │   └── FilePreview.vue
│   ├── Settings/
│   │   ├── AutoReply.vue
│   │   ├── WebhookConfig.vue
│   │   └── ApiKeys.vue
│   └── Layout/
│       ├── Sidebar.vue
│       ├── Header.vue
│       └── Footer.vue
├── pages/               # Auto-generated routes
│   ├── index.vue        # Dashboard
│   ├── login.vue        # Login page
│   ├── messages/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── contacts/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── files/
│   │   ├── index.vue
│   │   └── [id].vue
│   └── settings/
│       ├── index.vue
│       ├── auto-reply.vue
│       ├── webhooks.vue
│       └── api-keys.vue
├── layouts/             # Layout components
│   ├── default.vue
│   └── auth.vue
├── middleware/          # Route middleware
│   ├── auth.ts
│   └── guest.ts
├── plugins/             # Nuxt plugins
│   ├── socket.io.client.ts
│   ├── toast.client.ts
│   ├── axios.client.ts
│   └── bootstrap.client.ts
├── composables/         # Composables (Vue 3)
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useMessages.ts
│   ├── useContacts.ts
│   └── useFiles.ts
├── stores/              # Pinia stores
│   ├── auth.ts
│   ├── messages.ts
│   ├── contacts.ts
│   ├── files.ts
│   └── devices.ts
├── server/              # Server-side API routes
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   └── logout.post.ts
│   │   ├── messages/
│   │   │   ├── index.get.ts
│   │   │   └── send.post.ts
│   │   ├── contacts/
│   │   │   ├── index.get.ts
│   │   │   └── import.post.ts
│   │   └── files/
│   │       ├── index.get.ts
│   │       └── upload.post.ts
│   └── middleware/
│       └── auth.ts
├── utils/               # Utility functions
│   ├── api.ts
│   ├── validation.ts
│   ├── formatters.ts
│   └── constants.ts
├── assets/              # Static assets
│   ├── css/
│   │   └── main.css
│   ├── images/
│   └── icons/
├── public/              # Public static files
│   ├── favicon.ico
│   └── images/
├── nuxt.config.ts       # Nuxt configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Dependencies
```

### Step 5: Environment Configuration
Create `.env` file:
```env
# API Configuration
NUXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NUXT_PUBLIC_WS_URL=ws://localhost:3001

# App Configuration
NUXT_PUBLIC_APP_NAME=WA Gateway
NUXT_PUBLIC_APP_VERSION=1.0.0

# Development
NODE_ENV=development
```

### Step 6: Custom CSS Setup
Create `assets/css/main.css`:
```css
/* Custom Bootstrap Variables */
:root {
  --bs-primary: #0d6efd;
  --bs-secondary: #6c757d;
  --bs-success: #198754;
  --bs-info: #0dcaf0;
  --bs-warning: #ffc107;
  --bs-danger: #dc3545;
  --bs-light: #f8f9fa;
  --bs-dark: #212529;
}

/* Custom Styles */
.navbar-brand {
  font-weight: 600;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.btn {
  border-radius: 0.375rem;
}

.form-control:focus {
  border-color: var(--bs-primary);
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Custom Components */
.device-status {
  padding: 0.5rem;
  border-radius: 0.375rem;
  margin-bottom: 0.5rem;
}

.device-status.connected {
  background-color: var(--bs-success);
  color: white;
}

.device-status.disconnected {
  background-color: var(--bs-danger);
  color: white;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}
```

### Step 7: Key Features Implementation

#### Authentication Store (stores/auth.ts)
```typescript
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isAuthenticated: false
  }),
  
  actions: {
    async login(credentials) {
      // Login logic
    },
    
    async logout() {
      // Logout logic
    },
    
    async checkAuth() {
      // Check authentication status
    }
  }
})
```

#### Bootstrap Plugin (plugins/bootstrap.client.ts)
```typescript
import * as bootstrap from 'bootstrap'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      bootstrap
    }
  }
})
```

#### Socket.io Plugin (plugins/socket.io.client.ts)
```typescript
import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket = io(config.public.wsUrl)
  
  return {
    provide: {
      socket
    }
  }
})
```

#### Message Composable (composables/useMessages.ts)
```typescript
export const useMessages = () => {
  const { $socket } = useNuxtApp()
  const { $api } = useNuxtApp()
  
  const sendMessage = async (messageData) => {
    // Send message logic
  }
  
  const getMessages = async (params) => {
    // Get messages logic
  }
  
  return {
    sendMessage,
    getMessages
  }
}
```

### Step 8: Development Commands
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate static site
npm run generate

# Lint code
npm run lint

# Type check
npm run typecheck
```

### Step 9: Deployment Configuration

#### For Static Hosting (Vercel, Netlify)
```bash
# Build static site
npm run generate

# Deploy .output/public directory
```

#### For Server-Side Rendering
```bash
# Build for SSR
npm run build

# Start production server
npm run start
```

### Step 10: Performance Optimization

#### Bootstrap Components Example
```vue
<template>
  <div class="container-fluid">
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container">
        <a class="navbar-brand" href="#">WA Gateway</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <a class="nav-link" href="#">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Messages</a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">Contacts</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-8">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Send Message</h5>
            </div>
            <div class="card-body">
              <form>
                <div class="mb-3">
                  <label for="phoneNumber" class="form-label">Phone Number</label>
                  <input type="text" class="form-control" id="phoneNumber" placeholder="6281234567890">
                </div>
                <div class="mb-3">
                  <label for="message" class="form-label">Message</label>
                  <textarea class="form-control" id="message" rows="3" placeholder="Enter your message"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Device Status</h5>
            </div>
            <div class="card-body">
              <div class="d-flex align-items-center mb-2">
                <div class="badge bg-success me-2">Connected</div>
                <span>Device 1</span>
              </div>
              <div class="d-flex align-items-center">
                <div class="badge bg-danger me-2">Disconnected</div>
                <span>Device 2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Bootstrap components will be available globally
</script>
```

#### Lazy Loading Components
```vue
<template>
  <div>
    <LazyDashboard />
    <LazyMessageList />
  </div>
</template>
```

#### Image Optimization
```vue
<template>
  <NuxtImg
    src="/images/logo.png"
    alt="Logo"
    width="200"
    height="100"
    loading="lazy"
  />
</template>
```

#### Code Splitting
```typescript
// Auto-imported composables
const { data } = await useFetch('/api/messages')

// Lazy-loaded pages
const MessagesPage = defineAsyncComponent(() => import('~/pages/messages/index.vue'))
```

### Step 11: Testing Setup
```bash
# Install testing dependencies
npm install -D @nuxt/test-utils
npm install -D vitest
npm install -D @vue/test-utils

# Create test configuration
```

### Benefits of Using Nuxt.js 3 + Bootstrap 5

1. **Auto-imports**: Components, composables, and utilities are auto-imported
2. **File-based Routing**: Automatic route generation based on file structure
3. **SSR/SSG Support**: Server-side rendering and static site generation
4. **Built-in Performance**: Automatic code splitting and optimization
5. **TypeScript Support**: Full TypeScript support out of the box
6. **Module System**: Rich ecosystem of modules
7. **Developer Experience**: Hot reload, devtools, and excellent DX
8. **SEO Friendly**: Better SEO with SSR capabilities
9. **API Routes**: Built-in API routes for backend integration
10. **Middleware Support**: Route middleware for authentication and guards
11. **Bootstrap 5**: Modern, responsive CSS framework with extensive component library
12. **Mobile-First**: Bootstrap's mobile-first approach ensures responsive design
13. **Customizable**: Easy to customize with CSS variables and SASS
14. **Accessibility**: Built-in accessibility features and ARIA support
15. **Cross-browser**: Excellent cross-browser compatibility

### Next Steps

1. Set up the basic Nuxt.js project structure
2. Configure authentication with Pinia store
3. Implement real-time communication with Socket.io
4. Create responsive UI components with Tailwind CSS
5. Set up file upload functionality
6. Implement message management features
7. Add contact management
8. Create analytics dashboard
9. Set up deployment pipeline
10. Add testing and monitoring

This setup provides a solid foundation for building a modern, scalable WhatsApp Gateway frontend with Nuxt.js 3. 