<template>
  <div class="welcome-page">

    <!-- ── Left panel — animated background + brand ── -->
    <div class="left-panel">

      <!-- Canvas: animated sun ray beams -->
      <canvas ref="canvasRef" class="ray-canvas" aria-hidden="true"></canvas>

      <!-- Floating UV stat bubbles -->
      <div class="stat-bubble bubble-1">
        <span class="bubble-num">UV 11+</span>
        <span class="bubble-label">EXTREME</span>
      </div>
      <div class="stat-bubble bubble-2">
        <span class="bubble-num">2 in 3</span>
        <span class="bubble-label">Australians get skin cancer</span>
      </div>
      <div class="stat-bubble bubble-3">
        <span class="bubble-num">SPF 50+</span>
        <span class="bubble-label">Required today</span>
      </div>

      <div class="left-inner">
        <!-- Brand -->
        <div class="brand">
          <div class="sun-mark">
            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" class="sun-svg">
              <g stroke="rgba(245,200,66,0.9)" stroke-width="2.5" stroke-linecap="round">
                <line x1="40" y1="6" x2="40" y2="16" />
                <line x1="40" y1="64" x2="40" y2="74" />
                <line x1="6" y1="40" x2="16" y2="40" />
                <line x1="64" y1="40" x2="74" y2="40" />
                <line x1="14.6" y1="14.6" x2="21.7" y2="21.7" />
                <line x1="58.3" y1="58.3" x2="65.4" y2="65.4" />
                <line x1="65.4" y1="14.6" x2="58.3" y2="21.7" />
                <line x1="21.7" y1="58.3" x2="14.6" y2="65.4" />
              </g>
              <circle cx="40" cy="40" r="18" stroke="rgba(245,200,66,0.35)" stroke-width="1.5" />
              <circle cx="40" cy="40" r="12" fill="#f5c842" />
              <circle cx="36" cy="36" r="3.5" fill="rgba(255,255,255,0.55)" />
            </svg>
          </div>
          <h1 class="brand-name">SunSafe</h1>
          <p class="brand-tagline">Know your UV. Protect your skin.</p>
        </div>

        <!-- Fact cards -->
        <div class="fact-cards">
          <div class="fact-card" v-for="(fact, i) in facts" :key="i"
            :style="{ animationDelay: (i * 0.14 + 0.2) + 's' }">
            <span class="fact-icon">{{ fact.icon }}</span>
            <p class="fact-text">{{ fact.text }}</p>
          </div>
        </div>

        <p class="data-credit">Data: AIHW · ABS · OpenWeatherMap</p>
      </div>
    </div>

    <!-- ── Right panel — login form ── -->
    <div class="right-panel">
      <div class="login-card fade-in">

        <div class="card-header">
          <span class="card-eyebrow">Welcome back</span>
          <h2>Sign in</h2>
          <p>Your personalised UV safety dashboard awaits.</p>
        </div>

        <form @submit.prevent="handleLogin" novalidate>
          <div class="form-group">
            <label class="form-label" for="username">Username</label>
            <input id="username" v-model.trim="username" type="text" class="form-input"
              :class="{ error: errors.username }" maxlength="50" autocomplete="username" placeholder="e.g. demo"
              @input="clearFieldError('username')" />
            <p v-if="errors.username" class="error-msg" role="alert">{{ errors.username }}</p>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="password-wrap">
              <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" class="form-input"
                :class="{ error: errors.password }" maxlength="100" autocomplete="current-password"
                placeholder="Enter password" @input="clearFieldError('password')" />
              <button type="button" class="toggle-pw" :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword">{{ showPassword ? '🙈' : '👁️' }}</button>
            </div>
            <p v-if="errors.password" class="error-msg" role="alert">{{ errors.password }}</p>
          </div>

          <div v-if="serverError" class="alert-error" role="alert">
            <span>⚠️</span>
            <span>{{ serverError }}</span>
          </div>

          <button type="submit" class="btn btn-primary login-btn" :disabled="auth.loading" :aria-busy="auth.loading">
            <span v-if="auth.loading" class="btn-spinner"></span>
            <span>{{ auth.loading ? 'Signing in…' : 'Sign In' }}</span>
          </button>
        </form>

        <div class="divider"><span>demo accounts</span></div>

        <div class="demo-accounts">
          <button v-for="acc in demoAccounts" :key="acc.username" type="button" class="demo-btn" @click="fillDemo(acc)">
            <span class="demo-user">{{ acc.username }}</span>
            <span class="demo-arrow">→</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const errors = ref({})
