// src/stores/uv.js
// Pinia store — manages UV data and advice state.

import { defineStore } from 'pinia'
import api from '@/utils/api'

export const useUvStore = defineStore('uv', {
  state: () => ({
    currentUv: null,    // { uvIndex, advice, location, fetchedAt }
    uvHistory: [],      // array of { uv_index, location, logged_at }
    selectedCity: 'melbourne',
    loading: false,
    error: null,
  }),

  getters: {
    uvLevel: (state) => state.currentUv?.advice?.level || 'Unknown',
    uvColor: (state) => state.currentUv?.advice?.color || '#888',
    uvIndex: (state) => state.currentUv?.uvIndex ?? null,
  },

  actions: {
    async fetchCurrentUv(city = null) {
      const targetCity = city || this.selectedCity
      this.loading = true
      this.error = null
      try {
        const res = await api.get(`/api/uv/current?city=${targetCity}`)
        this.currentUv = res.data
        this.selectedCity = targetCity
      } catch (err) {
        this.error = err.response?.data?.error || 'Failed to fetch UV data.'
      } finally {
        this.loading = false
      }
    },

    async fetchUvHistory() {
      try {
        const res = await api.get('/api/uv/history')
        this.uvHistory = res.data
      } catch {
        this.uvHistory = []
      }
    },

    async logUv(city) {
      if (!this.currentUv) return
      try {
        await api.post('/api/uv/log', {
          uvIndex: this.currentUv.uvIndex,
          city: city || this.selectedCity,
        })
      } catch {
        // silent — logging is non-critical
      }
    },
  },
})