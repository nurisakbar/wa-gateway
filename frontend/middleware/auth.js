export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Wait for client-side hydration
  if (!process.client) return

  // Get auth token from localStorage or cookie (fallback)
  const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
  const userStr = localStorage.getItem('user')
  
  console.log('Auth middleware - Route:', to.path)
  console.log('Auth middleware - Token exists:', !!token)
  console.log('Auth middleware - User data exists:', !!userStr)
  
  // If no token and not on login/register page, redirect to login
  if (!token && to.path !== '/login' && to.path !== '/register') {
    console.log('No token found, redirecting to login')
    return navigateTo('/login')
  }
  
  // If token exists and on login/register page, redirect to dashboard
  if (token && (to.path === '/login' || to.path === '/register')) {
    console.log('Token found, redirecting to dashboard')
    return navigateTo('/dashboard')
  }
  
  // If token exists but no user data, try to initialize auth
  if (token && !userStr && to.path !== '/login' && to.path !== '/register') {
    console.log('Token exists but no user data, initializing auth...')
    try {
      const authStore = useAuthStore()
      const initialized = authStore.initializeAuth()
      
      if (!initialized) {
        // Try to fetch user from API
        console.log('Trying to fetch user from API...')
        const fetched = await authStore.fetchUser()
        if (!fetched) {
          console.log('Failed to fetch user, redirecting to login')
          return navigateTo('/login')
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error)
      return navigateTo('/login')
    }
  }
  
  console.log('Auth middleware passed for:', to.path)
}) 