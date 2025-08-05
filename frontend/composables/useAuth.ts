export const useAuth = () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    try {
      console.log('Login attempt with:', credentials.email)
      
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/auth/login`, {
        method: 'POST',
        body: credentials
      })
      
      console.log('Login response:', response)
      
      // Check if response has error
      if (response.error) {
        console.log('Login error from backend:', response.message)
        throw new Error(response.message)
      }
      
      // Extract user data and token from response
      const userData = response.data?.user || response.user
      const token = response.data?.token || response.token
      
      console.log('User data:', userData)
      console.log('Token:', token ? 'Token received' : 'No token')
      
      user.value = userData
      isAuthenticated.value = true
      
      // Store token
      localStorage.setItem('auth_token', token)
      
      // Connect socket after successful login
      const { $socket } = useNuxtApp()
      if ($socket && $socket.connect) {
        $socket.connect()
      }
      
      const result = {
        success: true,
        message: response.message || 'Login successful'
      }
      
      console.log('Returning result:', result)
      return result
    } catch (error) {
      console.error('Login catch error:', error)
      
      const errorResult = {
        success: false,
        error: error.data?.message || error.message || 'Login failed'
      }
      
      console.log('Returning error result:', errorResult)
      return errorResult
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('auth_token')
    
    // Disconnect socket on logout
    const { $socket } = useNuxtApp()
    if ($socket && $socket.disconnect) {
      $socket.disconnect()
    }
    
    navigateTo('/login')
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      isAuthenticated.value = false
      return false
    }

    try {
      const config = useRuntimeConfig()
      const response = await $fetch(`${config.public.apiBase}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      user.value = response.user
      isAuthenticated.value = true
      return true
    } catch (error) {
      logout()
      return false
    }
  }

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    login,
    logout,
    checkAuth
  }
} 