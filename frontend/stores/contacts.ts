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
    // Normalize backend contact payloads into the frontend Contact shape
    normalizeContact(raw: any): Contact {
      return {
        id: raw.id,
        user_id: raw.user_id,
        name: raw.name,
        phone_number: raw.phone_number ?? raw.phone ?? '',
        email: raw.email ?? undefined,
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        // Derive is_active when backend doesn't provide it; treat not blocked as active
        is_active: typeof raw.is_active === 'boolean' ? raw.is_active : (typeof raw.is_blocked === 'boolean' ? !raw.is_blocked : true),
        created_at: raw.created_at,
        updated_at: raw.updated_at
      }
    },
    async fetchContacts() {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.success) {
          const raw = (Array.isArray(response.data) ? response.data : (response.data?.contacts || []))
          this.contacts = raw.map((c: any) => this.normalizeContact(c))
          return { success: true, contacts: this.contacts }
        }
      } catch (error: any) {
        console.error('Fetch contacts error:', error)
        this.error = error.data?.message || error.message || 'Failed to fetch contacts'
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
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: contactData
        })

        if (response.success) {
          const newContact = this.normalizeContact(response.data.contact)
          this.contacts.push(newContact)
          return { success: true, contact: newContact }
        }
      } catch (error: any) {
        console.error('Create contact error:', error)
        this.error = error.data?.message || error.message || 'Failed to create contact'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateContact(contactId: string, contactData: Partial<Contact>) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts/${contactId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: contactData
        })

        if (response.success) {
          const updatedContact = this.normalizeContact(response.data.contact)
          const index = this.contacts.findIndex(c => c.id === contactId)
          if (index !== -1) {
            this.contacts[index] = updatedContact
          }
          return { success: true, contact: updatedContact }
        }
      } catch (error: any) {
        console.error('Update contact error:', error)
        this.error = error.data?.message || 'Failed to update contact'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteContact(contactId: string) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts/${contactId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.success) {
          this.contacts = this.contacts.filter(c => c.id !== contactId)
          if (this.selectedContact?.id === contactId) {
            this.selectedContact = null
          }
          return { success: true }
        }
      } catch (error: any) {
        console.error('Delete contact error:', error)
        this.error = error.data?.message || 'Failed to delete contact'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async importContacts(contactsData: any[]) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts/import`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: { contacts: contactsData }
        })

        if (response.success) {
          const importedContacts = (response.data.contacts || []).map((c: any) => this.normalizeContact(c))
          this.contacts.push(...importedContacts)
          return { 
            success: true, 
            imported_count: importedContacts.length,
            contacts: importedContacts 
          }
        }
      } catch (error: any) {
        console.error('Import contacts error:', error)
        this.error = error.data?.message || 'Failed to import contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportContacts() {
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts/export`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        return { success: true, data: response.data }
      } catch (error: any) {
        console.error('Export contacts error:', error)
        this.error = error.data?.message || 'Failed to export contacts'
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
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts/bulk-update`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            contact_ids: contactIds,
            update_data: updateData
          }
        })

        if (response.success) {
          const updatedContacts = (response.data.contacts || []).map((c: any) => this.normalizeContact(c))
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
        this.error = error.data?.message || 'Failed to bulk update contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteContacts(contactIds: string[]) {
      this.loading = true
      this.error = null
      try {
        const config = useRuntimeConfig()
        const token = localStorage.getItem('auth_token') || useCookie('auth_token').value
        
        const response = await $fetch(`${config.public.apiBase}/contacts/bulk-delete`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: { contact_ids: contactIds }
        })

        if (response.success) {
          this.contacts = this.contacts.filter(c => !contactIds.includes(c.id))
          if (this.selectedContact && contactIds.includes(this.selectedContact.id)) {
            this.selectedContact = null
          }
          return { success: true, deleted_count: contactIds.length }
        }
      } catch (error: any) {
        console.error('Bulk delete contacts error:', error)
        this.error = error.data?.message || 'Failed to bulk delete contacts'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
}) 