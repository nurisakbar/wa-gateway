import { defineStore } from 'pinia'

export const useTemplateStore = defineStore('templates', {
  state: () => ({
    templates: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchTemplates() {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/templates`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.success) {
          this.templates = response.data.templates || []
        }
      } catch (error: any) {
// console.error('Fetch templates error:', error)
        this.error = error.data?.message || error.message || 'Failed to fetch templates'
      } finally {
        this.loading = false
      }
    },

    async createTemplate(templateData) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/templates`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: templateData
        })
        
        if (response.success) {
          const newTemplate = response.data.template
          this.templates.push(newTemplate)
          return { success: true, template: newTemplate }
        }
      } catch (error: any) {
// console.error('Create template error:', error)
        this.error = error.data?.message || error.message || 'Failed to create template'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
}) 