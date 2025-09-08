<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <nav class="sidebar bg-dark text-white" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <div class="sidebar-header p-3 border-bottom border-secondary">
        <div class="d-flex align-items-center">
          <div class="sidebar-logo me-3">
            <i class="bi bi-whatsapp fs-3 text-success"></i>
          </div>
          <div v-if="!sidebarCollapsed" class="sidebar-title">
            <h5 class="mb-0 text-white">WA Gateway</h5>
            <!-- <small class="text-muted">Dashboard</small> -->
          </div>
        </div>
      </div>

      <div class="sidebar-content">
        <ul class="nav flex-column">
          <li class="nav-item">
            <NuxtLink to="/dashboard" class="nav-link" active-class="active">
              <i class="bi bi-speedometer2 me-2"></i>
              <span v-if="!sidebarCollapsed">Dashboard</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/devices" class="nav-link" active-class="active">
              <i class="bi bi-phone me-2"></i>
              <span v-if="!sidebarCollapsed">Devices</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/messages" class="nav-link" active-class="active">
              <i class="bi bi-chat-dots me-2"></i>
              <span v-if="!sidebarCollapsed">Messages</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/contacts" class="nav-link" active-class="active">
              <i class="bi bi-people me-2"></i>
              <span v-if="!sidebarCollapsed">Contacts</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/broadcasts" class="nav-link" active-class="active">
              <i class="bi bi-megaphone me-2"></i>
              <span v-if="!sidebarCollapsed">Broadcasts</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/templates" class="nav-link" active-class="active">
              <i class="bi bi-file-text me-2"></i>
              <span v-if="!sidebarCollapsed">Templates</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/analytics" class="nav-link" active-class="active">
              <i class="bi bi-graph-up me-2"></i>
              <span v-if="!sidebarCollapsed">Analytics</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/api-keys" class="nav-link" active-class="active">
              <i class="bi bi-key me-2"></i>
              <span v-if="!sidebarCollapsed">API Keys</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/webhooks" class="nav-link" active-class="active">
              <i class="bi bi-plug me-2"></i>
              <span v-if="!sidebarCollapsed">Webhooks</span>
            </NuxtLink>
          </li>
          <li class="nav-item">
            <NuxtLink to="/subscriptions" class="nav-link" active-class="active">
              <i class="bi bi-credit-card me-2"></i>
              <span v-if="!sidebarCollapsed">Subscriptions</span>
            </NuxtLink>
          </li>
        </ul>

      </div>

      <!-- Sidebar Toggle -->
      <div class="sidebar-toggle">
        <button
          class="btn btn-outline-light btn-sm"
          @click="toggleSidebar"
          :title="sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'"
        >
          <i :class="sidebarCollapsed ? 'bi bi-chevron-right' : 'bi bi-chevron-left'"></i>
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'main-content-expanded': sidebarCollapsed }">
      <!-- Top Navigation -->
      <nav class="top-nav bg-white shadow-sm border-bottom">
        <div class="container-fluid">
          <div class="d-flex align-items-center justify-content-between py-2">
            <div class="d-flex align-items-center">
              <button
                class="btn btn-link text-dark me-3 d-lg-none"
                @click="toggleSidebar"
              >
                <i class="bi bi-list fs-4"></i>
              </button>
              <h4 class="mb-0">{{ pageTitle }}</h4>
            </div>
            
            <div class="d-flex align-items-center gap-3">
              <!-- Notifications -->
              <div class="dropdown">
                <button
                  class="btn btn-link text-dark position-relative"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i class="bi bi-bell fs-5"></i>
                  <span 
                    v-if="notificationCount > 0"
                    class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                  >
                    {{ notificationCount }}
                  </span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><h6 class="dropdown-header">Notifications</h6></li>
                  <li v-if="notifications.length === 0">
                    <a class="dropdown-item text-muted" href="#">
                      <i class="bi bi-check-circle me-2"></i>
                      No new notifications
                    </a>
                  </li>
                  <li v-for="notification in notifications" :key="notification.id">
                    <a class="dropdown-item" href="#" @click="markAsRead(notification.id)">
                      <i :class="notification.icon + ' me-2'"></i>
                      {{ notification.message }}
                      <small class="text-muted d-block">{{ notification.time }}</small>
                    </a>
                  </li>
                  <li v-if="notifications.length > 0"><hr class="dropdown-divider"></li>
                  <li>
                    <a class="dropdown-item" href="#" @click="clearAllNotifications">
                      <i class="bi bi-trash me-2"></i>
                      Clear all notifications
                    </a>
                  </li>
                </ul>
              </div>
              
              <!-- User Profile Dropdown -->
              <div class="dropdown" ref="userDropdown">
                <button
                  class="btn btn-link text-dark d-flex align-items-center gap-2 p-2"
                  type="button"
                  @click="toggleUserDropdown"
                  style="text-decoration: none;"
                >
                  <div class="user-details d-none d-md-block text-start">
                    <div class="user-name fw-semibold text-dark">{{ getUserDisplayName() }}</div>
                    <div class="user-email text-muted small">{{ user?.email || '-' }}</div>
                  </div>
                  <div class="user-avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                    <i class="bi bi-person"></i>
                  </div>
                  <i class="bi bi-chevron-down text-muted" :class="{ 'rotate-180': showUserDropdown }"></i>
                </button>
                <ul 
                  class="dropdown-menu dropdown-menu-end shadow" 
                  :class="{ 'show': showUserDropdown }"
                  style="position: absolute;z-index: 1000;margin-left: 65px;margin-top: 5px;"
                >
                  <li>
                    <NuxtLink to="/settings" class="dropdown-item d-flex align-items-center" @click="closeUserDropdown">
                      <i class="bi bi-gear me-2"></i>
                      Settings
                    </NuxtLink>
                  </li>
                  <li><hr class="dropdown-divider"></li>
                  <li>
                    <a href="#" class="dropdown-item d-flex align-items-center text-danger" @click="handleLogout">
                      <i class="bi bi-box-arrow-right me-2"></i>
                      Logout
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Page Content -->
      <main class="page-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { $toast } = useNuxtApp()

