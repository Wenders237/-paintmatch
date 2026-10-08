/**
 * PaintMatch — Instance Axios centralisée.
 *
 * Gère automatiquement :
 * - Injection du token JWT dans chaque requête
 * - Renouvellement transparent du token expiré (refresh)
 * - Déconnexion automatique si le refresh échoue
 */

import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Endpoints publics qui ne nécessitent pas de token
const PUBLIC_ENDPOINTS = [
  '/services/categories/',
  '/services/skills/',
  '/marketplace/search/',
  '/auth/login/',
  '/auth/register/',
  '/auth/token/refresh/',
]

const isPublicEndpoint = (url = '') =>
  PUBLIC_ENDPOINTS.some(ep => url.includes(ep))

// ---------------------------------------------------------------------------
// Intercepteur de requête — ajoute le token Bearer sauf pour les endpoints publics
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token && !isPublicEndpoint(config.url)) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ---------------------------------------------------------------------------
// Intercepteur de réponse — gestion du refresh token sur 401
// ---------------------------------------------------------------------------
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Si 401 et que ce n'est pas déjà une tentative de refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/token/refresh/')
    ) {
      if (isRefreshing) {
        // Mettre en file d'attente les requêtes pendant le refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/auth/token/refresh/`,
          { refresh: refreshToken }
        )

        const newAccessToken = data.access
        useAuthStore.getState().setTokens(newAccessToken, data.refresh || refreshToken)
        processQueue(null, newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().logout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
