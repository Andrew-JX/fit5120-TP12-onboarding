<template>
  <div class="spinner-wrap" :class="{ fullpage }">
    <div class="spinner" :style="{ width: size, height: size }"></div>
    <p v-if="message" class="spinner-msg">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: '36px' },
  message: { type: String, default: '' },
  fullpage: { type: Boolean, default: false },
})
</script>

<style scoped>
.spinner-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  padding: var(--space-xl);
}

.spinner-wrap.fullpage {
  min-height: 60vh;
}

.spinner {
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-msg {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
</style>