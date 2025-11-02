import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket = ref(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (socket.value?.connected) return

    // Use configured socket URL or fallback to backend port
    const socketUrl = config.public.socketUrl || 'http://localhost:3001'
    
    // Get auth token from localStorage or cookie
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    
    socket.value = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
      // Add path to avoid router conflicts
      path: '/socket.io/',
      // Add auth token if available
      auth: token ? { token } : {},
      // Add headers for token
      extraHeaders: token ? {
        'Authorization': `Bearer ${token}`
      } : {}
    })

    // Connection events
    socket.value.on('connect', () => {
      // console.log('Socket connected:', socket.value?.id)
      isConnected.value = true
      reconnectAttempts.value = 0
    })

    socket.value.on('disconnect', (reason) => {
      // console.log('Socket disconnected:', reason)
      isConnected.value = false
    })

    socket.value.on('connect_error', (error) => {
      // console.error('Socket connection error:', error)
      isConnected.value = false
      reconnectAttempts.value++
      
      // Don't show error if backend is not running
      if (error.message.includes('ECONNREFUSED')) {
        // console.log('Backend server not running, socket connection will retry...')
      }
      
      // Handle authentication errors
      if (error.message.includes('Authentication token required') || 
          error.message.includes('Authentication failed')) {
        // console.log('Socket authentication failed, user may not be logged in')
        // Don't retry if authentication failed
        reconnectAttempts.value = maxReconnectAttempts
      }
    })

    socket.value.on('reconnect', (attemptNumber) => {
      // console.log('Socket reconnected after', attemptNumber, 'attempts')
      isConnected.value = true
    })

    socket.value.on('reconnect_failed', () => {
      // console.error('Socket reconnection failed')
      isConnected.value = false
    })

    // Message events
    socket.value.on('message:received', (data) => {
      // console.log('New message received:', data)
      // Emit event for components to listen
      window.dispatchEvent(new CustomEvent('message:received', { detail: data }))
    })

    socket.value.on('message:sent', (data) => {
      // console.log('Message sent:', data)
      window.dispatchEvent(new CustomEvent('message:sent', { detail: data }))
    })

    socket.value.on('message:delivered', (data) => {
      // console.log('Message delivered:', data)
      window.dispatchEvent(new CustomEvent('message:delivered', { detail: data }))
    })

    socket.value.on('message:read', (data) => {
      // console.log('Message read:', data)
      window.dispatchEvent(new CustomEvent('message:read', { detail: data }))
    })

    // Device events
    socket.value.on('device:connected', (data) => {
      console.log('Device connected event (direct):', data)
      window.dispatchEvent(new CustomEvent('device:connected', { detail: data }))
    })

    socket.value.on('device:disconnected', (data) => {
      // console.log('Device disconnected:', data)
      window.dispatchEvent(new CustomEvent('device:disconnected', { detail: data }))
    })

    socket.value.on('device:qr', (data) => {
      // console.log('QR Code generated:', data)
      window.dispatchEvent(new CustomEvent('device:qr', { detail: data }))
    })

    socket.value.on('device:ready', (data) => {
      // console.log('Device ready:', data)
      window.dispatchEvent(new CustomEvent('device:ready', { detail: data }))
    })

    // New unified events from backend
    socket.value.on('device_status', (data) => {
      // Normalize to existing custom events
      console.log('Device status received:', data)
      if (data?.status === 'qr_ready' && data?.qrCode) {
        console.log('QR ready event (device_status):', data.deviceId)
        window.dispatchEvent(new CustomEvent('device:qr', { detail: { deviceId: data.deviceId, qrCode: data.qrCode } }))
      } else if (data?.status === 'connected') {
        console.log('Device connected event (device_status):', data.deviceId)
        window.dispatchEvent(new CustomEvent('device:connected', { detail: { deviceId: data.deviceId } }))
      } else if (data?.status === 'disconnected') {
        console.log('Device disconnected event (device_status):', data.deviceId)
        window.dispatchEvent(new CustomEvent('device:disconnected', { detail: { deviceId: data.deviceId } }))
      } else if (data?.status === 'error') {
        console.log('Device error event (device_status):', data.deviceId, data.error)
        window.dispatchEvent(new CustomEvent('device_status', { detail: { deviceId: data.deviceId, status: 'error', error: data.error } }))
      }
    })

    socket.value.on('connection_status', (data) => {
      // Some emissions are to the device room; mirror to window events
      console.log('Connection status received:', data)
      if (data?.status === 'qr_ready' && data?.qrCode) {
        console.log('QR ready event:', data.deviceId)
        window.dispatchEvent(new CustomEvent('device:qr', { detail: { deviceId: data.deviceId, qrCode: data.qrCode } }))
      } else if (data?.status === 'connected') {
        console.log('Device connected event:', data.deviceId)
        window.dispatchEvent(new CustomEvent('device:connected', { detail: { deviceId: data.deviceId } }))
      } else if (data?.status === 'disconnected') {
        console.log('Device disconnected event:', data.deviceId)
        window.dispatchEvent(new CustomEvent('device:disconnected', { detail: { deviceId: data.deviceId } }))
      } else if (data?.status === 'error') {
        console.log('Device error event:', data.deviceId, data.error)
        window.dispatchEvent(new CustomEvent('connection_status', { detail: { deviceId: data.deviceId, status: 'error', error: data.error } }))
      }
    })

    // Contact events
    socket.value.on('contact:updated', (data) => {
      // console.log('Contact updated:', data)
      window.dispatchEvent(new CustomEvent('contact:updated', { detail: data }))
    })

    // Broadcast events
    socket.value.on('broadcast:started', (data) => {
      // console.log('Broadcast started:', data)
      window.dispatchEvent(new CustomEvent('broadcast:started', { detail: data }))
    })

    socket.value.on('broadcast:progress', (data) => {
      // console.log('Broadcast progress:', data)
      window.dispatchEvent(new CustomEvent('broadcast:progress', { detail: data }))
    })

    socket.value.on('broadcast:completed', (data) => {
      // console.log('Broadcast completed:', data)
      window.dispatchEvent(new CustomEvent('broadcast:completed', { detail: data }))
    })

    // Notification events
    socket.value.on('notification', (data) => {
      // console.log('Notification received:', data)
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

  const emit = (event, data) => {
    if (socket.value?.connected) {
      socket.value.emit(event, data)
    } else {
      // console.warn('Socket not connected, cannot emit:', event)
    }
  }

  const on = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket.value) {
      if (callback) {
        socket.value.off(event, callback)
      } else {
        socket.value.off(event)
      }
    }
  }

  // Auto-connect only if user is authenticated
  const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
  if (token) {
    connect()
  }

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