"""
PaintMatch — Vues de l'application reviews.

Endpoints :
  POST   /api/reviews/                         → Créer une évaluation (client)
  GET    /api/reviews/my/                       → Mes évaluations données (client)
  GET    /api/reviews/painter/<id>/             → Évaluations d'un peintre (public)
  GET    /api/reviews/painter/me/               → Mes évaluations reçues (peintre)
  POST   /api/reviews/<id>/reply/               → Répondre à une évaluation (peintre)
  GET    /api/reviews/<booking_id>/check/       → Vérifier si une réservation a été évaluée
"""

import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.accounts.permissions import IsClient, IsPeintre
from apps.accounts.models import PainterProfile
from .models import Review
from .serializers import ReviewSerializer, CreateReviewSerializer, PainterReplySerializer

logger = logging.getLogger('paintmatch')


class CreateReviewView(generics.CreateAPIView):
    """POST /api/reviews/ — Le client crée une évaluation."""
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = CreateReviewSerializer

    def perform_create(self, serializer):
        review = serializer.save()
        logger.info(
            f'Évaluation créée : {review.rating}★ par {review.client.email} '
            f'pour {review.painter.user.email}'
        )
        # Notifier le peintre
        try:
            from apps.notifications.service import notify_new_review
            notify_new_review(review)
        except Exception as e:
            logger.error(f'Notification évaluation : {e}')


class MyReviewsGivenView(generics.ListAPIView):
    """GET /api/reviews/my/ — Évaluations données par le client connecté."""
    permission_classes = [IsAuthenticated, IsClient]
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            client=self.request.user,
            is_visible=True,
        ).select_related('painter__user', 'client').order_by('-created_at')


class PainterReviewsPublicView(generics.ListAPIView):
    """GET /api/reviews/painter/<id>/ — Évaluations publiques d'un peintre."""
    permission_classes = [AllowAny]
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        painter = get_object_or_404(PainterProfile, id=self.kwargs['painter_id'])
        return Review.objects.filter(
            painter=painter,
            is_visible=True,
        ).select_related('client').order_by('-created_at')


class MyReviewsReceivedView(generics.ListAPIView):
    """GET /api/reviews/painter/me/ — Évaluations reçues par le peintre connecté."""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class   = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            painter=self.request.user.painter_profile,
            is_visible=True,
        ).select_related('client').order_by('-created_at')


class PainterReplyView(APIView):
    """POST /api/reviews/<id>/reply/ — Le peintre répond à une évaluation."""
    permission_classes = [IsAuthenticated, IsPeintre]

    def post(self, request, pk):
        review = get_object_or_404(
            Review,
            id=pk,
            painter=request.user.painter_profile,
        )
        serializer = PainterReplySerializer(review, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'Réponse enregistrée.'})


class CheckReviewView(APIView):
    """
    GET /api/reviews/<booking_id>/check/
    Vérifie si une réservation a déjà été évaluée.
    Retourne { has_review: bool, review: {...} | null }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        from apps.transactions.models import Booking
        booking = get_object_or_404(Booking, id=booking_id, client=request.user)

        try:
            review = booking.review
            return Response({
                'has_review': True,
                'review': ReviewSerializer(review).data,
            })
        except Review.DoesNotExist:
            return Response({'has_review': False, 'review': None})
