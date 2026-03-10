<template>
  <!-- Learn page — Owner: Teammate | Branch: feature/learn -->
  <div class="learn-page container">
    <div class="page-header fade-in">
      <h1>Learn</h1>
      <p class="sub">Understand UV risks, skin types, and how to stay sun-safe.</p>
    </div>
    <div class="card placeholder-card fade-in">
      <h3>📰 Articles & Resources</h3>
      <p>Implementation by [teammate] — fetch from <code>GET /api/learn/articles</code></p>
    </div>
  </div>
</template>

<script setup>
// TODO: Teammate — implement article list and charts
</script>

<style scoped>
.learn-page {
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

.placeholder-card {
  border: 2px dashed var(--color-border);
}

.placeholder-card h3 {
  margin-bottom: var(--space-sm);
}

.placeholder-card p {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-family: monospace;
}

code {
  background: var(--color-surface-2);
  padding: 0.1em 0.35em;
  border-radius: 4px;
  font-size: 0.8em;
}
</style>