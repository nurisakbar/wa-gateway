import { defineStore } from 'pinia'

interface Contact {
  id: string
  user_id: string
  name: string
  phone_number: string
  email?: string
  tags?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ContactState {
  contacts: Contact[]
  selectedContact: Contact | null
  loading: boolean
  error: string | null
}

export const useContactStore = defineStore('contacts', {
  state: (): ContactState => ({
    contacts: [],
    selectedContact: null,
    loading: false,
    error: null
  }),

  getters: {
    getContacts: (state) => state.contacts,
    getSelectedContact: (state) => state.selectedContact,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getContactCount: (state) => state.contacts.length,
    getActiveContacts: (state) => state.contacts.filter(c => c.is_active),
    getContactById: (state) => (id: string) => state.contacts.find(c => c.id === id),
    getContactsByTag: (state) => (tag: string) => state.contacts.filter(c => c.tags?.includes(tag)),
    getUniqueTags: (state) => {
      const tags = new Set<string>()
      state.contacts.forEach(contact => {
        if (contact.tags) {
          contact.tags.forEach(tag => tags.add(tag))
        }
      })
      return Array.from(tags).sort()
    }
  },

  actions: {
    async fetchContacts() {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/contacts')

        if (response.data.success) {
          this.contacts = response.data.data.contacts
          return { success: true, contacts: this.contacts }
        }
      } catch (error: any) {
        console.error('Fetch contacts error:', error)
        this.error = error.response?.data?.message || 'Failed to fetch contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async createContact(contactData: {
      name: string
      phone_number: string
      email?: string
      tags?: string[]
      is_active?: boolean
    }) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/contacts', contactData)

        if (response.data.success) {
          const newContact = response.data.data.contact
          this.contacts.push(newContact)
          return { success: true, contact: newContact }
        }
      } catch (error: any) {
        console.error('Create contact error:', error)
        this.error = error.response?.data?.message || 'Failed to create contact'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateContact(contactId: string, contactData: Partial<Contact>) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/contacts/${contactId}`, contactData)

        if (response.data.success) {
          const updatedContact = response.data.data.contact
          const index = this.contacts.findIndex(c => c.id === contactId)
          if (index !== -1) {
            this.contacts[index] = updatedContact
          }
          return { success: true, contact: updatedContact }
        }
      } catch (error: any) {
        console.error('Update contact error:', error)
        this.error = error.response?.data?.message || 'Failed to update contact'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteContact(contactId: string) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete(`/contacts/${contactId}`)

        if (response.data.success) {
          this.contacts = this.contacts.filter(c => c.id !== contactId)
          if (this.selectedContact?.id === contactId) {
            this.selectedContact = null
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Delete contact error:', error)
        this.error = error.response?.data?.message || 'Failed to delete contact'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async importContacts(contactsData: any[]) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/contacts/import', { contacts: contactsData })

        if (response.data.success) {
          const importedContacts = response.data.data.contacts
          this.contacts.push(...importedContacts)
          return { 
            success: true, 
            imported_count: importedContacts.length,
            contacts: importedContacts 
          }
        }
      } catch (error: any) {
        console.error('Import contacts error:', error)
        this.error = error.response?.data?.message || 'Failed to import contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportContacts() {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/contacts/export', {
          responseType: 'blob'
        })

        return { success: true, data: response.data }
      } catch (error: any) {
        console.error('Export contacts error:', error)
        this.error = error.response?.data?.message || 'Failed to export contacts'
        return { success: false, error: this.error }
      }
    },

    selectContact(contact: Contact | null) {
      this.selectedContact = contact
    },

    clearError() {
      this.error = null
    },

    // Search and filter methods
    searchContacts(query: string) {
      if (!query) return this.contacts
      
      const searchTerm = query.toLowerCase()
      return this.contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.phone_number.includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm))
      )
    },

    filterContactsByTag(tag: string) {
      if (!tag) return this.contacts
      return this.contacts.filter(contact => contact.tags?.includes(tag))
    },

    filterContactsByStatus(isActive: boolean) {
      return this.contacts.filter(contact => contact.is_active === isActive)
    },

    // Bulk operations
    async bulkUpdateContacts(contactIds: string[], updateData: Partial<Contact>) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put('/contacts/bulk-update', {
          contact_ids: contactIds,
          update_data: updateData
        })

        if (response.data.success) {
          const updatedContacts = response.data.data.contacts
          updatedContacts.forEach(updatedContact => {
            const index = this.contacts.findIndex(c => c.id === updatedContact.id)
            if (index !== -1) {
              this.contacts[index] = updatedContact
            }
          })
          return { success: true, contacts: updatedContacts }
        }
      } catch (error: any) {
        console.error('Bulk update contacts error:', error)
        this.error = error.response?.data?.message || 'Failed to bulk update contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteContacts(contactIds: string[]) {
      this.loading = true
      this.error = null
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete('/contacts/bulk-delete', {
          data: { contact_ids: contactIds }
        })

        if (response.data.success) {
          this.contacts = this.contacts.filter(c => !contactIds.includes(c.id))
          if (this.selectedContact && contactIds.includes(this.selectedContact.id)) {
            this.selectedContact = null
          }
          return { success: true, deleted_count: contactIds.length }
        }
      } catch (error: any) {
        console.error('Bulk delete contacts error:', error)
        this.error = error.response?.data?.message || 'Failed to bulk delete contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
}) 