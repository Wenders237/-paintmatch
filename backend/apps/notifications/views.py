from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ — Mes notifications."""
    permission_classes = [IsAuthenticated]
    serializer_class   = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')[:50]


class UnreadCountView(APIView):
    """GET /api/notifications/unread-count/ — Nombre de notifications non lues."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).count()
        return Response({'unread_count': count})


class MarkAllReadView(APIView):
    """POST /api/notifications/mark-all-read/ — Marquer tout comme lu."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'marked_read': updated})


class MarkReadView(APIView):
    """POST /api/notifications/<id>/read/ — Marquer une notification comme lue."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notif = Notification.objects.filter(
            id=pk, recipient=request.user
        ).first()
        if notif:
            notif.is_read = True
            notif.save()
        return Response({'success': True})
