export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Wait for client-side hydration
  if (!process.client) return

  // Get auth store
  const authStore = useAuthStore()
  
  // Check if user is authenticated
  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
  
  // Check if user has admin role
  if (!authStore.isAdmin) {
    // Redirect to dashboard with error message
    const { $toast } = useNuxtApp()
    $toast.error('Access denied. Admin privileges required.')
    return navigateTo('/dashboard')
  }
})
