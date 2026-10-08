/**
 * PaintMatch — Service API pour les compétences, qualifications,
 * portfolio, documents professionnels et offres de services.
 */

import api from './api'

const servicesService = {

  // --- Données publiques ---
  getCategories: () =>
    api.get('/services/categories/'),

  getSkills: (categoryId) =>
    api.get('/services/skills/', { params: categoryId ? { category: categoryId } : {} }),

  getPainterPublicProfile: (painterId) =>
    api.get(`/services/painters/${painterId}/profile/`),

  // --- Compétences du peintre connecté ---
  getMySkills: () =>
    api.get('/services/my/skills/'),

  addSkill: (data) =>
    api.post('/services/my/skills/', data),

  deleteSkill: (id) =>
    api.delete(`/services/my/skills/${id}/`),

  // --- Qualifications ---
  getMyQualifications: () =>
    api.get('/services/my/qualifications/'),

  addQualification: (data) =>
    api.post('/services/my/qualifications/', data),

  updateQualification: (id, data) =>
    api.patch(`/services/my/qualifications/${id}/`, data),

  deleteQualification: (id) =>
    api.delete(`/services/my/qualifications/${id}/`),

  // --- Documents professionnels ---
  getMyDocuments: () =>
    api.get('/services/my/documents/'),

  uploadDocument: (formData) =>
    api.post('/services/my/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteDocument: (id) =>
    api.delete(`/services/my/documents/${id}/`),

  // --- Portfolio ---
  getMyPortfolio: () =>
    api.get('/services/my/portfolio/'),

  addPortfolioItem: (data) =>
    api.post('/services/my/portfolio/', data),

  updatePortfolioItem: (id, data) =>
    api.patch(`/services/my/portfolio/${id}/`, data),

  deletePortfolioItem: (id) =>
    api.delete(`/services/my/portfolio/${id}/`),

  uploadPortfolioImage: (portfolioId, formData) =>
    api.post(`/services/my/portfolio/${portfolioId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deletePortfolioImage: (imageId) =>
    api.delete(`/services/my/portfolio/images/${imageId}/`),

  // --- Offres de services ---
  getMyOffers: () =>
    api.get('/services/my/offers/'),

  addOffer: (data) =>
    api.post('/services/my/offers/', data),

  updateOffer: (id, data) =>
    api.patch(`/services/my/offers/${id}/`, data),

  deleteOffer: (id) =>
    api.delete(`/services/my/offers/${id}/`),

  // --- Recherche et recommandation ---
  searchPainters: (params = {}) =>
    api.get('/marketplace/search/', { params }),
  getMyAvailabilities: () =>
    api.get('/marketplace/my/availabilities/'),

  addAvailability: (data) =>
    api.post('/marketplace/my/availabilities/', data),

  updateAvailability: (id, data) =>
    api.patch(`/marketplace/my/availabilities/${id}/`, data),

  deleteAvailability: (id) =>
    api.delete(`/marketplace/my/availabilities/${id}/`),
}

export default servicesService
