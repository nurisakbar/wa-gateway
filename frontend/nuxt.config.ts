// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  
  // Modules
  modules: [
    '@pinia/nuxt',
    '@vueuse/nuxt'
  ],

  // CSS
  css: [
    'bootstrap/dist/css/bootstrap.min.css'
  ],

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api/v1',
      socketUrl: 'http://localhost:3000',
      appName: 'WA Gateway',
      appVersion: '1.0.0'
    }
  },

  // TypeScript configuration - disabled to avoid vue-tsc issues
  typescript: {
    strict: false,
    typeCheck: false,
    shim: false
  },

  // Pinia configuration
  pinia: {
    autoImports: ['defineStore', 'acceptHMRUpdate']
  },

  // Auto imports
  imports: {
    dirs: ['stores', 'composables', 'utils']
  },

  // Components
  components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ]
})
