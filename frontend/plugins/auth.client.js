export default defineNuxtPlugin(() => {
  const authStore = useAuthStore()
  
  // Initialize authentication on app start
  const initialized = authStore.initializeAuth()
  
  return {
    provide: {
      auth: authStore
    }
  }
}) 