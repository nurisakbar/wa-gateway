<template>
  <div class="login-container">
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

        <!-- Right Side - Login Form -->
        <div class="col-lg-4 form-section">
          <div class="form-container">
            <div class="form-header">
              <div class="logo">
                <div class="logo-icon">
                  <i class="bi bi-whatsapp"></i>
                </div>
                <h1 class="logo-text">WA Gateway</h1>
              </div>
              <p class="form-subtitle">Masukan email dan password untuk login</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
              <div class="form-group">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  :class="{ 'is-invalid': errors.email }"
                  id="email"
                  v-model="form.email"
                  placeholder="Masukan Email"
                  required
                  :disabled="isLoading"
                />
                <div class="invalid-feedback" v-if="errors.email">
                  {{ errors.email }}
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
                    placeholder="Password"
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
                <!-- <div class="forgot-password">
                  <a href="#" class="forgot-link">Lupa Password?</a>
                </div> -->
              </div>


              <div class="form-actions">
                <div class="button-group">
                  <button
                    type="submit"
                    class="btn btn-login"
                    :disabled="isLoading"
                  >
                    <span v-if="isLoading" class="loading-spinner me-2"></span>
                    {{ isLoading ? 'Signing in...' : 'Login' }}
                  </button>
                  
                  <NuxtLink to="/register" class="btn btn-register">
                    Daftar
                  </NuxtLink>
                </div>
                
                <div class="divider">
                  <span class="divider-text">atau</span>
                </div>
                
                <button type="button" class="btn btn-google">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" 
                    alt="Google" 
                    class="google-icon me-2"
                  />
                  Login dengan Google
                </button>
              </div>
            </form>
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
.login-form {
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

.forgot-password {
  text-align: right;
  margin-top: 0.5rem;
}

.forgot-link {
  color: #25D366;
  text-decoration: none;
  font-size: 0.875rem;
}

.forgot-link:hover {
  text-decoration: underline;
}


/* Form Actions */
.form-actions {
  margin-top: 2rem;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.btn {
  flex: 1;
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
}

.btn-login {
  background: linear-gradient(135deg, #25D366, #128C7E);
  color: white;
}

.btn-login:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(37, 211, 102, 0.3);
}

.btn-register {
  background: #dc3545;
  color: white;
}

.btn-register:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.3);
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 1.5rem 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e9ecef;
}

.divider-text {
  background: white;
  padding: 0 1rem;
  color: #6c757d;
  font-size: 0.875rem;
  position: relative;
  z-index: 1;
}

/* Google Button */
.btn-google {
  background: white;
  color: #495057;
  border: 2px solid #e9ecef;
  flex: none;
  width: 100%;
}

.btn-google:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.google-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
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

@media (max-width: 575.98px) {
  .button-group {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .button-group .btn {
    flex: none;
  }
  
  .btn-google {
    width: 100%;
  }
}

</style> 