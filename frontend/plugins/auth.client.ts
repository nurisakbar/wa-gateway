export default defineNuxtPlugin(() => {
  const { checkAuth } = useAuth()
  
  // Check authentication on app start
  checkAuth()
  
  return {
    provide: {
      auth: useAuth()
    }
  }
}) 