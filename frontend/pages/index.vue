<template>
  <div class="loading-container">
    <div class="text-center">
      <div class="loading-spinner"></div>
      <p class="mt-3">Loading...</p>
    </div>
  </div>
</template>

<script setup>
// Redirect to dashboard
onMounted(() => {
  navigateTo('/dashboard')
})
</script>

<style scoped>
.loading-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style> 