const serverError = ref('')
const canvasRef = ref(null)

const facts = [
  { icon: '🦠', text: '2 in 3 Australians will be diagnosed with skin cancer by age 70.' },
  { icon: '📱', text: 'Social media tanning trends are increasing UV risk in Gen Z.' },
  { icon: '🌡️', text: 'UV can be extreme even on cloudy days — numbers don\'t lie.' },
]

const demoAccounts = [
  { username: 'demo', password: 'demo123' },
  { username: 'admin', password: 'admin123' },
]

// ── Canvas animated sun rays ──────────────────────────────────────
let animId = null

function initCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')

  function resize() {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const rays = Array.from({ length: 18 }, (_, i) => ({
    angle: (i / 18) * Math.PI * 2,
    speed: 0.0003 + Math.random() * 0.0002,
    length: 0.55 + Math.random() * 0.35,
    width: 60 + Math.random() * 80,
    phase: Math.random() * Math.PI * 2,
  }))

  let t = 0

  function draw() {
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const ox = W * 0.18
    const oy = H * 0.22

    for (const ray of rays) {
      const angle = ray.angle + t * ray.speed
      const len = (Math.min(W, H) * ray.length) * (0.85 + 0.15 * Math.sin(t * 0.5 + ray.phase))
      const ex = ox + Math.cos(angle) * len
      const ey = oy + Math.sin(angle) * len

      const grad = ctx.createLinearGradient(ox, oy, ex, ey)
      grad.addColorStop(0, 'rgba(245,200,66,0.18)')
      grad.addColorStop(0.4, 'rgba(232,98,42,0.09)')
      grad.addColorStop(1, 'rgba(232,98,42,0)')

      const hw = ray.width / 2
      const perpX = -Math.sin(angle) * hw
      const perpY = Math.cos(angle) * hw

      ctx.beginPath()
      ctx.moveTo(ox + perpX, oy + perpY)
      ctx.lineTo(ex, ey)
      ctx.lineTo(ox - perpX, oy - perpY)
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
    }

    // Core glow
    const coreGrad = ctx.createRadialGradient(ox, oy, 0, ox, oy, W * 0.28)
    coreGrad.addColorStop(0, 'rgba(245,200,66,0.22)')
    coreGrad.addColorStop(0.5, 'rgba(232,98,42,0.08)')
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(ox, oy, W * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = coreGrad
    ctx.fill()

    t++
    animId = requestAnimationFrame(draw)
  }

  draw()

  return () => {
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(animId)
  }
}

let cleanupCanvas = null
onMounted(() => { cleanupCanvas = initCanvas() })
onUnmounted(() => { if (cleanupCanvas) cleanupCanvas() })

// ── Validation ────────────────────────────────────────────────────
function validate() {
  const e = {}
  const u = username.value.trim()
  if (!u) {
    e.username = 'Username is required.'
  } else if (u.length > 50) {
    e.username = 'Username must be 50 characters or fewer.'
  } else if (/<script|javascript:/i.test(u)) {
    e.username = 'Invalid characters in username.'
  }
  const p = password.value
  if (!p) {
    e.password = 'Password is required.'
  } else if (p.length > 100) {
    e.password = 'Password too long.'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

function clearFieldError(field) {
  if (errors.value[field]) {
    errors.value = { ...errors.value, [field]: undefined }
  }
}

// ── Login ─────────────────────────────────────────────────────────
async function handleLogin() {
  serverError.value = ''
  if (!validate()) return
  const result = await auth.login(username.value, password.value)
  if (result.success) {
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } else {
    serverError.value = 'Invalid credentials. Please try again.'
    password.value = ''
  }
}

function fillDemo(acc) {
  username.value = acc.username
  password.value = acc.password
  errors.value = {}
  serverError.value = ''
}
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────── */
.welcome-page {
  min-height: 100vh;
  display: flex;
}

/* ── Left panel ──────────────────────────────────────────────────── */
.left-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #0f0a04 0%, #1e1005 30%, #2e1508 60%, #1a0c05 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
}

.ray-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Floating stat bubbles */
.stat-bubble {
  position: absolute;
  background: rgba(245, 200, 66, 0.07);
  border: 1px solid rgba(245, 200, 66, 0.18);
  border-radius: var(--radius-xl);
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(8px);
  pointer-events: none;
  z-index: 2;
}

.bubble-1 {
  top: 12%;
  right: 10%;
  animation: float 7s ease-in-out infinite;
}

.bubble-2 {
  bottom: 22%;
  right: 6%;
  animation: float 9s ease-in-out infinite 2s;
}

.bubble-3 {
  bottom: 10%;
  left: 12%;
  animation: float 8s ease-in-out infinite 4s;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-10px);
  }
}

