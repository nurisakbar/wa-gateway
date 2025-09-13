export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    if (process.client) {
      // Create toast element
      const toast = document.createElement('div')
      toast.className = `toast toast-${type}`
      toast.innerHTML = `
        <div class="toast-content">
          <i class="bi bi-${getIcon(type)} me-2"></i>
          <span>${message}</span>
        </div>
      `

      // Add styles
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 16px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
      `

      // Set background color based on type
      const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
      }
      toast.style.backgroundColor = colors[type]

      // Add to page
      document.body.appendChild(toast)

      // Animate in
      setTimeout(() => {
        toast.style.transform = 'translateX(0)'
      }, 100)

      // Auto remove after 5 seconds
      setTimeout(() => {
        toast.style.transform = 'translateX(100%)'
        setTimeout(() => {
          if (document.body.contains(toast)) {
            document.body.removeChild(toast)
          }
        }, 300)
      }, 5000)
    }
  }

  const getIcon = (type: string) => {
    const icons = {
      success: 'check-circle',
      error: 'x-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    }
    return icons[type] || 'info-circle'
  }

  return {
    success: (message: string) => showToast(message, 'success'),
    error: (message: string) => showToast(message, 'error'),
    warning: (message: string) => showToast(message, 'warning'),
    info: (message: string) => showToast(message, 'info')
  }
} 