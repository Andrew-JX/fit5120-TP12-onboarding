<template>
  <!-- Displays a coloured UV Index badge with level label -->
  <div class="uv-badge" :style="{ '--uv-color': color }">
    <span class="uv-emoji">{{ emoji }}</span>
    <div class="uv-info">
      <span class="uv-number">{{ index !== null ? index.toFixed(1) : '—' }}</span>
      <span class="uv-level">{{ level }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  index: { type: Number, default: null },
  level: { type: String, default: 'Unknown' },
  color: { type: String, default: '#888' },
  emoji: { type: String, default: '☀️' },
})
</script>

<style scoped>
.uv-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: color-mix(in srgb, var(--uv-color) 12%, white);
  border: 2px solid var(--uv-color);
  border-radius: var(--radius-md);
}

.uv-emoji {
  font-size: 1.75rem;
  line-height: 1;
}

.uv-info {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.uv-number {
  font-family: var(--font-heading);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--uv-color);
  line-height: 1;
}

.uv-level {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--uv-color);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>