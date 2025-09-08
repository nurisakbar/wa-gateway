import { defineNuxtPlugin } from '#app'
import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  // Create axios instance
  const api = axios.create({
    baseURL: config.public.apiBase,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  })

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // Add auth token if available
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      
      // Add API key for whatsapp endpoints
      if (config.url && config.url.includes('/whatsapp/')) {
        config.headers['x-api-key'] = config.public?.apiKey || 'wg_b4df277cf780df75227236e35b048975708affe0d1dcc1eaa5a443d356fec3b9'
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      return response
    },
    (error) => {
      if (error.response?.status === 401) {
        const url = error.config?.url || ''
        // Only force logout on auth endpoints
        const isAuthEndpoint = url.includes('/auth/profile') || url.includes('/auth/refresh') || url.includes('/auth/logout')

        if (isAuthEndpoint) {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          navigateTo('/login')
        }
      }
      return Promise.reject(error)
    }
  )

  // Provide axios instance globally
  nuxtApp.provide('api', api)
}) 