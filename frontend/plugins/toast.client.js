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

  // Helper function to ensure message is a string
  const ensureStringMessage = (message) => {
    if (typeof message === 'string') {
      return message
    } else if (message && typeof message === 'object') {
      if (message.message) return message.message
      if (message.data && message.data.message) return message.data.message
      if (message.statusMessage) return message.statusMessage
      return JSON.stringify(message)
    }
    return String(message)
  }

  // Provide toast functions globally
  nuxtApp.provide('toast', {
    success: (message, options) => {
      return toast.success(ensureStringMessage(message), { ...toastOptions, ...options })
    },
    error: (message, options) => {
      return toast.error(ensureStringMessage(message), { ...toastOptions, ...options })
    },
    warning: (message, options) => {
      return toast.warning(ensureStringMessage(message), { ...toastOptions, ...options })
    },
    info: (message, options) => {
      return toast.info(ensureStringMessage(message), { ...toastOptions, ...options })
    },
    loading: (message, options) => {
      return toast.loading(ensureStringMessage(message), { ...toastOptions, ...options })
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
    
    // Extract meaningful error message
    let errorMessage = 'An unexpected error occurred. Please try again.'
    
    if (error && typeof error === 'object') {
      if (error.message) {
        errorMessage = error.message
      } else if (error.data && error.data.message) {
        errorMessage = error.data.message
      } else if (error.statusMessage) {
        errorMessage = error.statusMessage
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    toast.error(errorMessage)
  })
}) 