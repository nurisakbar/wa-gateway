import { defineStore } from 'pinia'

interface Device {
  id: string
  user_id: string
  name: string
  description?: string
  phone_number?: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  is_active: boolean
  last_activity?: string
  created_at: string
  updated_at: string
}

interface DeviceState {
  devices: Device[]
  selectedDevice: Device | null
  loading: boolean
  error: string | null
}

export const useDeviceStore = defineStore('devices', {
  state: (): DeviceState => ({
    devices: [],
    selectedDevice: null,
    loading: false,
    error: null
  }),

  getters: {
    getDevices: (state) => state.devices,
    getSelectedDevice: (state) => state.selectedDevice,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getConnectedDevices: (state) => state.devices.filter(d => d.status === 'connected'),
    getActiveDevices: (state) => state.devices.filter(d => d.is_active),
    getDeviceById: (state) => (id: string) => state.devices.find(d => d.id === id),
    getDeviceCount: (state) => state.devices.length,
    getConnectedCount: (state) => state.devices.filter(d => d.status === 'connected').length
  },

  actions: {
    async fetchDevices() {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/devices')
        
        if (response.data.success) {
          this.devices = response.data.data.devices
          return { success: true, devices: this.devices }
        }
      } catch (error: any) {
        console.error('Fetch devices error:', error)
        this.error = error.response?.data?.message || 'Failed to fetch devices'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createDevice(deviceData: {
      name: string
      description?: string
      phone_number?: string
    }) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/devices', deviceData)
        
        if (response.data.success) {
          const newDevice = response.data.data.device
          this.devices.push(newDevice)
          return { success: true, device: newDevice }
        }
      } catch (error: any) {
        console.error('Create device error:', error)
        this.error = error.response?.data?.message || 'Failed to create device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateDevice(deviceId: string, deviceData: Partial<Device>) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/devices/${deviceId}`, deviceData)
        
        if (response.data.success) {
          const updatedDevice = response.data.data.device
          const index = this.devices.findIndex(d => d.id === deviceId)
          if (index !== -1) {
            this.devices[index] = updatedDevice
          }
          return { success: true, device: updatedDevice }
        }
      } catch (error: any) {
        console.error('Update device error:', error)
        this.error = error.response?.data?.message || 'Failed to update device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteDevice(deviceId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete(`/devices/${deviceId}`)
        
        if (response.data.success) {
          this.devices = this.devices.filter(d => d.id !== deviceId)
          if (this.selectedDevice?.id === deviceId) {
            this.selectedDevice = null
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Delete device error:', error)
        this.error = error.response?.data?.message || 'Failed to delete device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async connectDevice(deviceId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post(`/devices/${deviceId}/connect`)
        
        if (response.data.success) {
          const device = this.devices.find(d => d.id === deviceId)
          if (device) {
            device.status = 'connecting'
          }
          return { success: true, qrCode: response.data.data.qr_code }
        }
      } catch (error: any) {
        console.error('Connect device error:', error)
        this.error = error.response?.data?.message || 'Failed to connect device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async disconnectDevice(deviceId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post(`/devices/${deviceId}/disconnect`)
        
        if (response.data.success) {
          const device = this.devices.find(d => d.id === deviceId)
          if (device) {
            device.status = 'disconnected'
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Disconnect device error:', error)
        this.error = error.response?.data?.message || 'Failed to disconnect device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async getDeviceStatus(deviceId: string) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get(`/devices/${deviceId}/status`)
        
        if (response.data.success) {
          const device = this.devices.find(d => d.id === deviceId)
          if (device) {
            device.status = response.data.data.status
            device.last_activity = response.data.data.last_activity
          }
          return { success: true, status: response.data.data }
        }
      } catch (error: any) {
        console.error('Get device status error:', error)
        return { success: false, error: error.response?.data?.message }
      }
    },

    selectDevice(device: Device | null) {
      this.selectedDevice = device
    },

    updateDeviceStatus(deviceId: string, status: Device['status']) {
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
        device.status = status
        device.last_activity = new Date().toISOString()
      }
    },

    updateDeviceActivity(deviceId: string) {
      const device = this.devices.find(d => d.id === deviceId)
      if (device) {
        device.last_activity = new Date().toISOString()
      }
    },

    clearError() {
      this.error = null
    },

    // Real-time updates from socket
    handleDeviceStatusUpdate(data: { device_id: string; status: Device['status'] }) {
      this.updateDeviceStatus(data.device_id, data.status)
    },

    handleDeviceActivity(data: { device_id: string }) {
      this.updateDeviceActivity(data.device_id)
    }
  }
}) 