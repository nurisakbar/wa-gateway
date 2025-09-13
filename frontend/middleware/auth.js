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
  
  // If token exists, allow access and let the layout handle user fetching
  // This prevents aggressive redirects during page refreshdb
  if (token) {
    console.log('Token found, allowing access - user data will be fetched by layout')
    return
  }
  
  console.log('Auth middleware passed for:', to.path)
}) 