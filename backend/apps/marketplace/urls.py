"""
PaintMatch — URLs de l'application marketplace.
Préfixe : /api/marketplace/
"""

from django.urls import path
from .views import (
    MyAvailabilitiesView,
    MyAvailabilityDetailView,
    PainterAvailabilitiesPublicView,
    PainterSearchView,
)

urlpatterns = [
    # --- Recherche et recommandation ---
    path('search/',                             PainterSearchView.as_view(),              name='painter-search'),

    # --- Disponibilités peintre ---
    path('my/availabilities/',                  MyAvailabilitiesView.as_view(),           name='my-availabilities'),
    path('my/availabilities/<int:pk>/',         MyAvailabilityDetailView.as_view(),       name='my-availability-detail'),
    path('painters/<int:painter_id>/availabilities/', PainterAvailabilitiesPublicView.as_view(), name='painter-availabilities-public'),
]
