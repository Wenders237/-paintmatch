"""
PaintMatch — Vues messagerie.

Endpoints :
  GET    /api/messaging/conversations/              → Liste mes conversations
  GET    /api/messaging/conversations/<id>/         → Détail + messages
  POST   /api/messaging/conversations/<id>/send/    → Envoyer un message
  POST   /api/messaging/conversations/<id>/read/    → Marquer messages comme lus
  POST   /api/messaging/conversations/start/        → Démarrer une conversation avec un peintre
"""

import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.accounts.models import PainterProfile
from .models import Conversation, Message
from .serializers import (
    ConversationListSerializer,
    ConversationDetailSerializer,
    SendMessageSerializer,
)

logger = logging.getLogger('paintmatch')


class ConversationListView(generics.ListAPIView):
    """
    GET /api/messaging/conversations/
    Liste les conversations de l'utilisateur connecté (client ou peintre).
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ConversationListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CLIENT':
            return Conversation.objects.filter(
                client=user
            ).prefetch_related('messages').select_related(
                'painter__user', 'client'
            ).order_by('-updated_at')
        elif user.role == 'PEINTRE':
            return Conversation.objects.filter(
                painter=user.painter_profile
            ).prefetch_related('messages').select_related(
                'painter__user', 'client'
            ).order_by('-updated_at')
        return Conversation.objects.none()


class ConversationDetailView(generics.RetrieveAPIView):
    """
    GET /api/messaging/conversations/<id>/
    Détail d'une conversation avec tous ses messages.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = ConversationDetailSerializer

    def get_object(self):
        user = self.request.user
        conv_id = self.kwargs['pk']

        if user.role == 'CLIENT':
            conv = get_object_or_404(Conversation, id=conv_id, client=user)
        elif user.role == 'PEINTRE':
            conv = get_object_or_404(Conversation, id=conv_id, painter=user.painter_profile)
        else:
            # Admin peut voir toutes les conversations
            conv = get_object_or_404(Conversation, id=conv_id)

        # Marquer les messages reçus comme lus automatiquement
        conv.messages.filter(is_read=False).exclude(sender=user).update(is_read=True)
        return conv


class SendMessageView(APIView):
    """
    POST /api/messaging/conversations/<id>/send/
    Envoie un message dans une conversation existante.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user

        # Vérifier l'accès à la conversation
        if user.role == 'CLIENT':
            conv = get_object_or_404(Conversation, id=pk, client=user)
        elif user.role == 'PEINTRE':
            conv = get_object_or_404(Conversation, id=pk, painter=user.painter_profile)
        else:
            return Response({'error': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            conversation=conv,
            sender=user,
            content=serializer.validated_data['content'],
        )

        # Mettre à jour la date de la conversation
        conv.save()  # updated_at se met à jour automatiquement

        # Notifier le destinataire
        try:
            from apps.notifications.service import notify_new_message
            notify_new_message(message)
        except Exception as e:
            logger.error(f'Notification message : {e}')

        return Response({
            'id':         str(message.id),
            'content':    message.content,
            'created_at': message.created_at,
            'is_mine':    True,
        }, status=status.HTTP_201_CREATED)


class StartConversationView(APIView):
    """
    POST /api/messaging/conversations/start/
    Démarre une conversation avec un peintre (ou récupère la conversation existante).
    Réservé aux clients.
    Body : { painter_id: <int> }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.role != 'CLIENT':
            return Response(
                {'error': 'Seuls les clients peuvent initier une conversation.'},
                status=status.HTTP_403_FORBIDDEN
            )

        painter_id = request.data.get('painter_id')
        if not painter_id:
            return Response(
                {'error': 'painter_id est requis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        painter = get_object_or_404(
            PainterProfile,
            id=painter_id,
            validation_status='VALIDE',
            user__is_active=True,
        )

        # Récupérer ou créer la conversation
        conv, created = Conversation.objects.get_or_create(
            client=user,
            painter=painter,
        )

        serializer = ConversationListSerializer(conv, context={'request': request})

        logger.info(
            f'Conversation {"créée" if created else "récupérée"} : '
            f'{user.email} ↔ {painter.user.email}'
        )

        return Response(
            {
                'conversation': serializer.data,
                'created': created,
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class MarkReadView(APIView):
    """
    POST /api/messaging/conversations/<id>/read/
    Marque tous les messages reçus comme lus.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role == 'CLIENT':
            conv = get_object_or_404(Conversation, id=pk, client=user)
        else:
            conv = get_object_or_404(Conversation, id=pk, painter=user.painter_profile)

        updated = conv.messages.filter(is_read=False).exclude(sender=user).update(is_read=True)
        return Response({'marked_read': updated})
