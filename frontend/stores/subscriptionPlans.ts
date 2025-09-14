import { defineStore } from 'pinia'

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billing_cycle: string
  features: any
  plan_type: string
  created_at?: string
  updated_at?: string
}

export const useSubscriptionPlanStore = defineStore('subscriptionPlans', {
  state: () => ({
    plans: [] as SubscriptionPlan[],
    selectedPlan: null as SubscriptionPlan | null,
    loading: false,
    error: null as string | null
  }),

  getters: {
    getPlans: (state) => state.plans,
    getPlanById: (state) => (id: string) => state.plans.find(plan => plan.id === id),
    getPlansByType: (state) => (type: string) => state.plans.filter(plan => plan.plan_type === type),
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },

  actions: {
    async fetchPlans() {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.get('/subscription-plans')
        
        if (response.data?.success) {
          this.plans = response.data.data
          return { success: true, plans: this.plans }
        } else {
          this.error = response.data?.message || 'Failed to fetch subscription plans'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch subscription plans'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async fetchPlanById(id: string) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.get(`/subscription-plans/${id}`)
        
        if (response.data?.success) {
          this.selectedPlan = response.data.data
          return { success: true, plan: this.selectedPlan }
        } else {
          this.error = response.data?.message || 'Failed to fetch subscription plan'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to fetch subscription plan'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createPlan(planData: Partial<SubscriptionPlan>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.post('/subscription-plans', planData)
        
        if (response.data?.success) {
          this.plans.push(response.data.data)
          return { success: true, plan: response.data.data }
        } else {
          this.error = response.data?.message || 'Failed to create subscription plan'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to create subscription plan'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updatePlan(id: string, planData: Partial<SubscriptionPlan>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.put(`/subscription-plans/${id}`, planData)
        
        if (response.data?.success) {
          const index = this.plans.findIndex(plan => plan.id === id)
          if (index !== -1) {
            this.plans[index] = response.data.data
          }
          if (this.selectedPlan?.id === id) {
            this.selectedPlan = response.data.data
          }
          return { success: true, plan: response.data.data }
        } else {
          this.error = response.data?.message || 'Failed to update subscription plan'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to update subscription plan'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deletePlan(id: string) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const { $api } = useNuxtApp()
        
        const response = await $api.delete(`/subscription-plans/${id}`)
        
        if (response.data?.success) {
          this.plans = this.plans.filter(plan => plan.id !== id)
          if (this.selectedPlan?.id === id) {
            this.selectedPlan = null
          }
          return { success: true }
        } else {
          this.error = response.data?.message || 'Failed to delete subscription plan'
          return { success: false, error: this.error }
        }
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Failed to delete subscription plan'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    },

    setSelectedPlan(plan: SubscriptionPlan | null) {
      this.selectedPlan = plan
    }
  }
})
