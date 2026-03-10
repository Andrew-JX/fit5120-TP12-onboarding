// src/utils/api.js
// Centralised Axios instance.
// All API calls go through here — handles base URL, credentials, and errors.

import axios from 'axios'

const api = axios.create({
  // In dev: Vite proxy rewrites /api → http://localhost:3000/api
  // In prod: set VITE_API_URL=https://your-backend.onrender.com in Vercel env vars
  baseURL: import.meta.env.VITE_API_URL || '',
  withCredentials: true,  // required for session cookies (cross-origin)
  timeout: 15000,
})

// Response interceptor — redirect to login on 401
// NOTE: /api/auth/me is excluded so checkSession() can fail silently on first load
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const is401 = error.response?.status === 401
    const isCheckSession = url.includes('/auth/me')
    const onLoginPage = window.location.pathname === '/'

    if (is401 && !isCheckSession && !onLoginPage) {
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default api