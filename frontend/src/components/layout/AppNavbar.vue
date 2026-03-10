<template>
  <nav class="navbar">
    <div class="navbar-inner container">
      <!-- Logo / Brand -->
      <RouterLink to="/dashboard" class="brand">
        <span class="brand-icon">☀️</span>
        <span class="brand-name">SunSafe</span>
      </RouterLink>

      <!-- Navigation links -->
      <ul class="nav-links">
        <li>
          <RouterLink to="/dashboard" :class="{ active: route.name === 'Dashboard' }">
            Dashboard
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/diary" :class="{ active: route.name === 'Diary' }">
            Diary
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/learn" :class="{ active: route.name === 'Learn' }">
            Learn
          </RouterLink>
        </li>
      </ul>

      <!-- User menu -->
      <div class="nav-user" @click="toggleDropdown" ref="dropdownRef">
        <div class="user-avatar">
          {{ userInitial }}
        </div>
        <span class="username">{{ auth.user?.displayName || auth.user?.username || 'User' }}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>

        <!-- Dropdown menu -->
        <div v-if="dropdownOpen" class="dropdown">
          <RouterLink to="/profile" class="dropdown-item" @click="dropdownOpen = false">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            My Profile
          </RouterLink>
          <button class="dropdown-item logout-btn" @click="handleLogout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const dropdownOpen = ref(false)
const dropdownRef = ref(null)

const userInitial = computed(() => {
  const name = auth.user?.displayName || auth.user?.username || 'U'
  return name.charAt(0).toUpperCase()
})

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    dropdownOpen.value = false
  }
}

async function handleLogout() {
  dropdownOpen.value = false
  await auth.logout()
  router.push('/')
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
  backdrop-filter: blur(10px);
}

.navbar-inner {
  height: 100%;
  display: flex;
  align-items: center;
  gap: var(--space-xl);
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  text-decoration: none;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.brand-name {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: -0.02em;
}

/* Nav links */
.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  list-style: none;
  flex: 1;
}

.nav-links a {
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius-sm);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.nav-links a:hover {
  color: var(--color-text-primary);
  background: var(--color-surface-2);
}

.nav-links a.active {
  color: var(--color-primary);
  background: rgba(232, 98, 42, 0.08);
}

/* User avatar / dropdown trigger */
.nav-user {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 0.375rem 0.75rem 0.375rem 0.375rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  position: relative;
  transition: background var(--transition-fast);
  border: 1px solid transparent;
}

.nav-user:hover {
  background: var(--color-surface-2);
  border-color: var(--color-border);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  font-family: var(--font-heading);
  flex-shrink: 0;
}

.username {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dropdown */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-xs);
  z-index: 200;
  animation: fadeIn 0.15s ease;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  color: var(--color-text-primary);
  text-decoration: none;
  transition: background var(--transition-fast);
  text-align: left;
  cursor: pointer;
  background: none;
  border: none;
  font-family: var(--font-body);
}

.dropdown-item:hover {
  background: var(--color-surface-2);
}

.logout-btn {
  color: var(--uv-very-high);
}

@media (max-width: 600px) {
  .username {
    display: none;
  }

  .nav-links a {
    padding: 0.375rem 0.5rem;
    font-size: 0.875rem;
  }
}
</style>