<template>
  <!-- Profile page — Owner: Minyu Ji | Branch: feature/profile -->
  <div class="profile-page container">
    <div class="page-header fade-in">
      <h1>My Profile</h1>
      <p class="sub">View your account info and skin diary history.</p>
    </div>
    <div class="card placeholder-card fade-in">
      <h3>👤 Profile & Diary History</h3>
      <p>Implementation by Minyu Ji — see <code>GET /api/diary?bodyPart=&sortBy=</code></p>
      <br />
      <p>⚠️ Render notes with <code>v-text</code>, NOT <code>v-html</code> — stored XSS prevention</p>
    </div>
  </div>
</template>

<script setup>
// TODO: Minyu Ji — implement profile display and diary history with filters
</script>

<style scoped>
.profile-page {
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