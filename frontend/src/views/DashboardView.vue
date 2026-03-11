<template>
  <!-- Dashboard page — Owner: [teammate] | Branch: feature/dashboard -->
  <div class="dashboard-page container">
    <div class="page-header fade-in">
      <h1>Dashboard</h1>
      <p class="sub">Your UV safety overview for today.</p>
    </div>

    <div class="placeholder-grid">
      <div class="card placeholder-card fade-in">
        <h3>Current UV Index</h3>
        <p>Call <code>uvStore.fetchCurrentUv(city)</code> → render <code>&lt;UvBadge&gt;</code></p>
        <p>API: <code>GET /api/uv/current?city=melbourne</code></p>
      </div>
      <div class="card placeholder-card fade-in">
        <h3>Protection Advice</h3>
        <p>Display <code>uvStore.currentUv.advice</code> (clothing, SPF, activity, timeWarning)</p>
      </div>
      <div class="card placeholder-card fade-in">
        <h3>City Selector</h3>
        <p>API: <code>GET /api/uv/locations</code> → dropdown to switch city</p>
      </div>
      <div class="card placeholder-card fade-in">
        <h3>UV Trend (7 days)</h3>
        <p>API: <code>GET /api/uv/history</code> (auth required) → Line chart via Chart.js</p>
      </div>
      <div class="card placeholder-card fade-in">
        <h3>Cancer Incidence (AIHW)</h3>
        <p>API: <code>GET /api/learn/stats</code> → <code>incidenceTrend</code> array → Bar chart</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// TODO: feature/dashboard teammate — implement this view
// Available stores (import and use directly, no need to write new API calls):
//   import { useUvStore } from '@/stores/uv'
//   const uvStore = useUvStore()
//   uvStore.fetchCurrentUv('melbourne')   — fetches + caches UV for a city
//   uvStore.fetchUvHistory()              — fetches last 7 days of UV logs
//   uvStore.currentUv                     — { uvIndex, location, advice: { level, color, emoji, clothing, spf, activity, timeWarning, alert } }
//   uvStore.uvHistory                     — array of { uv_index, location, logged_at }
//
// For stats chart call api directly:
//   import api from '@/utils/api'
//   const res = await api.get('/api/learn/stats')
//   res.data.incidenceTrend               — [{ year, cancer_type, incidence_rate }]
</script>

<style scoped>
.dashboard-page {
  padding-top: calc(var(--nav-height) + var(--space-xl));
  padding-bottom: var(--space-2xl);
}

.page-header {
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  font-family: var(--font-heading);
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
  font-size: 0.8rem;
  color: var(--color-text-muted);
  font-family: monospace;
  line-height: 1.6;
  margin-bottom: 0.25rem;
}

code {
  background: var(--color-surface-2);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}
</style>