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

interface Subscription {
  id: string
  status: string
  current_period_end: string
  plan?: {
    id: string
    name: string
    price: number
    limits: any
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  subscription: Subscription | null
  hasActiveSubscription: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    subscription: null,
    hasActiveSubscription: false
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    isLoggedIn: (state) => state.isAuthenticated,
    isLoading: (state) => state.loading,
    isAdmin: (state) => state.user?.role === 'admin' || state.user?.role === 'super_admin',
    isManager: (state) => state.user?.role === 'manager',
    isOperator: (state) => state.user?.role === 'operator',
    isViewer: (state) => state.user?.role === 'viewer',
    isPengguna: (state) => state.user?.role === 'pengguna',
    getSubscription: (state) => state.subscription,
    hasSubscription: (state) => state.hasActiveSubscription
  },

  actions: {
    async login(credentials: { email: string; password: string }) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/auth/login', credentials)
        
        // console.log('Login response:', response.data)
        
        // Backend returns { error: false, data: { user, token } }
        if (response.data && !response.data.error && response.data.data) {
          const { user, token } = response.data.data
          
          // console.log('Login successful - User:', user)
          // console.log('Login successful - Token:', token ? 'Token received' : 'No token')
          
          this.user = user
          this.token = token
          this.isAuthenticated = true
          
          // Store in localStorage
          localStorage.setItem('auth_token', token)
          localStorage.setItem('user', JSON.stringify(user))
          // Also persist in cookie for SSR checks
          if (process.client) {
            const tokenCookie = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 7 }) // 7 days
            tokenCookie.value = token
          }
          
          // Initialize socket connection
          const { $socket } = useNuxtApp()
          if ($socket && $socket.init) {
            $socket.init()
          }
          
          // Fetch subscription data after successful login
          await this.fetchSubscription()
          
          return { success: true, user }
        } else {
          // console.log('Login failed - Invalid response structure')
          return { 
            success: false, 
            error: response.data?.message || 'Login failed' 
          }
        }
      } catch (error: any) {
        // console.error('Login error:', error)
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
        // console.error('Registration error:', error)
        return { 
          success: false, 
          error: error.response?.data?.message || 'Registration failed' 
        }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      // console.log('Auth store - logout called')
      try {
        const { $api } = useNuxtApp()
        await $api.post('/auth/logout')
      } catch (error) {
        // console.error('Logout error:', error)
      } finally {
        // Use clearAuth to ensure all storage is cleared
        this.clearAuth()
        
        // Disconnect socket
        const { $socket } = useNuxtApp()
        if ($socket && $socket.disconnect) {
          $socket.disconnect()
        }
        
        // Force redirect to login using window.location
        if (process.client) {
          window.location.href = '/login'
        }
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
        // console.error('Token refresh error:', error)
        this.logout()
        return false
      }
    },

    async fetchUser() {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          // console.log('fetchUser - No token found')
          return false
        }

        const config = useRuntimeConfig()
        const response = await $fetch(`${config.public.apiBase}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.success) {
          this.user = response.data
          this.isAuthenticated = true
          localStorage.setItem('user', JSON.stringify(response.data))
          // console.log('fetchUser - User data loaded successfully')
          return true
        } else {
          // console.log('fetchUser - Invalid response:', response)
          return false
        }
      } catch (error: any) {
        // console.error('fetchUser - Error:', error)
        // Only logout if it's a 401 error
        if (error.status === 401 || error.statusCode === 401) {
          // console.log('fetchUser - Token expired, logging out')
          this.logout()
        }
        return false
      }
    },

    initializeAuth() {
      // Check for stored token and user
      const token = localStorage.getItem('auth_token') || (process.client ? useCookie('auth_token').value : null)
      const userStr = localStorage.getItem('user')
      
      if (token) {
        // If we have token, set it and try to restore user data
        this.token = token
        this.isAuthenticated = true
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr)
            this.user = user
            
            // Initialize socket connection
            const { $socket } = useNuxtApp()
            if ($socket && $socket.init) {
              $socket.init()
            }
            
            return true
          } catch (error) {
            // console.error('Auth initialization error:', error)
            // Clear corrupted user data but keep token
            localStorage.removeItem('user')
            this.user = null
          }
        }
        
        // If we have token but no user data, that's ok - it will be fetched
        // console.log('Auth store - Token found, user data will be fetched later')
        return true
      }
      
      // console.log('Auth store - No token found, clearing auth')
      this.clearAuth()
      return false
    },

    clearAuth() {
      // console.log('Auth store - clearAuth called')
      this.user = null
      this.token = null
      this.isAuthenticated = false
      this.subscription = null
      this.hasActiveSubscription = false
      
      // Clear all possible storage locations
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      // Clear any VueUse persisted data
      if (process.client) {
        localStorage.removeItem('persist:root')
        localStorage.removeItem('persist:auth')
        
        // Clear cookie
        const tokenCookie = useCookie('auth_token')
        tokenCookie.value = null
      }
    },

    updateUser(userData: Partial<User>) {
      if (this.user) {
        this.user = { ...this.user, ...userData }
        localStorage.setItem('user', JSON.stringify(this.user))
      }
    },

    async fetchSubscription() {
      try {
        const token = localStorage.getItem('auth_token')
        if (!token) return false

        const config = useRuntimeConfig()
        const response = await $fetch(`${config.public.apiBase}/subscriptions/my-subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.success && response.data) {
          this.subscription = response.data
          this.hasActiveSubscription = response.data.status === 'active' || response.data.status === 'trialing'
          return true
        } else {
          this.subscription = null
          this.hasActiveSubscription = false
          return false
        }
      } catch (error: any) {
        // Handle 404 as expected behavior (no subscription found)
        if (error.status === 404 || error.statusCode === 404) {
          this.subscription = null
          this.hasActiveSubscription = false
          return false
        }
        
        // Log other errors
        // console.error('fetchSubscription - Error:', error)
        this.subscription = null
        this.hasActiveSubscription = false
        return false
      }
    },

    updateSubscription(subscriptionData: Subscription) {
      this.subscription = subscriptionData
      this.hasActiveSubscription = subscriptionData.status === 'active' || subscriptionData.status === 'trialing'
    },

    clearSubscription() {
      this.subscription = null
      this.hasActiveSubscription = false
    }
  }
}) 