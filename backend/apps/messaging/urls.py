from django.urls import path
from .views import (
    ConversationListView, ConversationDetailView,
    SendMessageView, StartConversationView, MarkReadView,
)

urlpatterns = [
    path('conversations/',                          ConversationListView.as_view(),    name='conversation-list'),
    path('conversations/start/',                    StartConversationView.as_view(),   name='conversation-start'),
    path('conversations/<uuid:pk>/',                ConversationDetailView.as_view(),  name='conversation-detail'),
    path('conversations/<uuid:pk>/send/',           SendMessageView.as_view(),         name='message-send'),
    path('conversations/<uuid:pk>/read/',           MarkReadView.as_view(),            name='message-read'),
]
