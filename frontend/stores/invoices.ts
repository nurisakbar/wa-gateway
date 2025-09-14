import { defineStore } from 'pinia'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  total: number
}

interface Invoice {
  id: string
  user_id: string
  subscription_id?: string
  invoice_number: string
  status: 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled'
  amount: number
  currency: string
  subtotal: number
  tax: number
  discount: number
  due_date: string
  paid_at?: string
  payment_method?: string
  external_invoice_id?: string
  items: InvoiceItem[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

interface InvoiceStats {
  total_invoices: number
  total_paid: number
  total_outstanding: number
  status_breakdown: Array<{
    status: string
    count: number
    total_amount: number
  }>
}

interface InvoiceState {
  invoices: Invoice[]
  currentInvoice: Invoice | null
  stats: InvoiceStats | null
  loading: boolean
  error: string | null
}

export const useInvoiceStore = defineStore('invoices', {
  state: (): InvoiceState => ({
    invoices: [],
    currentInvoice: null,
    stats: null,
    loading: false,
    error: null
  }),

  getters: {
    getInvoices: (state) => state.invoices,
    getCurrentInvoice: (state) => state.currentInvoice,
    getStats: (state) => state.stats,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    
    getInvoicesByStatus: (state) => (status: string) => {
      return state.invoices.filter(invoice => invoice.status === status)
    },
    
    getPaidInvoices: (state) => {
      return state.invoices.filter(invoice => invoice.status === 'paid')
    },
    
    getOpenInvoices: (state) => {
      return state.invoices.filter(invoice => invoice.status === 'pending')
    },
    
    getOverdueInvoices: (state) => {
      const now = new Date()
      return state.invoices.filter(invoice => {
        if (invoice.status === 'paid') return false
        return new Date(invoice.due_date) < now
      })
    },
    
    getTotalPaid: (state) => {
      return state.invoices
        .filter(invoice => invoice.status === 'paid')
        .reduce((total, invoice) => total + invoice.amount, 0)
    },
    
    getTotalOutstanding: (state) => {
      return state.invoices
        .filter(invoice => invoice.status === 'pending')
        .reduce((total, invoice) => total + invoice.amount, 0)
    }
  },

  actions: {
    async fetchInvoices(page = 1, limit = 10, status?: string) {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        let url = `${config.public.apiBase}/invoices?page=${page}&limit=${limit}`
        if (status) {
          url += `&status=${status}`
        }
        
        const response = await $fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.success) {
          this.invoices = response.data.invoices
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch invoices')
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch invoices'
        console.error('Error fetching invoices:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchInvoice(id: string) {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        const response = await $fetch(`${config.public.apiBase}/invoices/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.success) {
          this.currentInvoice = response.data
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch invoice')
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch invoice'
        console.error('Error fetching invoice:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchInvoiceStats() {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        const response = await $fetch(`${config.public.apiBase}/invoices/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.success) {
          this.stats = response.data
          return response.data
        } else {
          throw new Error(response.message || 'Failed to fetch invoice stats')
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch invoice stats'
        console.error('Error fetching invoice stats:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async generateInvoice(subscriptionId: string, amount: number, description?: string) {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        const response = await $fetch(`${config.public.apiBase}/invoices/generate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            subscription_id: subscriptionId,
            amount: amount,
            description: description
          }
        })
        
        if (response.success) {
          // Add the new invoice to the list
          this.invoices.unshift(response.data)
          return response.data
        } else {
          throw new Error(response.message || 'Failed to generate invoice')
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to generate invoice'
        console.error('Error generating invoice:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async markInvoiceAsPaid(id: string, paymentMethod = 'manual', externalPaymentId?: string) {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        const response = await $fetch(`${config.public.apiBase}/invoices/${id}/pay`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            payment_method: paymentMethod,
            external_payment_id: externalPaymentId
          }
        })
        
        if (response.success) {
          // Update the invoice in the list
          const index = this.invoices.findIndex(invoice => invoice.id === id)
          if (index !== -1) {
            this.invoices[index] = response.data
          }
          
          // Update current invoice if it's the same
          if (this.currentInvoice && this.currentInvoice.id === id) {
            this.currentInvoice = response.data
          }
          
          return response.data
        } else {
          throw new Error(response.message || 'Failed to mark invoice as paid')
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to mark invoice as paid'
        console.error('Error marking invoice as paid:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async downloadInvoice(id: string) {
      this.loading = true
      this.error = null
      
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token')
        
        const response = await $fetch(`${config.public.apiBase}/invoices/${id}/download`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.success) {
          return response.data
        } else {
          throw new Error(response.message || 'Failed to download invoice')
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to download invoice'
        console.error('Error downloading invoice:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    },

    clearCurrentInvoice() {
      this.currentInvoice = null
    }
  }
})
