export const useRealtime = () => {
  const { $socket } = useNuxtApp()
  const { $toast } = useToast()

  // Real-time state
  const isConnected = ref(false)
  const lastMessage = ref(null)
  const deviceStatus = ref({})
  const broadcastProgress = ref({})

  // Listen for socket connection status
  watch(() => $socket.isConnected, (connected) => {
    isConnected.value = connected
  }, { immediate: true })

  // Message event handlers
  const handleMessageReceived = (data) => {
    lastMessage.value = data
    $toast.success(`New message from ${data.sender}`)
    
    // Update messages store if available
    const messagesStore = useMessagesStore()
    if (messagesStore) {
      messagesStore.addMessage(data)
    }
  }

  const handleMessageSent = (data) => {
    $toast.success('Message sent successfully')
    
    // Update messages store
    const messagesStore = useMessagesStore()
    if (messagesStore) {
      messagesStore.updateMessageStatus(data.messageId, 'sent')
    }
  }

  const handleMessageDelivered = (data) => {
    $toast.info('Message delivered')
    
    // Update messages store
    const messagesStore = useMessagesStore()
    if (messagesStore) {
      messagesStore.updateMessageStatus(data.messageId, 'delivered')
    }
  }

  const handleMessageRead = (data) => {
    $toast.info('Message read')
    
    // Update messages store
    const messagesStore = useMessagesStore()
    if (messagesStore) {
      messagesStore.updateMessageStatus(data.messageId, 'read')
    }
  }

  // Device event handlers
  const handleDeviceConnected = (data) => {
    deviceStatus.value[data.deviceId] = 'connected'
    $toast.success(`Device ${data.name} connected`)
    
    // Update devices store
    const devicesStore = useDevicesStore()
    if (devicesStore) {
      devicesStore.updateDeviceStatus(data.deviceId, 'connected')
    }
  }

  const handleDeviceDisconnected = (data) => {
    deviceStatus.value[data.deviceId] = 'disconnected'
    $toast.warning(`Device ${data.name} disconnected`)
    
    // Update devices store
    const devicesStore = useDevicesStore()
    if (devicesStore) {
      devicesStore.updateDeviceStatus(data.deviceId, 'disconnected')
    }
  }

  const handleDeviceQR = (data) => {
    $toast.info(`QR Code generated for device ${data.name}`)
    
    // Update devices store
    const devicesStore = useDevicesStore()
    if (devicesStore) {
      devicesStore.updateDeviceQR(data.deviceId, data.qrCode)
    }
  }

  const handleDeviceReady = (data) => {
    deviceStatus.value[data.deviceId] = 'ready'
    $toast.success(`Device ${data.name} ready`)
    
    // Update devices store
    const devicesStore = useDevicesStore()
    if (devicesStore) {
      devicesStore.updateDeviceStatus(data.deviceId, 'ready')
    }
  }

  // Broadcast event handlers
  const handleBroadcastStarted = (data) => {
    broadcastProgress.value[data.broadcastId] = {
      status: 'started',
      progress: 0,
      total: data.total,
      sent: 0
    }
    $toast.info('Broadcast started')
  }

  const handleBroadcastProgress = (data) => {
    if (broadcastProgress.value[data.broadcastId]) {
      broadcastProgress.value[data.broadcastId] = {
        ...broadcastProgress.value[data.broadcastId],
        progress: data.progress,
        sent: data.sent
      }
    }
  }

  const handleBroadcastCompleted = (data) => {
    broadcastProgress.value[data.broadcastId] = {
      status: 'completed',
      progress: 100,
      total: data.total,
      sent: data.sent
    }
    $toast.success('Broadcast completed')
  }

  // Contact event handlers
  const handleContactUpdated = (data) => {
    $toast.info('Contact updated')
    
    // Update contacts store
    const contactsStore = useContactsStore()
    if (contactsStore) {
      contactsStore.updateContact(data)
    }
  }

  // Notification handler
  const handleNotification = (data) => {
    switch (data.type) {
      case 'success':
        $toast.success(data.message)
        break
      case 'error':
        $toast.error(data.message)
        break
      case 'warning':
        $toast.warning(data.message)
        break
      default:
        $toast.info(data.message)
    }
  }

  // Setup event listeners
  const setupEventListeners = () => {
    if (process.client) {
      window.addEventListener('message:received', (e) => handleMessageReceived(e.detail))
      window.addEventListener('message:sent', (e) => handleMessageSent(e.detail))
      window.addEventListener('message:delivered', (e) => handleMessageDelivered(e.detail))
      window.addEventListener('message:read', (e) => handleMessageRead(e.detail))
      
      window.addEventListener('device:connected', (e) => handleDeviceConnected(e.detail))
      window.addEventListener('device:disconnected', (e) => handleDeviceDisconnected(e.detail))
      window.addEventListener('device:qr', (e) => handleDeviceQR(e.detail))
      window.addEventListener('device:ready', (e) => handleDeviceReady(e.detail))
      
      window.addEventListener('broadcast:started', (e) => handleBroadcastStarted(e.detail))
      window.addEventListener('broadcast:progress', (e) => handleBroadcastProgress(e.detail))
      window.addEventListener('broadcast:completed', (e) => handleBroadcastCompleted(e.detail))
      
      window.addEventListener('contact:updated', (e) => handleContactUpdated(e.detail))
      window.addEventListener('notification', (e) => handleNotification(e.detail))
    }
  }

  // Remove event listeners
  const removeEventListeners = () => {
    if (process.client) {
      window.removeEventListener('message:received', handleMessageReceived)
      window.removeEventListener('message:sent', handleMessageSent)
      window.removeEventListener('message:delivered', handleMessageDelivered)
      window.removeEventListener('message:read', handleMessageRead)
      
      window.removeEventListener('device:connected', handleDeviceConnected)
      window.removeEventListener('device:disconnected', handleDeviceDisconnected)
      window.removeEventListener('device:qr', handleDeviceQR)
      window.removeEventListener('device:ready', handleDeviceReady)
      
      window.removeEventListener('broadcast:started', handleBroadcastStarted)
      window.removeEventListener('broadcast:progress', handleBroadcastProgress)
      window.removeEventListener('broadcast:completed', handleBroadcastCompleted)
      
      window.removeEventListener('contact:updated', handleContactUpdated)
      window.removeEventListener('notification', handleNotification)
    }
  }

  // Connect to socket
  const connect = () => {
    $socket.connect()
    setupEventListeners()
  }

  // Disconnect from socket
  const disconnect = () => {
    removeEventListeners()
    $socket.disconnect()
  }

  // Send message via socket
  const sendMessage = (messageData) => {
    $socket.emit('message:send', messageData)
  }

  // Join device room
  const joinDeviceRoom = (deviceId) => {
    $socket.emit('device:join', { deviceId })
  }

  // Leave device room
  const leaveDeviceRoom = (deviceId) => {
    $socket.emit('device:leave', { deviceId })
  }

  // Auto-connect when composable is used
  onMounted(() => {
    connect()
  })

  // Cleanup on unmount
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected: readonly(isConnected),
    lastMessage: readonly(lastMessage),
    deviceStatus: readonly(deviceStatus),
    broadcastProgress: readonly(broadcastProgress),
    connect,
    disconnect,
    sendMessage,
    joinDeviceRoom,
    leaveDeviceRoom
  }
} 