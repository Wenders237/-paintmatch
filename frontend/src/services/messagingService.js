import api from './api'

const messagingService = {
  getConversations: () =>
    api.get('/messaging/conversations/'),

  getConversation: (id) =>
    api.get(`/messaging/conversations/${id}/`),

  startConversation: (painterId) =>
    api.post('/messaging/conversations/start/', { painter_id: painterId }),

  sendMessage: (conversationId, content) =>
    api.post(`/messaging/conversations/${conversationId}/send/`, { content }),

  markRead: (conversationId) =>
    api.post(`/messaging/conversations/${conversationId}/read/`),
}

export default messagingService
