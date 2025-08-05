<template>
  <div class="register-container">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6 col-lg-4">
          <div class="whatsapp-card">
            <div class="whatsapp-header text-center">
              <h2 class="mb-0">
                <i class="bi bi-whatsapp me-2"></i>
                WA Gateway
              </h2>
              <p class="mb-0 opacity-75">Create your account</p>
            </div>
            
            <div class="card-body p-4">
              <form @submit.prevent="handleRegister" novalidate>
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.username }"
                    id="username"
                    v-model="form.username"
                    placeholder="Enter your username"
                    required
                    :disabled="isLoading"
                  />
                  <div class="invalid-feedback" v-if="errors.username">
                    {{ errors.username }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="full_name" class="form-label">Full Name</label>
                  <input
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.full_name }"
                    id="full_name"
                    v-model="form.full_name"
                    placeholder="Enter your full name"
                    required
                    :disabled="isLoading"
                  />
                  <div class="invalid-feedback" v-if="errors.full_name">
                    {{ errors.full_name }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="email" class="form-label">Email Address</label>
                  <input
                    type="email"
                    class="form-control"
                    :class="{ 'is-invalid': errors.email }"
                    id="email"
                    v-model="form.email"
                    placeholder="Enter your email"
                    required
                    :disabled="isLoading"
                  />
                  <div class="invalid-feedback" v-if="errors.email">
                    {{ errors.email }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="phone" class="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    class="form-control"
                    :class="{ 'is-invalid': errors.phone }"
                    id="phone"
                    v-model="form.phone"
                    placeholder="Enter your phone number"
                    :disabled="isLoading"
                  />
                  <div class="invalid-feedback" v-if="errors.phone">
                    {{ errors.phone }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="password" class="form-label">Password</label>
                  <div class="input-group">
                    <input
                      :type="showPassword ? 'text' : 'password'"
                      class="form-control"
                      :class="{ 'is-invalid': errors.password }"
                      id="password"
                      v-model="form.password"
                      placeholder="Enter your password"
                      required
                      :disabled="isLoading"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showPassword = !showPassword"
                      :disabled="isLoading"
                    >
                      <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" v-if="errors.password">
                    {{ errors.password }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirm Password</label>
                  <div class="input-group">
                    <input
                      :type="showConfirmPassword ? 'text' : 'password'"
                      class="form-control"
                      :class="{ 'is-invalid': errors.confirmPassword }"
                      id="confirmPassword"
                      v-model="form.confirmPassword"
                      placeholder="Confirm your password"
                      required
                      :disabled="isLoading"
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      @click="showConfirmPassword = !showConfirmPassword"
                      :disabled="isLoading"
                    >
                      <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                    </button>
                  </div>
                  <div class="invalid-feedback" v-if="errors.confirmPassword">
                    {{ errors.confirmPassword }}
                  </div>
                </div>

                <div class="mb-3 form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    :class="{ 'is-invalid': errors.terms }"
                    id="terms"
                    v-model="form.terms"
                    required
                  />
                  <label class="form-check-label" for="terms">
                    I agree to the <a href="#" class="text-decoration-none">Terms of Service</a> and <a href="#" class="text-decoration-none">Privacy Policy</a>
                  </label>
                  <div class="invalid-feedback" v-if="errors.terms">
                    {{ errors.terms }}
                  </div>
                </div>

                <div class="d-grid">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="loading-spinner me-2"></span>
                    {{ isLoading ? 'Creating Account...' : 'Create Account' }}
                  </button>
                </div>
              </form>

              <hr class="my-4" />

              <div class="text-center">
                <p class="mb-0">Already have an account?</p>
                <NuxtLink to="/login" class="btn btn-outline-primary">
                  Sign In
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

// Page metadata
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

// Reactive data
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  username: '',
  full_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  terms: false
})

const errors = reactive({
  username: '',
  full_name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  terms: ''
})

// Methods
const validateForm = () => {
  let isValid = true
  
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  
  // Username validation
  if (!form.username.trim()) {
    errors.username = 'Username is required'
    isValid = false
  } else if (form.username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters'
    isValid = false
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    errors.username = 'Username can only contain letters, numbers, and underscores'
    isValid = false
  }
  
  // Full name validation
  if (!form.full_name.trim()) {
    errors.full_name = 'Full name is required'
    isValid = false
  } else if (form.full_name.trim().length < 2) {
    errors.full_name = 'Full name must be at least 2 characters'
    isValid = false
  }
  
  // Email validation
  if (!form.email.trim()) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Please enter a valid email address'
    isValid = false
  }
  
  // Password validation
  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
    errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    isValid = false
  }
  
  // Confirm password validation
  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
    isValid = false
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }
  
  // Terms validation
  if (!form.terms) {
    errors.terms = 'You must agree to the terms and conditions'
    isValid = false
  }
  
  return isValid
}

const handleRegister = async () => {
  console.log('handleRegister called')
  
  if (!validateForm()) {
    console.log('Form validation failed')
    return
  }
  
  console.log('Form data:', {
    username: form.username.trim(),
    full_name: form.full_name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    phone: form.phone.trim() || undefined
  })
  
  isLoading.value = true
  
  try {
    const config = useRuntimeConfig()
    const response = await $fetch(`${config.public.apiBase}/auth/register`, {
      method: 'POST',
      body: {
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        phone: form.phone.trim() || undefined
      }
    })
    
    // Show success message using toast
    const { $toast } = useNuxtApp()
    $toast.success('Account created successfully! Please check your email for verification.')
    
    // Redirect to login
    navigateTo('/login')
  } catch (error) {
    console.error('Registration error:', error)
    
    const { $toast } = useNuxtApp()
    
    // Handle validation errors from backend
    if (error.data?.errors && Array.isArray(error.data.errors)) {
      // Clear previous errors
      Object.keys(errors).forEach(key => {
        errors[key] = ''
      })
      
      // Set validation errors
      error.data.errors.forEach(err => {
        if (errors[err.field]) {
          errors[err.field] = err.message
        }
      })
      
      $toast.error('Please fix the validation errors')
    } else if (error.data?.message) {
      $toast.error(error.data.message)
    } else if (error.message) {
      $toast.error(error.message)
    } else {
      $toast.error('Failed to create account. Please try again.')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  display: flex;
  align-items: center;
}

.whatsapp-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.whatsapp-header {
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  color: white;
  padding: 2rem 1.5rem 1.5rem;
}

.whatsapp-header h2 {
  font-weight: 600;
}

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

.form-control:focus {
  border-color: #25d366;
  box-shadow: 0 0 0 0.2rem rgba(37, 211, 102, 0.25);
}

.btn-primary {
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #128c7e 0%, #075e54 100%);
}

.btn-outline-primary {
  color: #25d366;
  border-color: #25d366;
}

.btn-outline-primary:hover {
  background-color: #25d366;
  border-color: #25d366;
}
</style> 