"""
PaintMatch — Permissions personnalisées pour l'API.
"""

from rest_framework.permissions import BasePermission
from .models import UserRole


class IsClient(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle CLIENT."""

    message = 'Accès réservé aux clients.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.CLIENT
        )


class IsPeintre(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle PEINTRE."""

    message = 'Accès réservé aux peintres.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.PEINTRE
        )


class IsValidatedPeintre(BasePermission):
    """
    Autorise uniquement les peintres dont le profil est validé
    par un administrateur.
    """

    message = 'Votre profil professionnel est en attente de validation.'

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role != UserRole.PEINTRE:
            return False
        try:
            return request.user.painter_profile.is_validated
        except Exception:
            return False


class IsAdminUser(BasePermission):
    """Autorise uniquement les utilisateurs avec le rôle ADMIN."""

    message = 'Accès réservé aux administrateurs.'

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == UserRole.ADMIN
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Autorise le propriétaire de la ressource ou un administrateur.
    L'objet doit avoir un champ `user` ou `owner`.
    """

    message = 'Vous n\'êtes pas autorisé à accéder à cette ressource.'

    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        owner = getattr(obj, 'user', None) or getattr(obj, 'owner', None)
        return owner == request.user
