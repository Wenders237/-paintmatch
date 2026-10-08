/**
 * PaintMatch — Service d'authentification.
 * Encapsule tous les appels API liés à l'authentification et aux profils.
 */

import api from './api'

const authService = {
  /**
   * Inscription d'un nouvel utilisateur (client ou peintre).
   */
  register: (data) => api.post('/auth/register/', data),

  /**
   * Connexion — retourne access + refresh tokens et les infos utilisateur.
   */
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),

  /**
   * Déconnexion — invalide le refresh token côté serveur.
   */
  logout: (refreshToken) =>
    api.post('/auth/logout/', { refresh: refreshToken }),

  /**
   * Renouvellement du token d'accès.
   */
  refreshToken: (refresh) =>
    api.post('/auth/token/refresh/', { refresh }),

  /**
   * Récupération du profil de l'utilisateur connecté.
   */
  getMe: () => api.get('/auth/me/'),

  /**
   * Mise à jour des informations personnelles.
   */
  updateMe: (data) => api.patch('/auth/me/', data),

  /**
   * Changement de mot de passe.
   */
  changePassword: (data) => api.post('/auth/change-password/', data),

  /**
   * Profil client (lecture / modification).
   */
  getClientProfile: () => api.get('/profiles/client/me/'),
  updateClientProfile: (data) => api.patch('/profiles/client/me/', data),

  /**
   * Profil peintre (lecture / modification).
   */
  getPainterProfile: () => api.get('/profiles/painter/me/'),
  updatePainterProfile: (data) => api.patch('/profiles/painter/me/', data),
}

export default authService
