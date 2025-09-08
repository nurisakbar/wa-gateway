export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  // Initialize authentication on app start
  console.log('Auth plugin - Initializing auth store...')
  const initialized = authStore.initializeAuth()
  console.log('Auth plugin - Auth store initialized:', initialized)
  
  return {
    provide: {
      auth: authStore
    }
  }
}) 