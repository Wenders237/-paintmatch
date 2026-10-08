"""
PaintMatch — Vues de l'application services.

Endpoints :
  GET    /api/services/categories/                → Liste des catégories (public)
  GET    /api/services/skills/                    → Liste des compétences (public)
  GET    /api/services/skills/?category=<id>      → Filtre par catégorie

  -- Compétences du peintre connecté --
  GET    /api/services/my/skills/                 → Mes compétences
  POST   /api/services/my/skills/                 → Ajouter une compétence
  DELETE /api/services/my/skills/<id>/            → Supprimer une compétence

  -- Qualifications --
  GET    /api/services/my/qualifications/         → Mes qualifications
  POST   /api/services/my/qualifications/         → Ajouter
  PATCH  /api/services/my/qualifications/<id>/    → Modifier
  DELETE /api/services/my/qualifications/<id>/    → Supprimer

  -- Documents professionnels --
  GET    /api/services/my/documents/              → Mes documents
  POST   /api/services/my/documents/              → Uploader
  DELETE /api/services/my/documents/<id>/         → Supprimer

  -- Portfolio --
  GET    /api/services/my/portfolio/              → Mes réalisations
  POST   /api/services/my/portfolio/              → Ajouter une réalisation
  PATCH  /api/services/my/portfolio/<id>/         → Modifier
  DELETE /api/services/my/portfolio/<id>/         → Supprimer
  POST   /api/services/my/portfolio/<id>/images/  → Ajouter une image
  DELETE /api/services/my/portfolio/images/<id>/  → Supprimer une image

  -- Offres de services --
  GET    /api/services/my/offers/                 → Mes offres
  POST   /api/services/my/offers/                 → Créer
  PATCH  /api/services/my/offers/<id>/            → Modifier
  DELETE /api/services/my/offers/<id>/            → Supprimer

  -- Profil public --
  GET    /api/services/painters/<painter_id>/profile/  → Profil complet public
"""

import logging
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404

from apps.accounts.models import PainterProfile, ValidationStatus
from apps.accounts.permissions import IsPeintre, IsValidatedPeintre, IsOwnerOrAdmin

from .models import (
    ServiceCategory, Skill, PainterSkill,
    Qualification, ProfessionalDoc, Portfolio,
    PortfolioImage, ServiceOffer,
)
from .serializers import (
    ServiceCategorySerializer, SkillSerializer,
    PainterSkillSerializer, QualificationSerializer,
    ProfessionalDocSerializer, PortfolioSerializer,
    PortfolioImageSerializer, ServiceOfferSerializer,
    PainterFullProfileSerializer,
)

logger = logging.getLogger('paintmatch')


# ---------------------------------------------------------------------------
# Lecture publique
# ---------------------------------------------------------------------------

class ServiceCategoryListView(generics.ListAPIView):
    """GET /api/services/categories/ — Liste des catégories actives."""
    permission_classes = [AllowAny]
    serializer_class = ServiceCategorySerializer
    queryset = ServiceCategory.objects.filter(is_active=True)


class SkillListView(generics.ListAPIView):
    """GET /api/services/skills/?category=<id> — Liste des compétences."""
    permission_classes = [AllowAny]
    serializer_class = SkillSerializer
    filterset_fields = ['category']
    search_fields = ['name']

    def get_queryset(self):
        qs = Skill.objects.filter(is_active=True).select_related('category')
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        return qs


class PainterPublicProfileView(APIView):
    """
    GET /api/services/painters/<painter_id>/profile/
    Profil complet public d'un peintre validé.
    Accessible à tous (visiteurs et clients).
    """
    permission_classes = [AllowAny]

    def get(self, request, painter_id):
        painter = get_object_or_404(
            PainterProfile,
            id=painter_id,
            validation_status=ValidationStatus.VALIDE,
            user__is_active=True,
        )
        serializer = PainterFullProfileSerializer(
            painter, context={'request': request}
        )
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Mixin de base pour les vues peintre
# ---------------------------------------------------------------------------

