<template>
  <div class="login-container">
    <div class="container">
      <div class="row justify-content-center align-items-center min-vh-100">
        <div class="col-md-6 col-lg-4">
          <div class="whatsapp-card">
            <div class="whatsapp-header text-center">
              <h2 class="mb-0">
                <i class="bi bi-whatsapp me-2"></i>
                WA Gateway
              </h2>
              <p class="mb-0 opacity-75">Sign in to your account</p>
            </div>
            
            <div class="card-body p-4">
              <form @submit.prevent="handleLogin" novalidate>
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

                <div class="mb-3 form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="remember"
                    v-model="form.remember"
                  />
                  <label class="form-check-label" for="remember">
                    Remember me
                  </label>
                </div>

                <div class="d-grid">
                  <button
                    type="submit"
                    class="btn btn-primary btn-lg"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="loading-spinner me-2"></span>
                    {{ isLoading ? 'Signing in...' : 'Sign In' }}
                  </button>
                </div>

                <div class="text-center mt-3">
                  <a href="#" class="text-decoration-none">Forgot your password?</a>
                </div>
              </form>

              <hr class="my-4" />

              <div class="text-center">
                <p class="mb-0">Don't have an account?</p>
                <NuxtLink to="/register" class="btn btn-outline-primary">
                  Create Account
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
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const { login, isLoading } = useAuth()
const { $toast } = useNuxtApp()

const form = ref({
  email: '',
  password: '',
  remember: false
})

const errors = ref({
  email: '',
  password: ''
})

const showPassword = ref(false)

const validateForm = () => {
  errors.value = {
    email: '',
    password: ''
  }

  let isValid = true

  // Email validation
  if (!form.value.email) {
    errors.value.email = 'Email is required'
    isValid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Please enter a valid email address'
    isValid = false
  }

  // Password validation
  if (!form.value.password) {
    errors.value.password = 'Password is required'
    isValid = false
  } else if (form.value.password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
    isValid = false
  }

  return isValid
}

const handleLogin = async () => {
  if (!validateForm()) {
    return
  }

  try {
    const result = await login({
      email: form.value.email,
      password: form.value.password
    })

    if (result.success) {
      $toast.success(result.message || 'Welcome back!')
      navigateTo('/dashboard')
    } else {
      $toast.error(result.error || 'Login failed')
    }
  } catch (error) {
    console.error('Login error:', error)
    $toast.error('Login failed. Please try again.')
  }
}

// Auto-fill email if stored
onMounted(() => {
  const storedEmail = localStorage.getItem('remembered_email')
  if (storedEmail) {
    form.value.email = storedEmail
    form.value.remember = true
  }
})

// Watch for remember me changes
watch(() => form.value.remember, (newValue) => {
  if (newValue) {
    localStorage.setItem('remembered_email', form.value.email)
  } else {
    localStorage.removeItem('remembered_email')
  }
})
</script>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
  min-height: 100vh;
}

.whatsapp-card {
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.whatsapp-header {
  background: linear-gradient(135deg, #25D366, #128C7E);
  border-radius: 0.5rem 0.5rem 0 0;
}

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

.form-control:focus {
  border-color: #25D366;
  box-shadow: 0 0 0 0.2rem rgba(37, 211, 102, 0.25);
}

.btn-primary {
  background-color: #25D366;
  border-color: #25D366;
}

.btn-primary:hover,
.btn-primary:focus {
  background-color: #128C7E !important;
  border-color: #128C7E !important;
}

.btn-outline-primary {
  color: #25D366;
  border-color: #25D366;
}

.btn-outline-primary:hover {
  background-color: #25D366;
  border-color: #25D366;
}
</style> 