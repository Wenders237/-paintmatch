"""
PaintMatch — Modèles de l'application accounts.

Contient :
- User         : modèle utilisateur personnalisé (remplace auth.User)
- ClientProfile: données spécifiques au client
- PainterProfile: données spécifiques au peintre
"""

import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from .managers import UserManager


# ---------------------------------------------------------------------------
# Constantes de rôles et statuts
# ---------------------------------------------------------------------------

class UserRole(models.TextChoices):
    CLIENT = 'CLIENT', _('Client')
    PEINTRE = 'PEINTRE', _('Peintre')
    ADMIN = 'ADMIN', _('Administrateur')


class ValidationStatus(models.TextChoices):
    EN_ATTENTE = 'EN_ATTENTE', _('En attente')
    VALIDE = 'VALIDE', _('Validé')
    REFUSE = 'REFUSE', _('Refusé')
    SUSPENDU = 'SUSPENDU', _('Suspendu')
    COMPLEMENT = 'COMPLEMENT', _('Complément demandé')


# ---------------------------------------------------------------------------
# Modèle utilisateur personnalisé
# ---------------------------------------------------------------------------

class User(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur central.
    L'e-mail est utilisé comme identifiant de connexion (pas le username).
    Le champ `role` détermine les permissions métier.
    """

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )
    email = models.EmailField(
        _('adresse e-mail'),
        unique=True,
        db_index=True,
    )
    first_name = models.CharField(_('prénom'), max_length=100)
    last_name = models.CharField(_('nom'), max_length=100)
    phone = models.CharField(_('téléphone'), max_length=20, blank=True)
    city = models.CharField(_('ville'), max_length=100, blank=True)
    address = models.TextField(_('adresse'), blank=True)
    avatar = models.FileField(
        _('photo de profil'),
        upload_to='avatars/',
        blank=True,
        null=True,
        # ImageField sera réactivé quand Pillow supportera Python 3.14
    )
    role = models.CharField(
        _('rôle'),
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CLIENT,
        db_index=True,
    )

    # Champs Django standard
    is_active = models.BooleanField(_('actif'), default=True)
    is_staff = models.BooleanField(_('staff'), default=False)
    date_joined = models.DateTimeField(_('date d\'inscription'), default=timezone.now)
    email_verified = models.BooleanField(_('e-mail vérifié'), default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    class Meta:
        verbose_name = _('utilisateur')
        verbose_name_plural = _('utilisateurs')
        ordering = ['-date_joined']

    def __str__(self):
        return f'{self.get_full_name()} <{self.email}>'

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def get_short_name(self):
        return self.first_name

    @property
    def is_client(self):
        return self.role == UserRole.CLIENT

    @property
    def is_peintre(self):
        return self.role == UserRole.PEINTRE

    @property
    def is_admin_user(self):
        return self.role == UserRole.ADMIN


# ---------------------------------------------------------------------------
# Profil client
# ---------------------------------------------------------------------------

class ClientProfile(models.Model):
    """
    Données complémentaires spécifiques aux clients.
    Créé automatiquement lors de la création d'un compte CLIENT.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='client_profile',
        limit_choices_to={'role': UserRole.CLIENT},
    )
    # Préférences stockées en JSON (ex. catégories favorites, villes préférées)
    preferences = models.JSONField(_('préférences'), default=dict, blank=True)

    class Meta:
        verbose_name = _('profil client')
        verbose_name_plural = _('profils clients')

    def __str__(self):
        return f'Profil client — {self.user.get_full_name()}'


# ---------------------------------------------------------------------------
# Profil peintre
# ---------------------------------------------------------------------------

class PainterProfile(models.Model):
    """
    Données professionnelles du peintre.
    Doit être validé par un administrateur avant d'être actif sur la plateforme.
    Un peintre non validé n'est ni visible ni recommandable.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='painter_profile',
        limit_choices_to={'role': UserRole.PEINTRE},
    )
    bio = models.TextField(_('présentation'), blank=True)
    years_experience = models.PositiveSmallIntegerField(
        _('années d\'expérience'),
        default=0,
    )
    # Numéro d'identification professionnelle (RCCM ou équivalent Cameroun)
    professional_id = models.CharField(
        _('numéro professionnel'),
        max_length=100,
        blank=True,
    )

    # Validation administrative
    validation_status = models.CharField(
        _('statut de validation'),
        max_length=20,
        choices=ValidationStatus.choices,
        default=ValidationStatus.EN_ATTENTE,
        db_index=True,
    )
    validation_date = models.DateTimeField(
        _('date de validation'),
        blank=True,
        null=True,
    )
    validated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='validated_painters',
        limit_choices_to={'role': UserRole.ADMIN},
    )
    validation_note = models.TextField(
        _('note de validation / motif de refus'),
        blank=True,
    )

    # Statistiques calculées (dénormalisées pour les performances)
    average_rating = models.DecimalField(
        _('note moyenne'),
        max_digits=3,
        decimal_places=2,
        default=0.00,
    )
    total_reviews = models.PositiveIntegerField(
        _('nombre d\'évaluations'),
        default=0,
    )
    is_featured = models.BooleanField(
        _('mis en avant'),
        default=False,
        help_text=_('Peintre mis en avant sur la page d\'accueil.'),
    )

    class Meta:
        verbose_name = _('profil peintre')
        verbose_name_plural = _('profils peintres')
        ordering = ['-average_rating', '-total_reviews']

    def __str__(self):
        return f'Profil peintre — {self.user.get_full_name()} [{self.validation_status}]'

    @property
    def is_validated(self):
        """Retourne True uniquement si le peintre est pleinement validé."""
        return self.validation_status == ValidationStatus.VALIDE

    @property
    def is_visible(self):
        """
        Un peintre n'est visible publiquement que s'il est validé
        et que son compte est actif.
        """
        return self.is_validated and self.user.is_active