class PainterObjectMixin:
    """Récupère le PainterProfile du peintre connecté."""

    def get_painter(self):
        return self.request.user.painter_profile


# ---------------------------------------------------------------------------
# Compétences du peintre
# ---------------------------------------------------------------------------

class MySkillsView(PainterObjectMixin, generics.ListCreateAPIView):
    """
    GET  /api/services/my/skills/ → Liste mes compétences
    POST /api/services/my/skills/ → Ajouter une compétence
    """
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = PainterSkillSerializer

    def get_queryset(self):
        return PainterSkill.objects.filter(
            painter=self.get_painter()
        ).select_related('skill__category')


class MySkillDetailView(PainterObjectMixin, generics.DestroyAPIView):
    """DELETE /api/services/my/skills/<id>/"""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = PainterSkillSerializer

    def get_queryset(self):
        return PainterSkill.objects.filter(painter=self.get_painter())


# ---------------------------------------------------------------------------
# Qualifications
# ---------------------------------------------------------------------------

class MyQualificationsView(PainterObjectMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = QualificationSerializer

    def get_queryset(self):
        return Qualification.objects.filter(painter=self.get_painter())


class MyQualificationDetailView(PainterObjectMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = QualificationSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Qualification.objects.filter(painter=self.get_painter())


# ---------------------------------------------------------------------------
# Documents professionnels
# ---------------------------------------------------------------------------

class MyDocumentsView(PainterObjectMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = ProfessionalDocSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return ProfessionalDoc.objects.filter(painter=self.get_painter())

    def perform_create(self, serializer):
        serializer.save(painter=self.get_painter())
        logger.info(
            f'Document uploadé par {self.request.user.email} : '
            f'{serializer.validated_data.get("title")}'
        )


class MyDocumentDetailView(PainterObjectMixin, generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = ProfessionalDocSerializer

    def get_queryset(self):
        return ProfessionalDoc.objects.filter(painter=self.get_painter())


# ---------------------------------------------------------------------------
# Portfolio
# ---------------------------------------------------------------------------

class MyPortfolioView(PainterObjectMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = PortfolioSerializer

    def get_queryset(self):
        return Portfolio.objects.filter(
            painter=self.get_painter()
        ).prefetch_related('images').select_related('category')


class MyPortfolioDetailView(PainterObjectMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = PortfolioSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Portfolio.objects.filter(
            painter=self.get_painter()
        ).prefetch_related('images')


class MyPortfolioImageUploadView(PainterObjectMixin, APIView):
    """
    POST /api/services/my/portfolio/<portfolio_id>/images/
    Upload d'une image pour une réalisation.
    """
    permission_classes = [IsAuthenticated, IsPeintre]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, portfolio_id):
        portfolio = get_object_or_404(
            Portfolio,
            id=portfolio_id,
            painter=self.get_painter(),
        )
        serializer = PortfolioImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Si marquée comme couverture, enlever l'ancienne couverture
        if serializer.validated_data.get('is_cover'):
            portfolio.images.filter(is_cover=True).update(is_cover=False)

        serializer.save(portfolio=portfolio)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyPortfolioImageDeleteView(PainterObjectMixin, generics.DestroyAPIView):
    """DELETE /api/services/my/portfolio/images/<id>/"""
    permission_classes = [IsAuthenticated, IsPeintre]

    def get_queryset(self):
        return PortfolioImage.objects.filter(
            portfolio__painter=self.get_painter()
        )


# ---------------------------------------------------------------------------
# Offres de services
# ---------------------------------------------------------------------------

class MyServiceOffersView(PainterObjectMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = ServiceOfferSerializer

    def get_queryset(self):
        return ServiceOffer.objects.filter(
            painter=self.get_painter()
        ).select_related('category')


class MyServiceOfferDetailView(PainterObjectMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = ServiceOfferSerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return ServiceOffer.objects.filter(painter=self.get_painter())
