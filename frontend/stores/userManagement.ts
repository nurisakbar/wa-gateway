import { defineStore } from 'pinia'

export interface User {
  id: string
  full_name: string
  username: string
  email: string
  phone?: string
  role: string
  status: string
  email_verified_at?: string
  phone_verified_at?: string
  last_login_at?: string
  created_at?: string
  updated_at?: string
}

export interface UserPagination {
  total: number
  page: number
  limit: number
  pages: number
}

export const useUserManagementStore = defineStore('userManagement', {
  state: () => ({
    users: [] as User[],
    selectedUser: null as User | null,
    loading: false,
    error: null as string | null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      pages: 0
    } as UserPagination
  }),

  getters: {
    getUsers: (state) => state.users,
    getUserById: (state) => (id: string) => state.users.find(user => user.id === id),
    getUsersByRole: (state) => (role: string) => state.users.filter(user => user.role === role),
    getUsersByStatus: (state) => (status: string) => state.users.filter(user => user.status === status),
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getPagination: (state) => state.pagination
  },

  actions: {
    async fetchUsers(params: {
      page?: number
      limit?: number
      search?: string
      role?: string
      status?: string
    } = {}) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const queryParams = new URLSearchParams()
        if (params.page) queryParams.append('page', params.page.toString())
        if (params.limit) queryParams.append('limit', params.limit.toString())
        if (params.search) queryParams.append('search', params.search)
        if (params.role) queryParams.append('role', params.role)
        if (params.status) queryParams.append('status', params.status)
        
        const queryString = queryParams.toString()
        const url = queryString ? `/user-management?${queryString}` : '/user-management'
        
        const response = await $api.get(url)
        
        if (response.data?.success) {
          this.users = response.data.data
          this.pagination = response.data.pagination
          return { success: true, users: this.users, pagination: this.pagination }
        } else {
          this.error = response.data?.message || 'Failed to fetch users'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch users'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchUserById(id: string) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.get(`/user-management/${id}`)
        
        if (response.data?.success) {
          this.selectedUser = response.data.data
          return { success: true, user: this.selectedUser }
        } else {
          this.error = response.data?.message || 'Failed to fetch user'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch user'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createUser(userData: Partial<User & { password: string }>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.post('/user-management', userData)
        
        if (response.data?.success) {
          this.users.unshift(response.data.data)
          this.pagination.total += 1
          return { success: true, user: response.data.data }
        } else {
          this.error = response.data?.message || 'Failed to create user'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to create user'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateUser(id: string, userData: Partial<User & { password?: string }>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.put(`/user-management/${id}`, userData)
        
        if (response.data?.success) {
          const index = this.users.findIndex(user => user.id === id)
          if (index !== -1) {
            this.users[index] = response.data.data
          }
          if (this.selectedUser?.id === id) {
            this.selectedUser = response.data.data
          }
          return { success: true, user: response.data.data }
        } else {
          this.error = response.data?.message || 'Failed to update user'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to update user'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteUser(id: string) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.delete(`/user-management/${id}`)
        
        if (response.data?.success) {
          this.users = this.users.filter(user => user.id !== id)
          this.pagination.total -= 1
          if (this.selectedUser?.id === id) {
            this.selectedUser = null
          }
          return { success: true }
        } else {
          this.error = response.data?.message || 'Failed to delete user'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete user'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    },

    setSelectedUser(user: User | null) {
      this.selectedUser = user
    }
  }
})
