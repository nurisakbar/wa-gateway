export default defineNuxtRouteMiddleware((to, from) => {
  // Skip middleware on server-side
  if (process.server) return

  // Get auth token from localStorage or cookie
  const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
  
  // If no token and not on login/register page, redirect to login
  if (!token && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }
  
  // If token exists and on login/register page, redirect to dashboard
  if (token && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/dashboard')
  }
}) 