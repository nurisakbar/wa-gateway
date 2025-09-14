export const useSubscriptionAlert = () => {
  const { $toast } = useNuxtApp()
  const authStore = useAuthStore()

  const showSubscriptionRequiredAlert = () => {
    // Show a prominent toast notification
    $toast.warning({
      title: 'Langganan Diperlukan',
      message: 'Silakan berlangganan untuk menggunakan semua fitur KlikWhatsApp!',
      duration: 8000,
      action: {
        text: 'Pilih Paket',
        onClick: () => {
          navigateTo('/subscriptions')
        }
      }
    })
  }

  const showSubscriptionExpiredAlert = () => {
    $toast.error({
      title: 'Langganan Kedaluwarsa',
      message: 'Langganan Anda telah kedaluwarsa. Silakan perpanjang untuk melanjutkan menggunakan fitur.',
      duration: 10000,
      action: {
        text: 'Perpanjang Sekarang',
        onClick: () => {
          navigateTo('/subscriptions')
        }
      }
    })
  }

  const checkAndShowSubscriptionAlert = () => {
    const user = authStore.getUser
    const hasSubscription = authStore.hasSubscription

    // Skip for admin users
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      return
    }

    // Show alert if no active subscription
    if (user && !hasSubscription) {
      showSubscriptionRequiredAlert()
    }
  }

  return {
    showSubscriptionRequiredAlert,
    showSubscriptionExpiredAlert,
    checkAndShowSubscriptionAlert
  }
}
