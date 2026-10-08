/**
 * PaintMatch — Service API pour l'administration.
 * Tous ces appels nécessitent le rôle ADMIN.
 */

import api from './api'

const adminService = {

  // --- Peintres ---
  getPainters: (params = {}) =>
    api.get('/admin-panel/painters/', { params }),

  getPainterDossier: (id) =>
    api.get(`/admin-panel/painters/${id}/`),

  validatePainter: (id, action, note = '') =>
    api.post(`/admin-panel/painters/${id}/validate/`, { action, note }),

  // --- Utilisateurs ---
  getUsers: (params = {}) =>
    api.get('/admin-panel/users/', { params }),

  getUser: (id) =>
    api.get(`/admin-panel/users/${id}/`),

  updateUser: (id, data) =>
    api.patch(`/admin-panel/users/${id}/`, data),

  toggleUserActive: (id) =>
    api.post(`/admin-panel/users/${id}/toggle-active/`),

  // --- Statistiques ---
  getStats: () =>
    api.get('/admin-panel/stats/'),

  // --- Journal ---
  getLogs: (params = {}) =>
    api.get('/admin-panel/logs/', { params }),

  // --- Paramètres ---
  getSettings: () =>
    api.get('/admin-panel/settings/'),

  updateSetting: (id, value) =>
    api.patch(`/admin-panel/settings/${id}/`, { value }),
}

export default adminService
