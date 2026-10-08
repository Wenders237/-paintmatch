import api from './api'

const transactionService = {

  // --- Demandes de devis (client) ---
  createQuoteRequest: (data) =>
    api.post('/transactions/quote-requests/', data),

  getMyQuoteRequests: () =>
    api.get('/transactions/quote-requests/'),

  getQuoteRequest: (id) =>
    api.get(`/transactions/quote-requests/${id}/`),

  cancelQuoteRequest: (id) =>
    api.delete(`/transactions/quote-requests/${id}/`),

  // --- Demandes de devis (peintre) ---
  getPainterQuoteRequests: () =>
    api.get('/transactions/quote-requests/painter/'),

  // --- Devis (peintre) ---
  createQuote: (data) =>
    api.post('/transactions/quotes/', data),

  updateQuote: (id, data) =>
    api.patch(`/transactions/quotes/${id}/`, data),

  deleteQuote: (id) =>
    api.delete(`/transactions/quotes/${id}/`),

  sendQuote: (id) =>
    api.post(`/transactions/quotes/${id}/send/`),

  getAIAssist: (quoteRequestId) =>
    api.post('/transactions/ai-assist/', { quote_request_id: quoteRequestId }),

  // --- Devis (client) ---
  getMyQuotes: () =>
    api.get('/transactions/quotes/client/'),

  getQuote: (id) =>
    api.get(`/transactions/quotes/${id}/client/`),

  respondQuote: (id, action, note = '') =>
    api.post(`/transactions/quotes/${id}/respond/`, { action, note }),

  // --- Réservations ---
  getClientBookings: () =>
    api.get('/transactions/bookings/client/'),

  getPainterBookings: () =>
    api.get('/transactions/bookings/painter/'),

  // --- Détail réservation ---
  getBooking: (id) =>
    api.get(`/transactions/bookings/${id}/`),

  // --- Actions peintre ---
  painterBookingAction: (id, action) =>
    api.post(`/transactions/bookings/${id}/action/`, { action }),

  // --- Actions client ---
  clientBookingAction: (id, action) =>
    api.post(`/transactions/bookings/${id}/client-action/`, { action }),

  // --- Suivi travaux ---
  addWorkProgress: (bookingId, data) =>
    api.post(`/transactions/bookings/${bookingId}/progress/`, data, {
      headers: data instanceof FormData
        ? { 'Content-Type': 'multipart/form-data' }
        : { 'Content-Type': 'application/json' },
    }),

  // --- Réactions aux étapes ---
  addProgressReaction: (progressId, formData) =>
    api.post(`/transactions/progress/${progressId}/react/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // --- Paiements ---
  initiatePayment: (bookingId, data) =>
    api.post(`/transactions/bookings/${bookingId}/pay/`, data),

  getPaymentHistory: (bookingId) =>
    api.get(`/transactions/bookings/${bookingId}/payments/`),
}

export default transactionService
