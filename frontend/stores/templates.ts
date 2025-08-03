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
      try {
        const response = await $fetch('/api/v1/templates')
        this.templates = response.data || []
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async createTemplate(templateData) {
      try {
        const response = await $fetch('/api/v1/templates', {
          method: 'POST',
          body: templateData
        })
        this.templates.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
  }
}) 