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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid redirect loop on the login page itself
      if (window.location.pathname !== '/') {
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export default api