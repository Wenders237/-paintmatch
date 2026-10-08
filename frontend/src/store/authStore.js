/**
 * PaintMatch — Store Zustand pour l'authentification.
 *
 * Persiste les tokens et les infos utilisateur dans localStorage.
 * Exposé globalement pour être accessible depuis l'intercepteur Axios.
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // --- État ---
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // --- Actions ---

      /**
       * Appelé après une connexion ou une inscription réussie.
       */
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      /**
       * Met à jour uniquement les tokens (après un refresh).
       */
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken })
      },

      /**
       * Met à jour les informations de l'utilisateur connecté.
       */
      setUser: (user) => {
        set({ user })
      },

      /**
       * Déconnexion — supprime toutes les données de session
       * et nettoie complètement le localStorage.
       */
      logout: () => {
        // Nettoyage complet du store
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
        // Supprime explicitement la clé persistée
        localStorage.removeItem('paintmatch-auth')
      },

      // --- Sélecteurs calculés ---
      isClient:  () => get().user?.role === 'CLIENT',
      isPeintre: () => get().user?.role === 'PEINTRE',
      isAdmin:   () => get().user?.role === 'ADMIN',

      isPainterValidated: () =>
        get().user?.role === 'PEINTRE' &&
        get().user?.validation_status === 'VALIDE',
    }),
    {
      name: 'paintmatch-auth',          // clé dans localStorage
      storage: createJSONStorage(() => localStorage),
      // Ne persister que le strict nécessaire
      partialize: (state) => ({
        user:          state.user,
        accessToken:   state.accessToken,
        refreshToken:  state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
