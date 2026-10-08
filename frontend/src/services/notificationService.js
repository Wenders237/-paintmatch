import api from './api'

const notificationService = {
  getNotifications: () =>
    api.get('/notifications/'),

  getUnreadCount: () =>
    api.get('/notifications/unread-count/'),

  markAllRead: () =>
    api.post('/notifications/mark-all-read/'),

  markRead: (id) =>
    api.post(`/notifications/${id}/read/`),
}

export default notificationService
