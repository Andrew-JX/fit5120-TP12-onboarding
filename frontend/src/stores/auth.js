// src/stores/auth.js
// Pinia store — manages authentication state across the app.
// Persists user info in memory (no localStorage).

import { defineStore } from 'pinia'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,        // { id, username, displayName }
    isLoggedIn: false,
    loading: false,
  }),

  actions: {
    async login(username, password) {
      this.loading = true
      try {
        const res = await api.post('/api/auth/login', { username, password })
        this.user = res.data.user
        this.isLoggedIn = true
        return { success: true }
      } catch (err) {
        const message = err.response?.data?.error || 'Login failed. Please try again.'
        return { success: false, message }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await api.post('/api/auth/logout')
      } catch {
        // ignore errors on logout
      } finally {
        this.user = null
        this.isLoggedIn = false
      }
    },

    // Check if session is still active (call on app mount)
    async checkSession() {
      try {
        const res = await api.get('/api/auth/me')
        this.user = res.data
        this.isLoggedIn = true
      } catch {
        this.user = null
        this.isLoggedIn = false
      }
    },
  },
})