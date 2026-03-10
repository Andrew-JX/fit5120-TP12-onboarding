<template>
  <div class="welcome-page">
    <div class="login-card">
      <div class="brand">
        <span class="brand-icon">☀️</span>
        <h1 class="brand-name">SunSafe</h1>
        <p class="brand-tagline">UV Protection for Gen Z Australians</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-group">
          <label class="form-label" for="username">Username</label>
          <input id="username" v-model.trim="username" type="text" class="form-input"
            :class="{ error: errors.username }" maxlength="50" autocomplete="username" placeholder="Enter username" />
          <p v-if="errors.username" class="error-msg">{{ errors.username }}</p>
        </div>

        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input id="password" v-model="password" type="password" class="form-input" :class="{ error: errors.password }"
            maxlength="100" autocomplete="current-password" placeholder="Enter password" />
          <p v-if="errors.password" class="error-msg">{{ errors.password }}</p>
        </div>

        <p v-if="serverError" class="error-msg server-error">{{ serverError }}</p>

        <button type="submit" class="btn btn-primary login-btn" :disabled="auth.loading">
          <span v-if="auth.loading">Signing in…</span>
          <span v-else>Sign In</span>
        </button>
      </form>

      <p class="demo-hint">Demo: <code>demo / demo123</code></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const errors = ref({})
const serverError = ref('')

function validate() {
  const e = {}
  const u = username.value.trim()
  if (!u) e.username = 'Username is required.'
  else if (u.length > 50) e.username = 'Username too long.'
  // Basic XSS check — reject obvious script injection client-side
  else if (/<script|javascript:/i.test(u)) e.username = 'Invalid characters.'

  const p = password.value
  if (!p) e.password = 'Password is required.'
  else if (p.length > 100) e.password = 'Password too long.'

  errors.value = e
  return Object.keys(e).length === 0
}

async function handleLogin() {
  serverError.value = ''
  if (!validate()) return

  const result = await auth.login(username.value, password.value)
  if (result.success) {
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } else {
    // Uniform error — do not reveal if username or password was wrong
    serverError.value = result.message || 'Invalid credentials.'
    password.value = ''
  }
}
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff8f0 0%, #fef3e2 50%, #fff0e8 100%);
  padding: var(--space-xl);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-lg);
}

.brand {
  text-align: center;
  margin-bottom: var(--space-xl);
}

.brand-icon {
  font-size: 3rem;
  line-height: 1;
  display: block;
  margin-bottom: var(--space-sm);
}

.brand-name {
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -0.03em;
  margin-bottom: var(--space-xs);
}

.brand-tagline {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.login-btn {
  width: 100%;
  justify-content: center;
  padding: 0.75rem;
  font-size: 1rem;
  margin-top: var(--space-sm);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.server-error {
  text-align: center;
  font-size: 0.875rem;
}

.demo-hint {
  text-align: center;
  margin-top: var(--space-lg);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.demo-hint code {
  background: var(--color-surface-2);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.875em;
}
</style>