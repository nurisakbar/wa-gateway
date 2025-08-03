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
    'bootstrap-vue-3/dist/bootstrap-vue-3.css',
    '~/assets/css/main.css',
    'vue3-toastify/dist/index.css'
  ],

  // Runtime config
  runtimeConfig: {
    // Private keys (only available on server-side)
    apiSecret: process.env.API_SECRET,
    
    // Public keys (exposed to client-side)
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',
      socketUrl: process.env.SOCKET_URL || 'http://localhost:3000',
      appName: 'WA Gateway',
      appVersion: '1.0.0'
    }
  },

  // App config
  app: {
    head: {
      title: 'WA Gateway - WhatsApp Management Platform',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { 
          hid: 'description', 
          name: 'description', 
          content: 'Professional WhatsApp Gateway for managing multiple devices, sending messages, and automating communications.' 
        },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#25D366' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { 
          rel: 'stylesheet', 
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' 
        }
      ],
      script: [
        {
          src: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js',
          defer: true
        }
      ]
    }
  },

  // Build configuration
  build: {
    transpile: ['vue3-toastify', 'vue3-lottie', 'lottie-web', 'bootstrap-vue-3']
  },

  // Vite configuration
  vite: {
    optimizeDeps: {
      include: ['vue3-toastify', 'vue3-lottie', 'lottie-web', 'bootstrap-vue-3']
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/scss/variables.scss";'
        }
      }
    }
  },

  // Nitro configuration
  nitro: {
    devProxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
        prependPath: true
      }
    }
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    typeCheck: true
  },

  // ESLint configuration
  eslint: {
    lintOnStart: false
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
  ],

  // Plugins
  plugins: [
    '~/plugins/bootstrap.client.ts',
    '~/plugins/axios.client.ts',
    '~/plugins/socket.client.ts',
    '~/plugins/toast.client.ts',
    '~/plugins/chart.client.ts'
  ],

  // Middleware
  routeRules: {
    '/': { prerender: true },
    '/login': { ssr: false },
    '/register': { ssr: false },
    '/dashboard/**': { ssr: false },
    '/api/**': { cors: true }
  }
})
