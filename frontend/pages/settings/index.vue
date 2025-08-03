<template>
  <div class="settings-page">
    <div class="container-fluid">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 class="h3 mb-0">
            <i class="bi bi-gear me-2"></i>
            Settings
          </h1>
          <p class="text-muted mb-0">Manage your account settings</p>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Profile Settings</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="updateProfile">
                <div class="mb-3">
                  <label class="form-label">Full Name</label>
                  <input type="text" class="form-control" v-model="profileForm.name" required />
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="profileForm.email" required />
                </div>
                
                <button type="submit" class="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Change Password</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="changePassword">
                <div class="mb-3">
                  <label class="form-label">Current Password</label>
                  <input type="password" class="form-control" v-model="passwordForm.currentPassword" required />
                </div>
                
                <div class="mb-3">
                  <label class="form-label">New Password</label>
                  <input type="password" class="form-control" v-model="passwordForm.newPassword" required />
                </div>
                
                <button type="submit" class="btn btn-warning">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth',
  layout: 'dashboard'
})

const profileForm = ref({
  name: '',
  email: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: ''
})

const loadSettings = async () => {
  try {
    const response = await $fetch('/api/v1/settings')
    profileForm.value = response.profile || profileForm.value
  } catch (error) {
    console.error('Error loading settings:', error)
  }
}

const updateProfile = async () => {
  try {
    await $fetch('/api/v1/settings/profile', {
      method: 'PUT',
      body: profileForm.value
    })
  } catch (error) {
    console.error('Error updating profile:', error)
  }
}

const changePassword = async () => {
  try {
    await $fetch('/api/v1/settings/password', {
      method: 'PUT',
      body: passwordForm.value
    })
    
    passwordForm.value = {
      currentPassword: '',
      newPassword: ''
    }
  } catch (error) {
    console.error('Error changing password:', error)
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<style scoped>
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
</style> 