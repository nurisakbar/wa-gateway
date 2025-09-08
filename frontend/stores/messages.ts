import { defineStore } from 'pinia'

interface Message {
  id: string
  user_id: string
  device_id: string
  to_number: string
  from_number?: string
  content: string
  type: 'text' | 'image' | 'document' | 'audio' | 'video'
  direction: 'inbound' | 'outbound'
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
  media_url?: string
  filename?: string
  file_size?: number
  timestamp: string
  created_at: string
  updated_at: string
}

interface MessageState {
  messages: Message[]
  selectedMessage: Message | null
  loading: boolean
  error: string | null
}

export const useMessageStore = defineStore('messages', {
  state: (): MessageState => ({
    messages: [],
    selectedMessage: null,
    loading: false,
    error: null
  }),

  getters: {
    getMessages: (state) => state.messages,
    getSelectedMessage: (state) => state.selectedMessage,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getMessageCount: (state) => state.messages.length,
    getSentMessages: (state) => state.messages.filter(m => m.direction === 'outbound'),
    getReceivedMessages: (state) => state.messages.filter(m => m.direction === 'inbound'),
    getMessageById: (state) => (id: string) => state.messages.find(m => m.id === id),
    getMessagesByPhone: (state) => (phoneNumber: string) => 
      state.messages.filter(m => m.to_number === phoneNumber || m.from_number === phoneNumber),
    getMessagesByDevice: (state) => (deviceId: string) => 
      state.messages.filter(m => m.device_id === deviceId),
    getMessagesByStatus: (state) => (status: string) => 
      state.messages.filter(m => m.status === status)
  },

  actions: {
    async fetchMessages(filters: {
      to_number?: string
      from_number?: string
      device_id?: string
      status?: string
      limit?: number
      offset?: number
    } = {}) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const params = new URLSearchParams()
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString())
        })

        const response = await $api.get(`/whatsapp/messages?${params.toString()}`)

        if (response.data.success) {
          // API may return { data: { messages: [...] }} or { data: [...] }
          const raw = response.data.data?.messages ?? response.data.data ?? []
          // Normalize payload to frontend Message interface
          this.messages = (raw as any[]).map((m: any) => ({
            id: m.id,
            user_id: m.user_id,
            device_id: m.device_id,
            to_number: m.to_number,
            from_number: m.from_number,
            content: m.content,
            type: (m.type || m.message_type || 'text') as any,
            direction: m.direction === 'outgoing' ? 'outbound' : 'inbound',
            status: m.status,
            media_url: m.metadata?.media_path || m.media_url,
            filename: m.metadata?.filename || m.filename,
            file_size: m.file_size,
            timestamp: m.timestamp || m.sent_at || m.created_at,
            created_at: m.created_at,
            updated_at: m.updated_at
          }))
          return { success: true, messages: this.messages }
        }
      } catch (error: any) {
        console.error('Fetch messages error:', error)
        this.error = error.response?.data?.message || 'Failed to fetch messages'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async sendMessage(messageData: {
      device_id: string
      to_number: string
      content: string
      type?: string
      media_url?: string
      filename?: string
    }) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/messages/send', messageData)

        if (response.data.success) {
          const newMessage = response.data.data.message
          this.messages.push(newMessage)
          return { success: true, message: newMessage }
        }
      } catch (error: any) {
        console.error('Send message error:', error)
        this.error = error.response?.data?.message || 'Failed to send message'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async sendBroadcast(broadcastData: {
      device_id: string
      message: string
      recipient_type: 'all' | 'tag'
      tag?: string
      scheduled_at?: string
    }) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/broadcasts', broadcastData)

        if (response.data.success) {
          return { success: true, broadcast: response.data.data.broadcast }
        }
      } catch (error: any) {
        console.error('Send broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to send broadcast'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async getMessage(messageId: string) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get(`/messages/${messageId}`)

        if (response.data.success) {
          const message = response.data.data.message
          this.selectedMessage = message
          return { success: true, message }
        }
      } catch (error: any) {
        console.error('Get message error:', error)
        this.error = error.response?.data?.message || 'Failed to get message'
        return { success: false, error: this.error }
      }
    },

    async deleteMessage(messageId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete(`/messages/${messageId}`)

        if (response.data.success) {
          this.messages = this.messages.filter(m => m.id !== messageId)
          if (this.selectedMessage?.id === messageId) {
            this.selectedMessage = null
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Delete message error:', error)
        this.error = error.response?.data?.message || 'Failed to delete message'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async getMessageStatistics(filters: {
      device_id?: string
      date_from?: string
      date_to?: string
    } = {}) {
      try {
        const { $api } = useNuxtApp()
        const params = new URLSearchParams()
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString())
        })

        const response = await $api.get(`/messages/statistics?${params.toString()}`)

        if (response.data.success) {
          return { success: true, statistics: response.data.data }
        }
      } catch (error: any) {
        console.error('Get message statistics error:', error)
        this.error = error.response?.data?.message || 'Failed to get message statistics'
        return { success: false, error: this.error }
      }
    },

    async resendMessage(messageId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post(`/messages/${messageId}/resend`)

        if (response.data.success) {
          const updatedMessage = response.data.data.message
          const index = this.messages.findIndex(m => m.id === messageId)
          if (index !== -1) {
            this.messages[index] = updatedMessage
          }
          return { success: true, message: updatedMessage }
        }
      } catch (error: any) {
        console.error('Resend message error:', error)
        this.error = error.response?.data?.message || 'Failed to resend message'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async uploadMedia(file: File) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const formData = new FormData()
        formData.append('file', file)

        const response = await $api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.success) {
          return { success: true, file: response.data.data.file }
        }
      } catch (error: any) {
        console.error('Upload media error:', error)
        this.error = error.response?.data?.message || 'Failed to upload media'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    selectMessage(message: Message | null) {
      this.selectedMessage = message
    },

    clearError() {
      this.error = null
    },

    // Real-time message handling
    handleNewMessage(message: Message) {
      // Check if message already exists
      const existingIndex = this.messages.findIndex(m => m.id === message.id)
      if (existingIndex !== -1) {
        // Update existing message
        this.messages[existingIndex] = message
      } else {
        // Add new message
        this.messages.push(message)
      }
    },

    handleMessageStatusUpdate(messageId: string, status: string) {
      const message = this.messages.find(m => m.id === messageId)
      if (message) {
        message.status = status
        message.updated_at = new Date().toISOString()
      }
    },

    // Search and filter methods
    searchMessages(query: string) {
      if (!query) return this.messages
      
      const searchTerm = query.toLowerCase()
      return this.messages.filter(message =>
        message.content.toLowerCase().includes(searchTerm) ||
        message.to_number.includes(searchTerm) ||
        (message.from_number && message.from_number.includes(searchTerm))
      )
    },

    filterMessagesByDateRange(startDate: string, endDate: string) {
      return this.messages.filter(message => {
        const messageDate = new Date(message.timestamp)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return messageDate >= start && messageDate <= end
      })
    },

    filterMessagesByType(type: string) {
      return this.messages.filter(message => message.type === type)
    },

    // Bulk operations
    async bulkDeleteMessages(messageIds: string[]) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete('/messages/bulk-delete', {
          data: { message_ids: messageIds }
        })

        if (response.data.success) {
          this.messages = this.messages.filter(m => !messageIds.includes(m.id))
          if (this.selectedMessage && messageIds.includes(this.selectedMessage.id)) {
            this.selectedMessage = null
          }
          return { success: true, deleted_count: messageIds.length }
        }
      } catch (error: any) {
        console.error('Bulk delete messages error:', error)
        this.error = error.response?.data?.message || 'Failed to bulk delete messages'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportMessages(filters: {
      device_id?: string
      date_from?: string
      date_to?: string
      format?: 'csv' | 'json'
    } = {}) {
      try {
        const { $api } = useNuxtApp()
        const params = new URLSearchParams()
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString())
        })

        const response = await $api.get(`/messages/export?${params.toString()}`, {
          responseType: 'blob'
        })

        return { success: true, data: response.data }
      } catch (error: any) {
        console.error('Export messages error:', error)
        this.error = error.response?.data?.message || 'Failed to export messages'
        return { success: false, error: this.error }
      }
    }
  }
}) 