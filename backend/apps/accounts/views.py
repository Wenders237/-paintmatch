"""
PaintMatch — Vues d'authentification et de gestion des profils.

Endpoints couverts :
  POST   /api/auth/register/            → Inscription (client ou peintre)
  POST   /api/auth/login/               → Connexion JWT
  POST   /api/auth/logout/              → Déconnexion (blacklist du refresh token)
  POST   /api/auth/token/refresh/       → Renouvellement du token (géré par simplejwt)
  GET    /api/auth/me/                  → Profil de l'utilisateur connecté
  PATCH  /api/auth/me/                  → Modifier ses informations personnelles
  POST   /api/auth/change-password/     → Changer son mot de passe
  GET    /api/profiles/painter/me/      → Profil peintre (lecture/modif par le peintre)
  PATCH  /api/profiles/painter/me/      → Modifier son profil peintre
  GET    /api/profiles/client/me/       → Profil client
  PATCH  /api/profiles/client/me/       → Modifier ses préférences client
"""

import logging
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError

from .models import UserRole, ClientProfile, PainterProfile
from .permissions import IsClient, IsPeintre
from .serializers import (
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    ClientProfileSerializer,
    PainterProfileSerializer,
    ChangePasswordSerializer,
)

logger = logging.getLogger('paintmatch')


# ---------------------------------------------------------------------------
# Inscription
# ---------------------------------------------------------------------------

class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Crée un compte client ou peintre.
    Accès public (AllowAny).
    """

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Génération des tokens JWT directement après inscription
        refresh = RefreshToken.for_user(user)

        # Sérialisation complète de l'utilisateur (cohérent avec la réponse de login)
        from .serializers import UserSummarySerializer
        user_data = UserSummarySerializer(user, context={'request': request}).data

        logger.info(f'Nouvel utilisateur inscrit : {user.email} (rôle: {user.role})')

        return Response(
            {
                'message': 'Compte créé avec succès.',
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                'user': user_data,
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Connexion (JWT personnalisé)
# ---------------------------------------------------------------------------

class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Retourne access + refresh tokens avec les infos utilisateur.
    Accès public (AllowAny).
    """

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            logger.info(f'Connexion réussie : {request.data.get("email")}')
        return response


# ---------------------------------------------------------------------------
# Déconnexion (blacklist du refresh token)
# ---------------------------------------------------------------------------

class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Invalide le refresh token fourni (blacklist).
    Nécessite d'être authentifié.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Le refresh token est requis.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f'Déconnexion : {request.user.email}')
            return Response(
                {'message': 'Déconnexion réussie.'},
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {'error': 'Token invalide ou déjà révoqué.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Profil de l'utilisateur connecté
# ---------------------------------------------------------------------------

class MeView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/   → Lire son profil
    PATCH /api/auth/me/  → Modifier ses informations personnelles
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        return self.request.user


# ---------------------------------------------------------------------------
# Changement de mot de passe
# ---------------------------------------------------------------------------

class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    L'utilisateur fournit son ancien mot de passe et le nouveau.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(f'Mot de passe modifié : {request.user.email}')
        return Response(
            {'message': 'Mot de passe modifié avec succès.'},
            status=status.HTTP_200_OK,
        )


# ---------------------------------------------------------------------------
# Profil client
# ---------------------------------------------------------------------------

class ClientProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/profiles/client/me/  → Consulter son profil client
    PATCH /api/profiles/client/me/  → Modifier ses préférences
    """

    permission_classes = [IsAuthenticated, IsClient]
    serializer_class = ClientProfileSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        profile, _ = ClientProfile.objects.get_or_create(user=self.request.user)
        return profile


# ---------------------------------------------------------------------------
# Profil peintre
# ---------------------------------------------------------------------------

class PainterProfileView(generics.RetrieveUpdateAPIView):
    """
    GET   /api/profiles/painter/me/  → Consulter son profil peintre
    PATCH /api/profiles/painter/me/  → Modifier ses informations professionnelles
    """

    permission_classes = [IsAuthenticated, IsPeintre]
    serializer_class = PainterProfileSerializer
    http_method_names = ['get', 'patch', 'head', 'options']

    def get_object(self):
        profile, _ = PainterProfile.objects.get_or_create(user=self.request.user)
        return profile
