"""
PaintMatch — Vues de l'application marketplace.

Endpoints disponibilités :
  GET    /api/marketplace/my/availabilities/          → Mes disponibilités (peintre)
  POST   /api/marketplace/my/availabilities/          → Ajouter
  PATCH  /api/marketplace/my/availabilities/<id>/     → Modifier
  DELETE /api/marketplace/my/availabilities/<id>/     → Supprimer
  GET    /api/marketplace/painters/<id>/availabilities/ → Disponibilités publiques d'un peintre

Endpoints recherche / recommandation :
  GET    /api/marketplace/search/                     → Recherche et recommandation de peintres
"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404

from apps.accounts.models import PainterProfile, ValidationStatus
from apps.accounts.permissions import IsPeintre
from .models import Availability, SearchLog
from .serializers import AvailabilitySerializer, PainterSearchResultSerializer
from .engine import recommend_painters


class MyAvailabilitiesView(generics.ListCreateAPIView):
    """Disponibilités du peintre connecté."""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(painter=self.request.user.painter_profile)


class MyAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Modification/suppression d'une disponibilité."""
    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = AvailabilitySerializer
    http_method_names = ['get', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Availability.objects.filter(painter=self.request.user.painter_profile)


class PainterAvailabilitiesPublicView(generics.ListAPIView):
    """Disponibilités publiques d'un peintre validé."""
    permission_classes = [AllowAny]
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        painter = get_object_or_404(
            PainterProfile,
            id=self.kwargs['painter_id'],
            validation_status=ValidationStatus.VALIDE,
            user__is_active=True,
        )
        return Availability.objects.filter(painter=painter, is_available=True)


class PainterSearchView(APIView):
    """
    GET /api/marketplace/search/
    Recherche et recommandation de peintres validés.

    Paramètres query string :
      city         : ville (str)
      category     : ID catégorie de prestation (int)
      skills       : IDs compétences séparés par virgule (ex: 1,3,5)
      date_start   : date début souhaitée (YYYY-MM-DD)
      date_end     : date fin souhaitée (YYYY-MM-DD)
      sort         : 'recommended' (défaut) | 'rating' | 'experience'
      page         : numéro de page (défaut: 1)
      page_size    : résultats par page (défaut: 12, max: 50)
    """

    permission_classes = [AllowAny]

    def get(self, request):
        # --- Lecture des paramètres ---
        city        = request.query_params.get('city', '').strip()
        category_id = request.query_params.get('category')
        skills_str  = request.query_params.get('skills', '')
        date_start  = request.query_params.get('date_start')
        date_end    = request.query_params.get('date_end')
        sort        = request.query_params.get('sort', 'recommended')
        page        = int(request.query_params.get('page', 1))
        page_size   = min(int(request.query_params.get('page_size', 12)), 50)

        # Conversion des types
        try:
            category_id = int(category_id) if category_id else None
        except (ValueError, TypeError):
            category_id = None

        skill_ids = []
        if skills_str:
            try:
                skill_ids = [int(s) for s in skills_str.split(',') if s.strip()]
            except ValueError:
                skill_ids = []

        # Conversion des dates
        from datetime import date as date_type
        try:
            from datetime import datetime
            date_start = datetime.strptime(date_start, '%Y-%m-%d').date() if date_start else None
            date_end   = datetime.strptime(date_end,   '%Y-%m-%d').date() if date_end   else None
        except (ValueError, TypeError):
            date_start = None
            date_end   = None

        # --- Appel du moteur de recommandation ---
        results = recommend_painters(
            city=city or None,
            category_id=category_id,
            skill_ids=skill_ids or None,
            date_start=date_start,
            date_end=date_end,
            limit=200,  # On récupère plus pour le tri + pagination
        )

        # --- Tri alternatif ---
        if sort == 'rating':
            results.sort(key=lambda x: x['painter'].average_rating or 0, reverse=True)
        elif sort == 'experience':
            results.sort(key=lambda x: x['painter'].years_experience or 0, reverse=True)
        # 'recommended' = déjà trié par score dans le moteur

        # --- Pagination ---
        total     = len(results)
        start_idx = (page - 1) * page_size
        end_idx   = start_idx + page_size
        page_data = results[start_idx:end_idx]

        # --- Sérialisation ---
        serializer = PainterSearchResultSerializer(
            page_data,
            many=True,
            context={'request': request},
        )

        # --- Journalisation de la recherche (anonyme) ---
        try:
            SearchLog.objects.create(
                user=request.user if request.user.is_authenticated else None,
                query_text=' '.join(filter(None, [city, str(category_id) if category_id else ''])),
                city=city,
                category_id=category_id,
                results_count=total,
            )
        except Exception:
            pass  # La journalisation ne doit jamais bloquer la recherche

        return Response({
            'count':    total,
            'page':     page,
            'pages':    max(1, -(-total // page_size)),  # Division entière arrondie vers le haut
            'results':  serializer.data,
            'filters':  {
                'city':       city,
                'category':   category_id,
                'sort':       sort,
            },
        })
