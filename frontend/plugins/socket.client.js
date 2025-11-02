import { io } from 'socket.io-client'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const socket = ref(null)
  const isConnected = ref(false)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (socket.value?.connected) return

    // Don't connect if no token (user not authenticated)
    const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
    if (!token) {
      // console.log('No auth token, skipping socket connection')
      return
    }

    // Use configured socket URL or fallback to backend port
    const socketUrl = config.public.socketUrl || 'http://localhost:3001'
    
    try {
      // Use polling only by default to avoid WebSocket issues
      // Can be overridden with environment variable if needed
      const useWebsocket = process.env.NUXT_PUBLIC_SOCKET_USE_WEBSOCKET === 'true'
      const transports = useWebsocket ? ['polling', 'websocket'] : ['polling']
      
      // Try polling first if websocket fails, with better error handling
      socket.value = io(socketUrl, {
        transports: transports, // Use polling only by default to avoid WebSocket errors
        upgrade: useWebsocket, // Only allow upgrade if websocket enabled
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false, // Reuse connection if possible
        // Add path to avoid router conflicts
        path: '/socket.io/',
        // Add auth token if available
        auth: token ? { token } : {},
        // Add headers for token
        extraHeaders: token ? {
          'Authorization': `Bearer ${token}`
        } : {},
        // Add query params for token as fallback
        query: token ? { token } : {},
        // Error handling options
        withCredentials: true,
        // Disable websocket upgrade attempts to prevent errors
        rememberUpgrade: false,
        // Ensure transport compatibility
        allowUpgrades: useWebsocket, // Match server setting
        // Handle transport errors gracefully
        rejectUnauthorized: false // For development, handle SSL issues gracefully
      })
    } catch (error) {
      // Catch any synchronous errors during socket creation
      console.warn('Socket creation error (will retry):', error.message)
      // Will retry automatically via reconnection
      return
    }

    // Helper function to safely register event handlers
    const safeOn = (event, handler) => {
      if (!socket.value) return
      try {
        socket.value.on(event, (...args) => {
          try {
            handler(...args)
          } catch (handlerError) {
            // Silently handle errors in event handlers
            if (process.env.NODE_ENV === 'development') {
              console.warn(`Error in socket event handler ${event}:`, handlerError)
            }
          }
        })
      } catch (registerError) {
        // Silently handle errors when registering handlers
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Error registering socket event ${event}:`, registerError)
        }
      }
    }

    // Connection events
    safeOn('connect', () => {
      // console.log('Socket connected:', socket.value?.id)
      isConnected.value = true
      reconnectAttempts.value = 0
    })

    safeOn('disconnect', (reason) => {
      // console.log('Socket disconnected:', reason)
      isConnected.value = false
    })

    safeOn('connect_error', (error) => {
      // console.error('Socket connection error:', error)
      isConnected.value = false
      reconnectAttempts.value++
      
      // Handle WebSocket closed before connection established
      if (error?.message) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('websocket was closed') || 
            errorMsg.includes('xhr poll error') ||
            errorMsg.includes('websocket error')) {
          // console.log('WebSocket connection issue, will retry with fallback...')
          // Force fallback to polling if websocket fails
          if (socket.value && !socket.value.connected) {
            setTimeout(() => {
              if (socket.value && !socket.value.connected) {
                try {
                  socket.value.io.opts.transports = ['polling']
                  socket.value.io.opts.upgrade = false
                } catch (e) {
                  // Ignore errors when modifying opts
                }
              }
            }, 1000)
          }
        }
        
        // Don't show error if backend is not running
        if (errorMsg.includes('econnrefused') || 
            errorMsg.includes('networkerror') ||
            errorMsg.includes('connection_refused')) {
          // console.log('Backend server not running, socket connection will retry...')
          // Stop retrying after max attempts
          if (reconnectAttempts.value >= maxReconnectAttempts) {
            socket.value?.disconnect()
            socket.value = null
          }
        }
        
        // Handle authentication errors
        if (errorMsg.includes('authentication token required') || 
            errorMsg.includes('authentication failed')) {
          // console.log('Socket authentication failed, user may not be logged in')
          // Don't retry if authentication failed
          reconnectAttempts.value = maxReconnectAttempts
          socket.value?.disconnect()
          socket.value = null
        }
      }
    })

    safeOn('reconnect', (attemptNumber) => {
      // console.log('Socket reconnected after', attemptNumber, 'attempts')
      isConnected.value = true
    })

    safeOn('reconnect_failed', () => {
      // console.error('Socket reconnection failed')
      isConnected.value = false
      // Try to reconnect with polling only as last resort
      if (socket.value && reconnectAttempts.value < maxReconnectAttempts) {
        try {
          socket.value.io.opts.transports = ['polling']
          socket.value.io.opts.upgrade = false
        } catch (e) {
          // Ignore errors when modifying opts
        }
      }
    })

    // Handle transport upgrade errors
    safeOn('upgrade_error', (error) => {
      // console.log('Transport upgrade failed, staying with polling:', error)
      // Continue with polling transport - silently handled
    })

    // Handle generic error event
    safeOn('error', (error) => {
      // Silently handle WebSocket errors
      if (error && error.message) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes('websocket was closed') || 
            errorMsg.includes('websocket connection')) {
          // Expected error during connection attempts - will retry automatically
          return
        }
      }
    })

    // Message events
    safeOn('message:received', (data) => {
      // console.log('New message received:', data)
      try {
        window.dispatchEvent(new CustomEvent('message:received', { detail: data }))
      } catch (e) {
        // Silently handle dispatch errors
      }
    })

    safeOn('message:sent', (data) => {
      // console.log('Message sent:', data)
      try {
        window.dispatchEvent(new CustomEvent('message:sent', { detail: data }))
      } catch (e) {}
    })

    safeOn('message:delivered', (data) => {
      // console.log('Message delivered:', data)
      try {
        window.dispatchEvent(new CustomEvent('message:delivered', { detail: data }))
      } catch (e) {}
    })

    safeOn('message:read', (data) => {
      // console.log('Message read:', data)
      try {
        window.dispatchEvent(new CustomEvent('message:read', { detail: data }))
      } catch (e) {}
    })

    // Device events
    safeOn('device:connected', (data) => {
      // console.log('Device connected:', data)
      try {
        window.dispatchEvent(new CustomEvent('device:connected', { detail: data }))
      } catch (e) {}
    })

    safeOn('device:disconnected', (data) => {
      // console.log('Device disconnected:', data)
      try {
        window.dispatchEvent(new CustomEvent('device:disconnected', { detail: data }))
      } catch (e) {}
    })

    safeOn('device:qr', (data) => {
      // console.log('QR Code generated:', data)
      try {
        window.dispatchEvent(new CustomEvent('device:qr', { detail: data }))
      } catch (e) {}
    })

    safeOn('device:ready', (data) => {
      // console.log('Device ready:', data)
      try {
        window.dispatchEvent(new CustomEvent('device:ready', { detail: data }))
      } catch (e) {}
    })

    // New unified events from backend
    safeOn('device_status', (data) => {
      try {
        // Normalize to existing custom events
        if (data?.status === 'qr_ready' && data?.qrCode) {
          window.dispatchEvent(new CustomEvent('device:qr', { detail: { deviceId: data.deviceId, qrCode: data.qrCode } }))
        } else if (data?.status === 'connected') {
          window.dispatchEvent(new CustomEvent('device:connected', { detail: { deviceId: data.deviceId } }))
        } else if (data?.status === 'disconnected') {
          window.dispatchEvent(new CustomEvent('device:disconnected', { detail: { deviceId: data.deviceId } }))
        }
      } catch (e) {}
    })

    safeOn('connection_status', (data) => {
      try {
        // Some emissions are to the device room; mirror to window events
        if (data?.status === 'qr_ready' && data?.qrCode) {
          window.dispatchEvent(new CustomEvent('device:qr', { detail: { deviceId: data.deviceId, qrCode: data.qrCode } }))
        } else if (data?.status === 'connected') {
          window.dispatchEvent(new CustomEvent('device:connected', { detail: { deviceId: data.deviceId } }))
        } else if (data?.status === 'disconnected') {
          window.dispatchEvent(new CustomEvent('device:disconnected', { detail: { deviceId: data.deviceId } }))
        }
      } catch (e) {}
    })

    // Contact events
    safeOn('contact:updated', (data) => {
      // console.log('Contact updated:', data)
      try {
        window.dispatchEvent(new CustomEvent('contact:updated', { detail: data }))
      } catch (e) {}
    })

    // Broadcast events
    safeOn('broadcast:started', (data) => {
      // console.log('Broadcast started:', data)
      try {
        window.dispatchEvent(new CustomEvent('broadcast:started', { detail: data }))
      } catch (e) {}
    })

    safeOn('broadcast:progress', (data) => {
      // console.log('Broadcast progress:', data)
      try {
        window.dispatchEvent(new CustomEvent('broadcast:progress', { detail: data }))
      } catch (e) {}
    })

    safeOn('broadcast:completed', (data) => {
      // console.log('Broadcast completed:', data)
      try {
        window.dispatchEvent(new CustomEvent('broadcast:completed', { detail: data }))
      } catch (e) {}
    })

    // Notification events
    safeOn('notification', (data) => {
      // console.log('Notification received:', data)
      try {
        window.dispatchEvent(new CustomEvent('notification', { detail: data }))
      } catch (e) {}
    })
  }

  const disconnect = () => {
    if (socket.value) {
      try {
        socket.value.disconnect()
      } catch (e) {
        // Silently handle disconnect errors
      }
      socket.value = null
      isConnected.value = false
    }
  }

  const emit = (event, data) => {
    if (socket.value?.connected) {
      try {
        socket.value.emit(event, data)
      } catch (e) {
        // console.warn('Socket not connected, cannot emit:', event)
      }
    }
  }

  const on = (event, callback) => {
    if (socket.value) {
      try {
        socket.value.on(event, callback)
      } catch (e) {
        // Silently handle
      }
    }
  }

  const off = (event, callback) => {
    if (socket.value) {
      try {
        if (callback) {
          socket.value.off(event, callback)
        } else {
          socket.value.off(event)
        }
      } catch (e) {
        // Silently handle
      }
    }
  }

  // Auto-connect only if user is authenticated
  const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
  if (token) {
    // Delay connection slightly to ensure backend is ready
    if (process.client) {
      setTimeout(() => {
        connect()
      }, 500)
    }
  }

  // Cleanup on app unmount
  if (process.client) {
    window.addEventListener('beforeunload', disconnect)
    
    // Catch unhandled WebSocket errors globally
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message) {
        const errorMsg = event.error.message.toLowerCase()
        if (errorMsg.includes('websocket was closed before the connection was established') ||
            errorMsg.includes('websocket connection') ||
            errorMsg.includes('socket.io')) {
          // Silently handle this error - it's expected during connection attempts
          event.preventDefault()
          event.stopPropagation()
          // console.log('WebSocket connection attempt closed, will retry automatically')
          return false
        }
      }
      // Also check error string if error object doesn't have message
      if (event.message && typeof event.message === 'string') {
        const errorMsg = event.message.toLowerCase()
        if (errorMsg.includes('websocket was closed before the connection was established')) {
          event.preventDefault()
          event.stopPropagation()
          return false
        }
      }
    })

    // Also catch unhandled promise rejections related to WebSocket
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message) {
        const errorMsg = event.reason.message.toLowerCase()
        if (errorMsg.includes('websocket was closed before the connection was established') ||
            errorMsg.includes('websocket connection') ||
            errorMsg.includes('socket.io')) {
          event.preventDefault()
          // console.log('WebSocket promise rejection caught, will retry automatically')
        }
      }
    })
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
