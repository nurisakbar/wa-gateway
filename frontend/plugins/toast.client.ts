import { defineNuxtPlugin } from '#app'
import { toast, type ToastContainerOptions } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

export default defineNuxtPlugin((nuxtApp) => {
  // Configure toast options
  const toastOptions: ToastContainerOptions = {
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
    success: (message: string, options?: any) => {
      return toast.success(message, { ...toastOptions, ...options })
    },
    error: (message: string, options?: any) => {
      return toast.error(message, { ...toastOptions, ...options })
    },
    warning: (message: string, options?: any) => {
      return toast.warning(message, { ...toastOptions, ...options })
    },
    info: (message: string, options?: any) => {
      return toast.info(message, { ...toastOptions, ...options })
    },
    loading: (message: string, options?: any) => {
      return toast.loading(message, { ...toastOptions, ...options })
    },
    dismiss: (toastId: string | number) => {
      return toast.dismiss(toastId)
    },
    update: (toastId: string | number, options: any) => {
      return toast.update(toastId, options)
    }
  })

  // Global error handler
  nuxtApp.hook('app:error', (error) => {
    console.error('App error:', error)
    toast.error('An unexpected error occurred. Please try again.')
  })
}) 