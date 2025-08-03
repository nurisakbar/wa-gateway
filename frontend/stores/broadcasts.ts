import { defineStore } from 'pinia'

interface Broadcast {
  id: string
  user_id: string
  device_id: string
  title: string
  message: string
  recipient_type: 'all' | 'tag' | 'custom'
  tag?: string
  custom_numbers?: string[]
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'failed'
  progress: number
  recipient_count: number
  sent_count: number
  failed_count: number
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

interface BroadcastState {
  broadcasts: Broadcast[]
  selectedBroadcast: Broadcast | null
  loading: boolean
  error: string | null
}

export const useBroadcastStore = defineStore('broadcasts', {
  state: (): BroadcastState => ({
    broadcasts: [],
    selectedBroadcast: null,
    loading: false,
    error: null
  }),

  getters: {
    getBroadcasts: (state) => state.broadcasts,
    getSelectedBroadcast: (state) => state.selectedBroadcast,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getBroadcastCount: (state) => state.broadcasts.length,
    getDraftBroadcasts: (state) => state.broadcasts.filter(b => b.status === 'draft'),
    getScheduledBroadcasts: (state) => state.broadcasts.filter(b => b.status === 'scheduled'),
    getRunningBroadcasts: (state) => state.broadcasts.filter(b => b.status === 'running'),
    getCompletedBroadcasts: (state) => state.broadcasts.filter(b => b.status === 'completed'),
    getBroadcastById: (state) => (id: string) => state.broadcasts.find(b => b.id === id)
  },

  actions: {
    async fetchBroadcasts() {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/broadcasts')

        if (response.data.success) {
          this.broadcasts = response.data.data.broadcasts
          return { success: true, broadcasts: this.broadcasts }
        }
      } catch (error: any) {
        console.error('Fetch broadcasts error:', error)
        this.error = error.response?.data?.message || 'Failed to fetch broadcasts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createBroadcast(broadcastData: {
      title: string
      device_id: string
      message: string
      recipient_type: 'all' | 'tag' | 'custom'
      tag?: string
      custom_numbers?: string
      scheduled_at?: string
      save_as_draft?: boolean
    }) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/broadcasts', broadcastData)

        if (response.data.success) {
          const newBroadcast = response.data.data.broadcast
          this.broadcasts.push(newBroadcast)
          return { success: true, broadcast: newBroadcast }
        }
      } catch (error: any) {
        console.error('Create broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to create broadcast'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async startBroadcast(broadcastId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post(`/broadcasts/${broadcastId}/start`)

        if (response.data.success) {
          const updatedBroadcast = response.data.data.broadcast
          const index = this.broadcasts.findIndex(b => b.id === broadcastId)
          if (index !== -1) {
            this.broadcasts[index] = updatedBroadcast
          }
          return { success: true, broadcast: updatedBroadcast }
        }
      } catch (error: any) {
        console.error('Start broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to start broadcast'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async cancelBroadcast(broadcastId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post(`/broadcasts/${broadcastId}/cancel`)

        if (response.data.success) {
          const updatedBroadcast = response.data.data.broadcast
          const index = this.broadcasts.findIndex(b => b.id === broadcastId)
          if (index !== -1) {
            this.broadcasts[index] = updatedBroadcast
          }
          return { success: true, broadcast: updatedBroadcast }
        }
      } catch (error: any) {
        console.error('Cancel broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to cancel broadcast'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteBroadcast(broadcastId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete(`/broadcasts/${broadcastId}`)

        if (response.data.success) {
          this.broadcasts = this.broadcasts.filter(b => b.id !== broadcastId)
          if (this.selectedBroadcast?.id === broadcastId) {
            this.selectedBroadcast = null
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Delete broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to delete broadcast'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async getBroadcast(broadcastId: string) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get(`/broadcasts/${broadcastId}`)

        if (response.data.success) {
          const broadcast = response.data.data.broadcast
          this.selectedBroadcast = broadcast
          return { success: true, broadcast }
        }
      } catch (error: any) {
        console.error('Get broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to get broadcast'
        return { success: false, error: this.error }
      }
    },

    async updateBroadcast(broadcastId: string, broadcastData: Partial<Broadcast>) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/broadcasts/${broadcastId}`, broadcastData)

        if (response.data.success) {
          const updatedBroadcast = response.data.data.broadcast
          const index = this.broadcasts.findIndex(b => b.id === broadcastId)
          if (index !== -1) {
            this.broadcasts[index] = updatedBroadcast
          }
          return { success: true, broadcast: updatedBroadcast }
        }
      } catch (error: any) {
        console.error('Update broadcast error:', error)
        this.error = error.response?.data?.message || 'Failed to update broadcast'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    selectBroadcast(broadcast: Broadcast | null) {
      this.selectedBroadcast = broadcast
    },

    clearError() {
      this.error = null
    },

    // Real-time broadcast handling
    handleBroadcastProgress(data: { broadcast_id: string; progress: number }) {
      const broadcast = this.broadcasts.find(b => b.id === data.broadcast_id)
      if (broadcast) {
        broadcast.progress = data.progress
        broadcast.updated_at = new Date().toISOString()
      }
    },

    handleBroadcastStatusUpdate(data: { broadcast_id: string; status: string }) {
      const broadcast = this.broadcasts.find(b => b.id === data.broadcast_id)
      if (broadcast) {
        broadcast.status = data.status as Broadcast['status']
        broadcast.updated_at = new Date().toISOString()
        
        if (data.status === 'running') {
          broadcast.started_at = new Date().toISOString()
        } else if (data.status === 'completed') {
          broadcast.completed_at = new Date().toISOString()
        }
      }
    }
  }
}) 