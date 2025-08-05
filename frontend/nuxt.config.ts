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
      apiBase: 'http://localhost:3001/api/v1',
      socketUrl: 'http://localhost:3001',
      appName: 'WA Gateway',
      appVersion: '1.0.0'
    }
  },

  // TypeScript configuration - completely disabled
  typescript: {
    strict: false,
    typeCheck: false,
    shim: false
  },

  // Vite configuration
  vite: {
    esbuild: {
      target: 'esnext'
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia']
    }
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
