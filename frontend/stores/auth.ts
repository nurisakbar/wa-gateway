import { defineStore } from 'pinia'

interface User {
  id: string
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    isLoggedIn: (state) => state.isAuthenticated,
    isLoading: (state) => state.loading,
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'super_admin',
    isManager: (state) => state.user?.role === 'manager',
    isOperator: (state) => state.user?.role === 'operator',
    isViewer: (state) => state.user?.role === 'viewer'
  },

  actions: {
    async login(credentials: { email: string; password: string }) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/auth/login', credentials)
        
        if (response.data.success) {
          const { user, token } = response.data.data
          
          this.user = user
          this.token = token
          this.isAuthenticated = true
          
          // Store in localStorage
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          // Initialize socket connection
          const { $socket } = useNuxtApp()
          $socket.init()
          
          return { success: true, user }
        }
      } catch (error: any) {
        console.error('Login error:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || 'Login failed' 
        }
      } finally {
        this.loading = false
      }
    },

    async register(userData: {
      username: string
      email: string
      password: string
      full_name: string
      phone?: string
      role?: string
    }) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/auth/register', userData)
        
        if (response.data.success) {
          return { success: true, message: 'Registration successful' }
        }
      } catch (error: any) {
        console.error('Registration error:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || 'Registration failed' 
        }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        const { $api } = useNuxtApp()
        await $api.post('/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear state
        this.user = null
        this.token = null
        this.isAuthenticated = false
        
        // Clear localStorage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        
        // Disconnect socket
        const { $socket } = useNuxtApp()
        $socket.disconnect()
        
        // Redirect to login
        navigateTo('/login')
      }
    },

    async refreshToken() {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/auth/refresh')
        
        if (response.data.success) {
          const { token } = response.data.data
          this.token = token
          localStorage.setItem('auth_token', token)
          return true
        }
      } catch (error) {
        console.error('Token refresh error:', error)
        this.logout()
        return false
      }
    },

    async fetchUser() {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/auth/me')
        
        if (response.data.success) {
          this.user = response.data.data
          localStorage.setItem('user', JSON.stringify(response.data.data))
          return true
        }
      } catch (error) {
        console.error('Fetch user error:', error)
        return false
      }
    },

    initializeAuth() {
      // Check for stored token and user
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('user')
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          this.token = token
          this.user = user
          this.isAuthenticated = true
          
          // Initialize socket connection
          const { $socket } = useNuxtApp()
          $socket.init()
          
          return true
        } catch (error) {
          console.error('Auth initialization error:', error)
          this.clearAuth()
          return false
        }
      }
      return false
    },

    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    },

    updateUser(userData: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...userData }
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    }
  }
}) 