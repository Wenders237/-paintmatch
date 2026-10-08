"""
PaintMatch — URLs de l'application administration.
Préfixe : /api/admin-panel/
Tous les endpoints sont réservés aux administrateurs.
"""

from django.urls import path
from .views import (
    AdminPainterListView,
    AdminPainterDossierView,
    AdminValidatePainterView,
    AdminUserListView,
    AdminUserDetailView,
    AdminToggleUserActiveView,
    AdminStatsView,
    AdminLogListView,
    PlatformSettingsListView,
    PlatformSettingsDetailView,
    SitemapView,
)

urlpatterns = [
    # Sitemap public
    path('sitemap.xml',                     SitemapView.as_view(),               name='sitemap'),

    # Peintres
    path('painters/',                       AdminPainterListView.as_view(),      name='admin-painter-list'),
    path('painters/<int:pk>/',              AdminPainterDossierView.as_view(),   name='admin-painter-dossier'),
    path('painters/<int:pk>/validate/',     AdminValidatePainterView.as_view(),  name='admin-painter-validate'),

    # Utilisateurs
    path('users/',                          AdminUserListView.as_view(),         name='admin-user-list'),
    path('users/<uuid:pk>/',               AdminUserDetailView.as_view(),       name='admin-user-detail'),
    path('users/<uuid:pk>/toggle-active/', AdminToggleUserActiveView.as_view(), name='admin-user-toggle'),

    # Statistiques
    path('stats/',                          AdminStatsView.as_view(),            name='admin-stats'),

    # Journal
    path('logs/',                           AdminLogListView.as_view(),          name='admin-logs'),

    # Paramètres
    path('settings/',                       PlatformSettingsListView.as_view(),  name='admin-settings'),
    path('settings/<int:pk>/',              PlatformSettingsDetailView.as_view(), name='admin-settings-detail'),
]