// Initialize auth on mount
onMounted(async () => {
  // Initialize auth store if not already done
  if (!user.value) {
    authStore.initializeAuth()
  }
  
  // If still no user, try to fetch from API
  const token = localStorage.getItem('auth_token')
  if (!user.value && token) {
    await authStore.fetchUser()
  }
})

// Get user display name
const getUserDisplayName = () => {
  if (!user.value) {
    return 'User'
  }
  
  // Priority: full_name > username > email (first part)
  if (user.value.full_name && user.value.full_name.trim()) {
    return user.value.full_name
  }
  
  if (user.value.username && user.value.username.trim()) {
    return user.value.username
  }
  
  if (user.value.email) {
    return user.value.email.split('@')[0]
  }
  
  return 'User'
}

const sidebarCollapsed = ref(false)
const pageTitle = ref('Dashboard')
const showUserDropdown = ref(false)
const userDropdown = ref(null)

// Notifications
const notifications = ref([])
const notificationCount = computed(() => notifications.value.length)

// Handle logout
const handleLogout = async () => {
  $toast.info('Logging out...')
  await authStore.logout()
}

// Toggle sidebar
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// Toggle user dropdown
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

// Close user dropdown
const closeUserDropdown = () => {
  showUserDropdown.value = false
}

// Notification methods
const markAsRead = (notificationId) => {
  notifications.value = notifications.value.filter(n => n.id !== notificationId)
}

const clearAllNotifications = () => {
  notifications.value = []
  $toast.success('All notifications cleared')
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (event) => {
    if (userDropdown.value && !userDropdown.value.contains(event.target)) {
      showUserDropdown.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

// Update page title based on route
const route = useRoute()
    watch(() => route.path, (newPath) => {
      const titles = {
        '/dashboard': 'Dashboard',
        '/devices': 'Device Management',
        '/messages': 'Messages',
        '/contacts': 'Contacts',
        '/broadcasts': 'Broadcasts',
        '/templates': 'Message Templates',
        '/analytics': 'Analytics',
        '/api-keys': 'API Key Management',
        '/webhooks': 'Webhook Management',
        '/subscriptions': 'Subscription Plans',
        '/settings': 'Settings'
      }
      pageTitle.value = titles[newPath] || 'Dashboard'
    }, { immediate: true })
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

.dropdown-menu {
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
}

.sidebar {
  width: 280px;
  min-height: 100vh;
  transition: width 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
}

.sidebar-collapsed {
  width: 70px;
}

.sidebar-header {
  height: 70px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.sidebar-toggle {
  position: absolute;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
}

.nav-link {
  color: rgba(255, 255, 255, 0.8);
  padding: 0.75rem 1.5rem;
  border: none;
  transition: all 0.3s ease;
}

.nav-link:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-link.active {
  color: white;
  background-color: rgba(37, 211, 102, 0.2);
  border-right: 3px solid #25D366;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
}

.main-content-expanded {
  margin-left: 70px;
}

.top-nav {
  height: 70px;
  position: sticky;
  top: 0;
  z-index: 999;
}

.page-content {
  flex: 1;
  background-color: #f8f9fa;
}

.user-avatar {
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
}

.user-name {
  font-size: 0.9rem;
  line-height: 1.2;
}

.user-email {
  font-size: 0.75rem;
  line-height: 1.2;
}

/* Responsive */
@media (max-width: 992px) {
  .sidebar {
    transform: translateX(-100%);
  }
  
  .sidebar.show {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
  }
  
  .main-content-expanded {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .user-details {
    display: none;
  }
}
</style> 