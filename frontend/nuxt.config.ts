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
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css'
  ],

  // Runtime config
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api/v1',
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      appName: process.env.NUXT_PUBLIC_APP_NAME || 'KlikWhatsApp',
      appVersion: process.env.NUXT_PUBLIC_APP_VERSION || '1.0.0',
      apiKey: process.env.NUXT_PUBLIC_API_KEY || 'wg_b4df277cf780df75227236e35b048975708affe0d1dcc1eaa5a443d356fec3b9'
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
