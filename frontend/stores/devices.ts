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
    getDevices: (state) => state.devices || [],
    getSelectedDevice: (state) => state.selectedDevice,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getConnectedDevices: (state) => (state.devices || []).filter(d => d && d.status === 'connected'),
    getActiveDevices: (state) => (state.devices || []).filter(d => d && d.is_active),
    getDeviceById: (state) => (id: string) => (state.devices || []).find(d => d && d.id === id),
    getDeviceCount: (state) => (state.devices || []).length,
    getConnectedCount: (state) => (state.devices || []).filter(d => d && d.status === 'connected').length
  },

  actions: {
    async fetchDevices() {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        // Try using $api first, fallback to $fetch
        let response
        try {
          const { $api } = useNuxtApp()
          response = await $api.get('/devices')
        } catch (apiError) {
          response = await $fetch(`${config.public.apiBase}/devices`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
        }
        
        
        if (response.data?.success) {
          // Handle different response structures
          let devicesArray = []
          
          // Backend returns: { success: true, data: devicesArray, pagination: {...} }
          if (response.data.data && Array.isArray(response.data.data)) {
            devicesArray = response.data.data
          } 
          // Handle nested structure if exists: { success: true, data: { data: devicesArray } }
          else if (response.data.data?.data && Array.isArray(response.data.data.data)) {
            devicesArray = response.data.data.data
          }
          // Handle single device: { success: true, data: singleDevice }
          else if (response.data.data && !Array.isArray(response.data.data)) {
            devicesArray = [response.data.data]
          }
          // Empty response
          else {
            devicesArray = []
          }
          
          this.devices = devicesArray
          return { success: true, devices: this.devices }
        } else {
          this.devices = []
          return { success: false, error: response.data?.message || 'API returned success: false' }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.data?.message || 'Failed to fetch devices'
        // Initialize with empty array on error
        this.devices = []
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
        const config = useRuntimeConfig()
        
        // Try using $api first, fallback to $fetch
        let response
        try {
          const { $api } = useNuxtApp()
          response = await $api.post('/devices', deviceData)
        } catch (apiError) {
          // console.log('$api failed, trying $fetch...')
          const token = localStorage.getItem('auth_token')
          response = await $fetch(`${config.public.apiBase}/devices`, {
            method: 'POST',
            body: deviceData,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
        }
        
        
        if (response.data.success) {
          // Handle different response structures
          let newDevice = null
          
          // Prefer explicit device field when present: { data: { device, api_key } }
          if (response.data.data?.device) {
            newDevice = response.data.data.device
          }
          // Backend returns: { success: true, data: device }
          else if (response.data.data && !Array.isArray(response.data.data)) {
            newDevice = response.data.data
          }
          // Handle array response: { success: true, data: [device] }
          else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            newDevice = response.data.data[0]
          }
          
          
          // Ensure device has required fields
          if (newDevice && newDevice.id) {
            this.devices.push(newDevice)
            // Optionally expose returned api_key
            const apiKey = (response.data.data && (response.data.data as any).api_key) ? (response.data.data as any).api_key : null
            if (apiKey?.full_key) {
              try { await navigator.clipboard.writeText(apiKey.full_key) } catch (e) {}
            }
            return { success: true, device: newDevice }
          } else {
// console.error('Invalid device data received:', newDevice)
            return { success: false, error: 'Invalid device data received' }
          }
        } else {
// console.error('API returned success: false')
          return { success: false, error: response.data.message || 'Failed to create device' }
        }
      } catch (error: any) {
// console.error('Create device error:', error)
        this.error = error.response?.data?.message || error.data?.message || 'Failed to create device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateDevice(deviceId: string, deviceData: Partial<Device>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        
        // Try using $api first, fallback to $fetch
        let response
        try {
          const { $api } = useNuxtApp()
          response = await $api.put(`/devices/${deviceId}`, deviceData)
        } catch (apiError) {
          // console.log('$api failed, trying $fetch...', apiError)
          const token = localStorage.getItem('auth_token')
          response = await $fetch(`${config.public.apiBase}/devices/${deviceId}`, {
            method: 'PUT',
            body: deviceData,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
        }
        
        // console.log('Update device response:', response)
        
        if (response.data?.success) {
          // Handle different response structures
          let updatedDevice = null
          
          // Backend returns: { success: true, data: device }
          if (response.data.data && !Array.isArray(response.data.data)) {
            updatedDevice = response.data.data
          }
          // Handle nested structure if exists: { success: true, data: { device: device } }
          else if (response.data.data?.device) {
            updatedDevice = response.data.data.device
          }
          // Handle array response: { success: true, data: [device] }
          else if (response.data.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
            updatedDevice = response.data.data[0]
          }
          
          if (updatedDevice && updatedDevice.id) {
            const index = this.devices.findIndex(d => d && d.id === deviceId)
            if (index !== -1) {
              this.devices[index] = updatedDevice
            }
            return { success: true, device: updatedDevice }
          } else {
// console.error('Invalid updated device data:', response.data)
            return { success: false, error: 'Invalid response from server' }
          }
        } else {
// console.error('API returned success: false')
          return { success: false, error: response.data?.message || 'Failed to update device' }
        }
      } catch (error: any) {
// console.error('Update device error:', error)
        this.error = error.response?.data?.message || error.data?.message || 'Failed to update device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteDevice(deviceId: string) {
      this.loading = true
      this.error = null
      try {
        // console.log('Deleting device:', deviceId)
        const config = useRuntimeConfig()
        
        // Try using $api first, fallback to $fetch
        let response
        try {
          const { $api } = useNuxtApp()
          response = await $api.delete(`/devices/${deviceId}`)
        } catch (apiError) {
          // console.log('$api failed, trying $fetch...', apiError)
          const token = localStorage.getItem('auth_token')
          response = await $fetch(`${config.public.apiBase}/devices/${deviceId}`, {
            method: 'DELETE',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
        }
        
        // console.log('Delete device response:', response)
        
        if (response.data?.success) {
          this.devices = this.devices.filter(d => d && d.id !== deviceId)
          if (this.selectedDevice?.id === deviceId) {
            this.selectedDevice = null
          }
          return { success: true }
        } else {
// console.error('API returned success: false')
          return { success: false, error: response.data?.message || 'Failed to delete device' }
        }
      } catch (error: any) {
// console.error('Delete device error:', error)
        this.error = error.response?.data?.message || error.data?.message || 'Failed to delete device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async connectDevice(deviceId: string) {
      // console.log('=== STORE CONNECT DEVICE CALLED ===')
      // console.log('Device ID:', deviceId)
      // console.log('Current loading state:', this.loading)
      
      // Prevent multiple simultaneous requests
      if (this.loading) {
        // console.log('Connect device already in progress, skipping...')
        return { success: false, error: 'Connection already in progress' }
      }
      
      this.loading = true
      this.error = null
      try {
        // console.log('Connecting device:', deviceId)
        const config = useRuntimeConfig()
        // console.log('API Base URL:', config.public.apiBase)
        
        // Step 1: Initialize connection
        let response
        try {
          // console.log('Trying $api first...')
          const { $api } = useNuxtApp()
          response = await $api.post(`/devices/${deviceId}/connect`)
          // console.log('$api response:', response)
        } catch (apiError) {
          // console.log('$api failed, trying $fetch...', apiError)
          const token = localStorage.getItem('auth_token')
          // console.log('Auth token:', token ? 'Present' : 'Missing')
          response = await $fetch(`${config.public.apiBase}/devices/${deviceId}/connect`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          // console.log('$fetch response:', response)
        }
        
        // console.log('Connect device response:', response)
        
        if (response.data.success) {
          const device = this.devices.find(d => d.id === deviceId)
          if (device) {
            device.status = 'connecting'
          }
          
          // Step 2: Wait for QR code to be generated (Baileys takes time)
          // console.log('Waiting for QR code generation...')
          await new Promise(resolve => setTimeout(resolve, 10000)) // Increased wait time to 10 seconds
          
          // Step 3: Try to get QR code with retries
          let qrResponse = null
          let qrCodeAvailable = false
          
          for (let attempt = 1; attempt <= 8; attempt++) { // Increased retry attempts to 8
            try {
              // console.log(`QR code attempt ${attempt}/5...`)
              const { $api } = useNuxtApp()
              qrResponse = await $api.get(`/devices/${deviceId}/qr`)
              
              // console.log('QR response:', qrResponse.data)
              
              // Handle different response scenarios
              if (qrResponse.data.success && qrResponse.data.data.qr_code) {
                // console.log('QR code available!')
                qrCodeAvailable = true
                break
              } else if (qrResponse.status === 202) {
                // QR code is being generated, wait and retry
                // console.log(`QR code being generated, retry after ${qrResponse.data.data.retry_after || 3} seconds`)
                if (attempt < 8) {
                  await new Promise(resolve => setTimeout(resolve, (qrResponse.data.data.retry_after || 3) * 1000))
                }
              } else if (qrResponse.status === 400 && qrResponse.data.data?.connected) {
                // Device is already connected
                // console.log('Device is already connected!')
                return { success: true, qrCode: null, message: 'Device is already connected!' }
              } else {
                // console.log(`QR code not ready yet, attempt ${attempt}/8`)
                if (attempt < 8) {
                  await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds between attempts
                }
              }
            } catch (qrApiError) {
              // console.log(`QR API attempt ${attempt} failed, trying $fetch...`)
              try {
                const token = localStorage.getItem('auth_token')
                // Use raw to access HTTP status
                const raw = await $fetch.raw(`${config.public.apiBase}/devices/${deviceId}/qr`, {
                  headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                })
                // Normalize to axios-like shape
                qrResponse = { status: raw.status, data: raw._data }
                
                // console.log('QR fetch response:', qrResponse)
                
                if (qrResponse.data.success && qrResponse.data.data.qr_code) {
                  // console.log('QR code available via $fetch!')
                  qrCodeAvailable = true
                  break
                } else if (qrResponse.status === 202) {
                  // QR code is being generated, wait and retry
                  // console.log(`QR code being generated (fetch), retry after ${qrResponse.data.data.retry_after || 3} seconds`)
                  if (attempt < 8) {
                    await new Promise(resolve => setTimeout(resolve, (qrResponse.data.data.retry_after || 3) * 1000))
                  }
                } else if (qrResponse.status === 400 && qrResponse.data.data?.connected) {
                  // Device is already connected
                  // console.log('Device is already connected! (fetch)')
                  return { success: true, qrCode: null, message: 'Device is already connected!' }
                }
              } catch (fetchError) {
                // console.log(`QR fetch attempt ${attempt} failed:`, fetchError)
                if (attempt < 8) {
                  await new Promise(resolve => setTimeout(resolve, 3000))
                }
              }
            }
          }
          
          // console.log('Final QR code response:', qrResponse)
          
          if (qrCodeAvailable && qrResponse.data.success && qrResponse.data.data.qr_code) {
            return { success: true, qrCode: qrResponse.data.data.qr_code }
          } else {
            return { success: true, qrCode: null, message: 'Connection initiated, QR code will be available shortly. Please wait and try again.' }
          }
        } else {
          return { success: false, error: response.data.message || 'Failed to connect device' }
        }
      } catch (error: any) {
// console.error('Connect device error:', error)
        this.error = error.response?.data?.message || error.data?.message || 'Failed to connect device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async disconnectDevice(deviceId: string) {
      this.loading = true
      this.error = null
      try {
        // console.log('Disconnecting device:', deviceId)
        const config = useRuntimeConfig()
        
        // Try using $api first, fallback to $fetch
        let response
        try {
          const { $api } = useNuxtApp()
          response = await $api.post(`/devices/${deviceId}/disconnect`)
        } catch (apiError) {
          // console.log('$api failed, trying $fetch...')
          const token = localStorage.getItem('auth_token')
          response = await $fetch(`${config.public.apiBase}/devices/${deviceId}/disconnect`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
        }
        
        // console.log('Disconnect device response:', response)
        
        if (response.data.success) {
          const device = this.devices.find(d => d.id === deviceId)
          if (device) {
            device.status = 'disconnected'
          }
          return { success: true }
        } else {
          return { success: false, error: response.data.message || 'Failed to disconnect device' }
        }
      } catch (error: any) {
// console.error('Disconnect device error:', error)
        this.error = error.response?.data?.message || error.data?.message || 'Failed to disconnect device'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async getDeviceToken(deviceId: string) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get(`/devices/${deviceId}/token`)
        if (response.data?.success) {
          return { success: true, token: response.data.data.full_key, info: response.data.data }
        }
        return { success: false, error: response.data?.message || 'Failed to get token' }
      } catch (error: any) {
        const config = useRuntimeConfig()
        try {
          const token = localStorage.getItem('auth_token')
          const res = await $fetch(`${config.public.apiBase}/devices/${deviceId}/token`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          })
          if (res.data?.success) {
            return { success: true, token: res.data.data.full_key, info: res.data.data }
          }
          return { success: false, error: res.data?.message || 'Failed to get token' }
        } catch (e: any) {
          return { success: false, error: e?.response?.data?.message || e?.data?.message || 'Failed to get token' }
        }
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
// console.error('Get device status error:', error)
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