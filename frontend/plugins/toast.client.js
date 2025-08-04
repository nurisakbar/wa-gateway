import { defineNuxtPlugin } from '#app'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  // Configure toast options
  const toastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
    rtl: false
  }

  // Provide toast functions globally
  nuxtApp.provide('toast', {
    success: (message, options) => {
      return toast.success(message, { ...toastOptions, ...options })
    },
    error: (message, options) => {
      return toast.error(message, { ...toastOptions, ...options })
    },
    warning: (message, options) => {
      return toast.warning(message, { ...toastOptions, ...options })
    },
    info: (message, options) => {
      return toast.info(message, { ...toastOptions, ...options })
    },
    loading: (message, options) => {
      return toast.loading(message, { ...toastOptions, ...options })
    },
    dismiss: (toastId) => {
      return toast.dismiss(toastId)
    },
    update: (toastId, options) => {
      return toast.update(toastId, options)
    }
  })

  // Global error handler
  nuxtApp.hook('app:error', (error) => {
    console.error('App error:', error)
    toast.error('An unexpected error occurred. Please try again.')
  })
}) 