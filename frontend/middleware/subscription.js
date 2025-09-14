export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Wait for client-side hydration
  if (!process.client) return

  // Skip if user is not authenticated
  const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
  if (!token) return

  // Skip subscription check for these routes
  const skipRoutes = ['/login', '/register', '/subscriptions', '/logout']
  if (skipRoutes.includes(to.path)) return

  // Skip if user is admin (they don't need subscription)
  const userStr = localStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.role === 'admin' || user.role === 'super_admin') {
        return
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
  }

  try {
    const config = useRuntimeConfig()
    const response = await $fetch(`${config.public.apiBase}/subscriptions/my-subscription`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    // If user has no active subscription, redirect to subscription page
    if (!response.success || !response.data) {

      return navigateTo('/subscriptions')
    }

    // Check if subscription is active
    const subscription = response.data
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {

      return navigateTo('/subscriptions')
    }

  } catch (error) {
    console.error('Error checking subscription:', error)
    // If there's an error checking subscription, redirect to subscription page
    return navigateTo('/subscriptions')
  }
})
