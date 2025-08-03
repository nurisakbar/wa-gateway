export const useAuth = () => {
  const user = ref(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(false)

  const login = async (credentials: { email: string; password: string }) => {
    isLoading.value = true
    try {
      const response = await $fetch('/api/v1/auth/login', {
        method: 'POST',
        body: credentials
      })
      
      user.value = response.user
      isAuthenticated.value = true
      
      // Store token
      localStorage.setItem('token', response.token)
      
      return response
    } catch (error) {
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('token')
    navigateTo('/login')
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      isAuthenticated.value = false
      return false
    }

    try {
      const response = await $fetch('/api/v1/auth/me')
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