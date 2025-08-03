export default defineNuxtRouteMiddleware((to, from) => {
  const { $auth } = useNuxtApp()
  
  // Check if user is authenticated
  if (!$auth?.isAuthenticated) {
    // Redirect to login if not authenticated
    return navigateTo('/login')
  }
}) 