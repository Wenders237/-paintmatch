import api from './api'

const reviewService = {
  createReview: (data) =>
    api.post('/reviews/', data),

  getMyReviews: () =>
    api.get('/reviews/my/'),

  getPainterReviews: (painterId) =>
    api.get(`/reviews/painter/${painterId}/`),

  getMyReceivedReviews: () =>
    api.get('/reviews/painter/me/'),

  replyToReview: (id, reply) =>
    api.post(`/reviews/${id}/reply/`, { painter_reply: reply }),

  checkReview: (bookingId) =>
    api.get(`/reviews/${bookingId}/check/`),
}

export default reviewService
