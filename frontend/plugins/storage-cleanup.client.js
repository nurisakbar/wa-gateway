export default defineNuxtPlugin(() => {
  // Clean up conflicting storage on app start
  if (process.client) {
    // Remove any VueUse persist data that might conflict
    const persistKeys = Object.keys(localStorage).filter(key => key.startsWith('persist:'))
    persistKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key))
        // If it's auth data with empty tokens, remove it
        if (data && data.auth && (!data.auth.accessToken || !data.auth.refreshToken)) {
          console.log('Removing conflicting persist data:', key)
          localStorage.removeItem(key)
        }
      } catch (error) {
        // If we can't parse it, remove it anyway
        console.log('Removing invalid persist data:', key)
        localStorage.removeItem(key)
      }
    })
  }
})
