import { io, Socket } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket = ref<Socket | null>(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (socket.value?.connected) return

    socket.value = io(config.public.wsUrl || 'ws://localhost:3001', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000
    })

    // Connection events
    socket.value.on('connect', () => {
      console.log('Socket connected:', socket.value?.id)
      isConnected.value = true
      reconnectAttempts.value = 0
    })

    socket.value.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      isConnected.value = false
    })

    socket.value.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      isConnected.value = false
      reconnectAttempts.value++
    })

    socket.value.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      isConnected.value = true
    })

    socket.value.on('reconnect_failed', () => {
      console.error('Socket reconnection failed')
      isConnected.value = false
    })

    // Message events
    socket.value.on('message:received', (data) => {
      console.log('New message received:', data)
      // Emit event for components to listen
      window.dispatchEvent(new CustomEvent('message:received', { detail: data }))
    })

    socket.value.on('message:sent', (data) => {
      console.log('Message sent:', data)
      window.dispatchEvent(new CustomEvent('message:sent', { detail: data }))
    })

    socket.value.on('message:delivered', (data) => {
      console.log('Message delivered:', data)
      window.dispatchEvent(new CustomEvent('message:delivered', { detail: data }))
    })

    socket.value.on('message:read', (data) => {
      console.log('Message read:', data)
      window.dispatchEvent(new CustomEvent('message:read', { detail: data }))
    })

    // Device events
    socket.value.on('device:connected', (data) => {
      console.log('Device connected:', data)
      window.dispatchEvent(new CustomEvent('device:connected', { detail: data }))
    })

    socket.value.on('device:disconnected', (data) => {
      console.log('Device disconnected:', data)
      window.dispatchEvent(new CustomEvent('device:disconnected', { detail: data }))
    })

    socket.value.on('device:qr', (data) => {
      console.log('QR Code generated:', data)
      window.dispatchEvent(new CustomEvent('device:qr', { detail: data }))
    })

    socket.value.on('device:ready', (data) => {
      console.log('Device ready:', data)
      window.dispatchEvent(new CustomEvent('device:ready', { detail: data }))
    })

    // Contact events
    socket.value.on('contact:updated', (data) => {
      console.log('Contact updated:', data)
      window.dispatchEvent(new CustomEvent('contact:updated', { detail: data }))
    })

    // Broadcast events
    socket.value.on('broadcast:started', (data) => {
      console.log('Broadcast started:', data)
      window.dispatchEvent(new CustomEvent('broadcast:started', { detail: data }))
    })

    socket.value.on('broadcast:progress', (data) => {
      console.log('Broadcast progress:', data)
      window.dispatchEvent(new CustomEvent('broadcast:progress', { detail: data }))
    })

    socket.value.on('broadcast:completed', (data) => {
      console.log('Broadcast completed:', data)
      window.dispatchEvent(new CustomEvent('broadcast:completed', { detail: data }))
    })

    // Notification events
    socket.value.on('notification', (data) => {
      console.log('Notification received:', data)
      window.dispatchEvent(new CustomEvent('notification', { detail: data }))
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      isConnected.value = false
    }
  }

  const emit = (event: string, data: any) => {
    if (socket.value?.connected) {
      socket.value.emit(event, data)
    } else {
      console.warn('Socket not connected, cannot emit:', event)
    }
  }

  const on = (event: string, callback: (data: any) => void) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  const off = (event: string, callback?: (data: any) => void) => {
    if (socket.value) {
      if (callback) {
        socket.value.off(event, callback)
      } else {
        socket.value.off(event)
      }
    }
  }

  // Auto-connect on plugin initialization
  connect()

  // Cleanup on app unmount
  if (process.client) {
    window.addEventListener('beforeunload', disconnect)
  }

  return {
    provide: {
      socket: {
        connect,
        disconnect,
        emit,
        on,
        off,
        isConnected: readonly(isConnected),
        socket: readonly(socket)
      }
    }
  }
}) 