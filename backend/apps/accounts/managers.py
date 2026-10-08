"""
PaintMatch — Manager personnalisé pour le modèle User.
Gère la création des utilisateurs et super-utilisateurs.
"""

from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """
    Manager pour le modèle User utilisant l'e-mail comme identifiant unique.
    """

    def _create_user(self, email, password, **extra_fields):
        """Méthode interne commune à tous les types d'utilisateurs."""
        if not email:
            raise ValueError(_('L\'adresse e-mail est obligatoire.'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        """Crée un utilisateur standard (client ou peintre)."""
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password, **extra_fields):
        """Crée un super-utilisateur (admin Django)."""
        from apps.accounts.models import UserRole
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', UserRole.ADMIN)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Un super-utilisateur doit avoir is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Un super-utilisateur doit avoir is_superuser=True.'))

        return self._create_user(email, password, **extra_fields)

    def get_clients(self):
        """Retourne tous les utilisateurs avec le rôle CLIENT."""
        from apps.accounts.models import UserRole
        return self.filter(role=UserRole.CLIENT, is_active=True)

    def get_painters(self):
        """Retourne tous les utilisateurs avec le rôle PEINTRE."""
        from apps.accounts.models import UserRole
        return self.filter(role=UserRole.PEINTRE, is_active=True)

    def get_admins(self):
        """Retourne tous les utilisateurs avec le rôle ADMIN."""
        from apps.accounts.models import UserRole
        return self.filter(role=UserRole.ADMIN, is_active=True)
