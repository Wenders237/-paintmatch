"""
PaintMatch — URLs de l'application accounts.
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    ClientProfileView,
    PainterProfileView,
)

# Préfixe défini dans paintmatch/urls.py : /api/
urlpatterns = [
    # --- Authentification ---
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),

    # --- Profil utilisateur connecté ---
    path('auth/me/', MeView.as_view(), name='auth-me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth-change-password'),

    # --- Profils spécifiques ---
    path('profiles/client/me/', ClientProfileView.as_view(), name='client-profile-me'),
    path('profiles/painter/me/', PainterProfileView.as_view(), name='painter-profile-me'),
]
