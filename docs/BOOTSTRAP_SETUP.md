# WA Gateway - Bootstrap Setup Guide

## 🎨 Bootstrap 5 Integration

Panduan setup Bootstrap 5 untuk aplikasi WA Gateway dengan Nuxt.js 3.

## 📦 Installation

### 1. Install Dependencies
```bash
npm install bootstrap @popperjs/core
```

### 2. Nuxt.js Configuration
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

### 3. Bootstrap Plugin
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

### 4. Custom CSS
```css
/* assets/css/main.css */
:root {
  --bs-primary: #0d6efd;
  --bs-secondary: #6c757d;
  --bs-success: #198754;
  --bs-info: #0dcaf0;
  --bs-warning: #ffc107;
  --bs-danger: #dc3545;
}

.navbar-brand {
  font-weight: 600;
}

.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
}

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
```

## 🧩 Component Examples

### Navigation Bar
```vue
<template>
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
</template>
```

### Message Form
```vue
<template>
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
</template>
```

### Device Status
```vue
<template>
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
</template>
```

## 🎯 Benefits of Bootstrap 5

1. **Responsive Design**: Mobile-first approach
2. **Component Library**: Rich set of pre-built components
3. **Customizable**: Easy to customize with CSS variables
4. **Accessibility**: Built-in accessibility features
5. **Cross-browser**: Excellent compatibility
6. **Documentation**: Comprehensive documentation
7. **Community**: Large community support
8. **Performance**: Optimized CSS and JavaScript
9. **Grid System**: Flexible 12-column grid
10. **Utilities**: Extensive utility classes

## 📱 Responsive Breakpoints

- **Extra small**: < 576px
- **Small**: ≥ 576px
- **Medium**: ≥ 768px
- **Large**: ≥ 992px
- **Extra large**: ≥ 1200px
- **Extra extra large**: ≥ 1400px

## 🎨 Color System

- **Primary**: #0d6efd (Blue)
- **Secondary**: #6c757d (Gray)
- **Success**: #198754 (Green)
- **Info**: #0dcaf0 (Cyan)
- **Warning**: #ffc107 (Yellow)
- **Danger**: #dc3545 (Red)
- **Light**: #f8f9fa (Light Gray)
- **Dark**: #212529 (Dark Gray)

Dokumentasi ini memberikan panduan dasar untuk menggunakan Bootstrap 5 dalam aplikasi WA Gateway. 