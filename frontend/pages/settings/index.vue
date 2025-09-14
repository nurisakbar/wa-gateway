<template>
  <div class="settings-page">
    <div class="container-fluid">

      <!-- Settings Content -->
      <div class="settings-content">
        <div class="row g-4">
          <!-- Profile Settings -->
          <div class="col-lg-6">
            <div class="settings-card">
              <div class="card-header">
                <div class="header-icon-small">
                  <i class="bi bi-person-circle"></i>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Profile Information</h3>
                  <p class="card-subtitle">Update your personal details</p>
                </div>
              </div>
              <div class="card-body">
                <form @submit.prevent="updateProfile" class="settings-form">
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-person me-2"></i>
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      class="form-control modern-input" 
                      v-model="profileForm.name" 
                      placeholder="Enter your full name"
                      required 
                    />
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-envelope me-2"></i>
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      class="form-control modern-input" 
                      v-model="profileForm.email" 
                      placeholder="Enter your email address"
                      required 
                    />
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary-modern" :disabled="isUpdatingProfile">
                      <span v-if="isUpdatingProfile" class="loading-spinner me-2"></span>
                      <i v-else class="bi bi-check-lg me-2"></i>
                      {{ isUpdatingProfile ? 'Saving...' : 'Save Changes' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <!-- Security Settings -->
          <div class="col-lg-6">
            <div class="settings-card">
              <div class="card-header">
                <div class="header-icon-small">
                  <i class="bi bi-shield-lock"></i>
                </div>
                <div class="header-text">
                  <h3 class="card-title">Security Settings</h3>
                  <p class="card-subtitle">Change your password</p>
                </div>
              </div>
              <div class="card-body">
                <form @submit.prevent="changePassword" class="settings-form">
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-lock me-2"></i>
                      Current Password
                    </label>
                    <div class="password-input-group">
                      <input 
                        type="password" 
                        class="form-control modern-input" 
                        v-model="passwordForm.currentPassword" 
                        placeholder="Enter current password"
                        required 
                      />
                      <button 
                        type="button" 
                        class="password-toggle"
                        @click="showCurrentPassword = !showCurrentPassword"
                      >
                        <span class="eye-icon">{{ showCurrentPassword ? '🙈' : '👁️' }}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">
                      <i class="bi bi-key me-2"></i>
                      New Password
                    </label>
                    <div class="password-input-group">
                      <input 
                        :type="showNewPassword ? 'text' : 'password'" 
                        class="form-control modern-input" 
                        v-model="passwordForm.newPassword" 
                        placeholder="Enter new password"
                        required 
                      />
                      <button 
                        type="button" 
                        class="password-toggle"
                        @click="showNewPassword = !showNewPassword"
                      >
                        <span class="eye-icon">{{ showNewPassword ? '🙈' : '👁️' }}</span>
                      </button>
                    </div>
                  </div>
                  
                  <div class="form-actions">
                    <button type="submit" class="btn btn-warning-modern" :disabled="isChangingPassword">
                      <span v-if="isChangingPassword" class="loading-spinner me-2"></span>
                      <i v-else class="bi bi-shield-check me-2"></i>
                      {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { storeToRefs } from 'pinia'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const { $toast } = useNuxtApp()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// Form data
const profileForm = ref({
  name: '',
  email: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: ''
})

// Loading states
const isUpdatingProfile = ref(false)
const isChangingPassword = ref(false)

// Password visibility
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

// Notification settings
const notifications = ref({
  email: true,
  push: true,
  sms: false
})

const loadSettings = async () => {
  try {
    // Load user data from auth store
    if (user.value) {
      profileForm.value = {
        name: user.value.full_name || '',
        email: user.value.email || ''
      }
    }
    
    // Load notification settings (mock data for now)
    notifications.value = {
      email: true,
      push: true,
      sms: false
    }
  } catch (error) {
    console.error('Error loading settings:', error)
    $toast.error('Failed to load settings')
  }
}

const updateProfile = async () => {
  isUpdatingProfile.value = true
  try {
    const { $api } = useNuxtApp()
    const response = await $api.put('/auth/profile', {
      full_name: profileForm.value.name,
      email: profileForm.value.email
    })
    
    if (response.data.success) {
      // Update auth store
      authStore.updateUser({
        full_name: profileForm.value.name,
        email: profileForm.value.email
      })
      
      $toast.success('Profile updated successfully')
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    $toast.error('Failed to update profile')
  } finally {
    isUpdatingProfile.value = false
  }
}

const changePassword = async () => {
  isChangingPassword.value = true
  try {
    const { $api } = useNuxtApp()
    const response = await $api.put('/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    if (response.data.success) {
      $toast.success('Password changed successfully')
      passwordForm.value = {
        currentPassword: '',
        newPassword: ''
      }
    }
  } catch (error) {
    console.error('Error changing password:', error)
    $toast.error(error.response?.data?.message || 'Failed to change password')
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
/* Settings Page Layout */
.settings-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 2rem 0;
}

/* Header Section */
.settings-header {
  margin-bottom: 3rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.header-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #25D366, #128C7E);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  box-shadow: 0 8px 32px rgba(37, 211, 102, 0.3);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0.5rem 0 0 0;
  font-weight: 400;
}

/* Settings Content */
.settings-content {
  max-width: 1200px;
  margin: 0 auto;
}

/* Settings Cards */
.settings-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: none;
  overflow: hidden;
  transition: all 0.3s ease;
  height: 100%;
}

.settings-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.settings-card .card-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid #e9ecef;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon-small {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #25D366, #128C7E);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.card-subtitle {
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0.25rem 0 0 0;
}

.settings-card .card-body {
  padding: 2rem;
}

/* Form Styling */
.settings-form {
  width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  font-size: 0.95rem;
}

.modern-input {
  border: 2px solid #e9ecef;
  border-radius: 12px;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.modern-input:focus {
  border-color: #25D366;
  box-shadow: 0 0 0 0.2rem rgba(37, 211, 102, 0.25);
  background: white;
  outline: none;
}

.modern-input::placeholder {
  color: #adb5bd;
  font-weight: 400;
}

/* Password Input Group */
.password-input-group {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  z-index: 10;
}

.password-toggle:hover {
  color: #25D366;
  background-color: rgba(37, 211, 102, 0.1);
}

.eye-icon {
  font-size: 1.2rem;
  display: inline-block;
  line-height: 1;
}

/* Form Actions */
.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

/* Modern Buttons */
.btn-primary-modern {
  background: linear-gradient(135deg, #25D366, #128C7E);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
}

.btn-primary-modern:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(37, 211, 102, 0.4);
  background: linear-gradient(135deg, #20c997, #17a2b8);
}

.btn-primary-modern:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-warning-modern {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  border: none;
  border-radius: 12px;
  padding: 0.875rem 2rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.btn-warning-modern:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4);
  background: linear-gradient(135deg, #ffb300, #e65100);
}

.btn-warning-modern:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Notification Settings */
.notification-settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
}

.setting-item:hover {
  background: #e9ecef;
  border-color: #25D366;
}

.setting-info {
  flex: 1;
}

.setting-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 0.25rem 0;
}

.setting-description {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0;
}

.setting-control {
  margin-left: 1rem;
}

/* Custom Switch */
.form-check-input {
  width: 3rem;
  height: 1.5rem;
  background-color: #e9ecef;
  border: none;
  border-radius: 1rem;
  transition: all 0.3s ease;
}

.form-check-input:checked {
  background-color: #25D366;
  border-color: #25D366;
}

.form-check-input:focus {
  box-shadow: 0 0 0 0.2rem rgba(37, 211, 102, 0.25);
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-radius: 50%;
  border-top-color: transparent;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
  .settings-page {
    padding: 1rem 0;
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .header-icon {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .settings-card .card-header {
    padding: 1.5rem;
  }
  
  .settings-card .card-body {
    padding: 1.5rem;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .setting-control {
    margin-left: 0;
    align-self: flex-end;
  }
}

@media (max-width: 576px) {
  .page-title {
    font-size: 1.75rem;
  }
  
  .settings-card .card-header {
    padding: 1rem;
  }
  
  .settings-card .card-body {
    padding: 1rem;
  }
  
  .form-actions {
    justify-content: center;
  }
  
  .btn-primary-modern,
  .btn-warning-modern {
    width: 100%;
    padding: 1rem;
  }
}
</style> 