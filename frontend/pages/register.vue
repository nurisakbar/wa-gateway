<template>
  <div class="register-container">
    <div class="container-fluid h-100">
      <div class="row h-100">
        <!-- Left Side - Illustration -->
        <div class="col-lg-8 d-none d-lg-flex illustration-section">
          <div class="illustration-content">
            <div class="illustration-wrapper">
              <img 
                src="~/assets/img/login-2.png" 
                alt="Team Collaboration" 
                class="illustration-image"
              />
            </div>
          </div>
        </div>

        <!-- Right Side - Register Form -->
        <div class="col-lg-4 form-section">
          <div class="form-container">
            <div class="form-header">
              <div class="logo">
                <div class="logo-icon">
                  <i class="bi bi-whatsapp"></i>
                </div>
                <h1 class="logo-text">WA Gateway</h1>
              </div>
              <p class="form-subtitle">Create your account</p>
            </div>

            <form @submit.prevent="handleRegister" class="register-form">
              <div class="form-group">
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

              <div class="form-group">
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

              <div class="form-group">
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

              <div class="form-group">
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

              <div class="form-group">
                <label for="password" class="form-label">Password</label>
                <div class="password-input-group">
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
                    class="password-toggle"
                    type="button"
                    @click="showPassword = !showPassword"
                    :disabled="isLoading"
                  >
                    <span class="eye-icon">{{ showPassword ? '🙈' : '👁️' }}</span>
                  </button>
                </div>
                <div class="invalid-feedback" v-if="errors.password">
                  {{ errors.password }}
                </div>
              </div>

              <div class="form-group">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <div class="password-input-group">
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
                    class="password-toggle"
                    type="button"
                    @click="showConfirmPassword = !showConfirmPassword"
                    :disabled="isLoading"
                  >
                    <span class="eye-icon">{{ showConfirmPassword ? '🙈' : '👁️' }}</span>
                  </button>
                </div>
                <div class="invalid-feedback" v-if="errors.confirmPassword">
                  {{ errors.confirmPassword }}
                </div>
              </div>

              <div class="form-group">
                <div class="form-check">
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
              </div>

              <div class="form-actions">
                <button
                  type="submit"
                  class="btn btn-register"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="loading-spinner me-2"></span>
                  {{ isLoading ? 'Creating Account...' : 'Create Account' }}
                </button>
                
                <div class="text-center mt-3">
                  <p class="mb-0">Already have an account?</p>
                  <NuxtLink to="/login" class="btn btn-login-link">
                    Sign In
                  </NuxtLink>
                </div>
              </div>
            </form>
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

  if (!validateForm()) {

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
  height: 100vh;
  overflow: hidden;
}

/* Illustration Section */
.illustration-section {
  background: linear-gradient(135deg, #20c997 0%, #17a2b8 100%);
  position: relative;
  overflow: hidden;
}

.illustration-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  margin-left: 200px;
}

.illustration-wrapper {
  position: relative;
  width: 100%;
  /* max-width: 500px; */
  /* height: 1000px; */
  display: flex;
  align-items: center;
  justify-content: center;
}

.illustration-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
  border-radius: 15px;
  /* box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); */
}

/* Form Section */
.form-section {
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.form-container {
  width: 100%;
  max-width: 400px;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #25D366, #128C7E);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.6rem;
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.8rem;
  font-weight: 700;
  color: #25D366;
  margin: 0;
  line-height: 1;
  display: flex;
  align-items: center;
}

.form-subtitle {
  color: #6c757d;
  font-size: 0.95rem;
  margin: 0;
}

/* Form Styles */
.register-form {
  width: 100%;
}

.form-group {
  margin-bottom: 0.5rem;
}

.form-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 1px;
  display: block;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #25D366;
  box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.1);
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.invalid-feedback {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: block;
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

.password-toggle:focus {
  outline: none;
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
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  width: 100%;
}

.btn-register {
  background: linear-gradient(135deg, #25D366, #128C7E);
  color: white;
}

.btn-register:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3);
}

.btn-login-link {
  background: #dc3545;
  color: white;
  margin-top: 0.5rem;
}

.btn-login-link:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
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

/* Responsive */
@media (max-width: 991.98px) {
  .illustration-section {
    display: none !important;
  }
  
  .form-section {
    padding: 1rem;
  }
  
  .form-container {
    max-width: 100%;
  }
}
</style> 