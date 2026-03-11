<template>
  <div class="dashboard-page container">
    <div class="page-header fade-in">
      <h1>Dashboard</h1>
      <p class="sub">Your UV safety overview for today.</p>
    </div>

    <div class="placeholder-grid">
      <div class="card placeholder-card fade-in">
        <h3>Current UV Index</h3>
        <p>Implement: call <code>uvStore.fetchCurrentUv()</code>, render <code>&lt;UvBadge&gt;</code></p>
      </div>
      <div class="card placeholder-card fade-in" style="animation-delay:0.1s">
        <h3>Protection Advice</h3>
        <p>Implement: display <code>uvStore.currentUv.advice</code> (clothing, SPF, activity)</p>
      </div>
      <div class="card placeholder-card fade-in" style="animation-delay:0.2s">
        <h3>UV Trend (7 days)</h3>
        <p>Implement: <code>vue-chartjs</code> LineChart using <code>uvStore.uvHistory</code></p>
      </div>
      <div class="card placeholder-card fade-in" style="animation-delay:0.3s">
        <h3>Cancer Incidence (AIHW)</h3>
        <p>Implement: <code>vue-chartjs</code> BarChart using <code>/api/learn/stats</code></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useUvStore } from '@/stores/uv'

const uvStore = useUvStore()

onMounted(() => {
  uvStore.fetchCurrentUv()
  uvStore.fetchUvHistory()
})
</script>

<style scoped>
.dashboard-page {
  padding-top: var(--space-2xl);
  padding-bottom: var(--space-2xl);
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: var(--space-xs);
}

.sub {
  color: var(--color-text-secondary);
}

.placeholder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-lg);
}

.placeholder-card {
  border: 2px dashed var(--color-border);
}

.placeholder-card h3 {
  font-size: 1rem;
  margin-bottom: var(--space-sm);
}

.placeholder-card p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-family: monospace;
  line-height: 1.5;
}

code {
  background: var(--color-surface-2);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  font-size: 0.8em;
}
</style>