.bubble-num {
  font-family: var(--font-heading);
  font-size: 1rem;
  font-weight: 800;
  color: #f5c842;
  line-height: 1;
}

.bubble-label {
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 2px;
  text-align: center;
}

/* Inner content */
.left-inner {
  position: relative;
  z-index: 3;
  max-width: 400px;
  width: 100%;
}

/* Brand */
.brand {
  margin-bottom: var(--space-2xl);
}

.sun-mark {
  margin-bottom: var(--space-md);
}

.sun-svg {
  width: 64px;
  height: 64px;
  animation: spin-slow 24s linear infinite;
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.brand-name {
  font-family: var(--font-heading);
  font-size: 3.5rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.05em;
  line-height: 0.95;
  margin-bottom: var(--space-sm);
}

.brand-tagline {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 300;
}

/* Fact cards */
.fact-cards {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  margin-bottom: var(--space-xl);
}

.fact-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-left: 2px solid rgba(245, 200, 66, 0.5);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 0.75rem var(--space-md);
  animation: slideInLeft 0.5s ease both;
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.fact-icon {
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
}

.fact-text {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.data-credit {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.18);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── Right panel ─────────────────────────────────────────────────── */
.right-panel {
  width: 460px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: var(--space-2xl) var(--space-xl);
  position: relative;
}

/* Warm vertical accent line at the split */
.right-panel::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom,
      transparent,
      rgba(232, 98, 42, 0.35) 30%,
      rgba(245, 200, 66, 0.45) 50%,
      rgba(232, 98, 42, 0.35) 70%,
      transparent);
}

.login-card {
  width: 100%;
  max-width: 360px;
}

/* Card header */
.card-header {
  margin-bottom: var(--space-xl);
}

.card-eyebrow {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin-bottom: var(--space-xs);
}

.card-header h2 {
  font-family: var(--font-heading);
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: var(--space-xs);
}

.card-header p {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Form */
form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form-group {
  display: flex;
  flex-direction: column;
}

.password-wrap {
  position: relative;
}

.password-wrap .form-input {
  padding-right: 2.75rem;
}

.toggle-pw {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-muted);
  transition: color var(--transition-fast);
}

.toggle-pw:hover {
  color: var(--color-text-primary);
}

.alert-error {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  background: #fff1f0;
  border: 1px solid #ffa39e;
  border-radius: var(--radius-sm);
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  color: #cf1322;
}

/* Login button — gradient with lift */
.login-btn {
  width: 100%;
  justify-content: center;
  padding: 0.875rem;
  font-size: 1rem;
  font-weight: 600;
  margin-top: var(--space-xs);
  gap: var(--space-sm);
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, #e8622a 0%, #c44e1e 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(232, 98, 42, 0.3);
  transition: all var(--transition-fast);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(232, 98, 42, 0.42);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Divider */
.divider {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin: var(--space-lg) 0 var(--space-md);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

/* Demo buttons */
.demo-accounts {
  display: flex;
  gap: var(--space-sm);
}

.demo-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.875rem;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-body);
}

.demo-btn:hover {
  border-color: var(--color-primary);
  background: rgba(232, 98, 42, 0.04);
}

.demo-user {
  font-size: 0.875rem;
  font-weight: 500;
  font-family: monospace;
}

.demo-arrow {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  transition: transform var(--transition-fast), color var(--transition-fast);
}

.demo-btn:hover .demo-arrow {
  transform: translateX(4px);
  color: var(--color-primary);
}

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .welcome-page {
    flex-direction: column;
  }

  .left-panel {
    padding: var(--space-xl) var(--space-lg);
    min-height: 45vh;
  }

  .brand-name {
    font-size: 2.5rem;
  }

  .stat-bubble {
    display: none;
  }

  .right-panel {
    width: 100%;
    padding: var(--space-xl) var(--space-lg);
  }

  .right-panel::before {
    display: none;
  }
}
</style>