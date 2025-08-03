import { defineNuxtPlugin } from '#app'
import { io, Socket } from 'socket.io-client'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  let socket: Socket | null = null

  // Initialize socket connection
  const initSocket = () => {
    if (socket) return socket

    const token = localStorage.getItem('auth_token')
    if (!token) return null

    socket = io(config.public.socketUrl, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id)
    })

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    // Message events
    socket.on('message_received', (data) => {
      // Handle incoming messages
      nuxtApp.emit('message:received', data)
    })

    socket.on('message_sent', (data) => {
      // Handle sent message confirmation
      nuxtApp.emit('message:sent', data)
    })

    socket.on('device_status', (data) => {
      // Handle device status updates
      nuxtApp.emit('device:status', data)
    })

    socket.on('broadcast_progress', (data) => {
      // Handle broadcast progress updates
      nuxtApp.emit('broadcast:progress', data)
    })

    socket.on('system_notification', (data) => {
      // Handle system notifications
      nuxtApp.emit('system:notification', data)
    })

    return socket
  }

  // Disconnect socket
  const disconnectSocket = () => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }

  // Get socket instance
  const getSocket = () => socket

  // Provide socket functions globally
  nuxtApp.provide('socket', {
    init: initSocket,
    disconnect: disconnectSocket,
    get: getSocket
  })

  // Auto-initialize socket if user is authenticated
  if (process.client) {
    const token = localStorage.getItem('auth_token')
    if (token) {
      initSocket()
    }
  }
}) 