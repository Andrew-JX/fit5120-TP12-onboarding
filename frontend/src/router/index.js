// src/router/index.js
// Vue Router configuration with navigation guards.
// Unauthenticated users are redirected to / (Welcome/Login page).

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'Welcome',
    component: () => import('@/views/WelcomeView.vue'),
    meta: { requiresAuth: false, hideNav: true },
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/diary',
    name: 'Diary',
    component: () => import('@/views/DiaryView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/learn',
    name: 'Learn',
    component: () => import('@/views/LearnView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  // Catch-all — redirect to login
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// ── Navigation guard ──────────────────────────────────────────────
router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth) {
    // If not logged in, check server session before redirecting
    if (!auth.isLoggedIn) {
      await auth.checkSession()
    }
    if (!auth.isLoggedIn) {
      return { name: 'Welcome', query: { redirect: to.fullPath } }
    }
  }

  // If already logged in and hitting Welcome page, go to dashboard
  if (to.name === 'Welcome' && auth.isLoggedIn) {
    return { name: 'Dashboard' }
  }
})

export default router