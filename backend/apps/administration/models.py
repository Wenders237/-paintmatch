"""
PaintMatch — Modèles de l'application administration.

Contient :
- AdminLog        : journal des actions administratives
- PlatformSettings: paramètres configurables de la plateforme
"""

from django.db import models
from django.utils.translation import gettext_lazy as _


class AdminLog(models.Model):
    """
    Journal des actions effectuées par les administrateurs.
    Permet de tracer : qui a fait quoi, sur quel objet, et quand.
    """

    class ActionType(models.TextChoices):
        VALIDATE_PAINTER  = 'VALIDATE_PAINTER',  _('Validation peintre')
        REFUSE_PAINTER    = 'REFUSE_PAINTER',    _('Refus peintre')
        SUSPEND_PAINTER   = 'SUSPEND_PAINTER',   _('Suspension peintre')
        REQUEST_COMPLEMENT = 'REQUEST_COMPLEMENT', _('Complément demandé')
        ACTIVATE_USER     = 'ACTIVATE_USER',     _('Activation utilisateur')
        DEACTIVATE_USER   = 'DEACTIVATE_USER',   _('Désactivation utilisateur')
        DELETE_USER       = 'DELETE_USER',       _('Suppression utilisateur')
        UPDATE_SETTINGS   = 'UPDATE_SETTINGS',   _('Mise à jour paramètres')
        OTHER             = 'OTHER',             _('Autre')

    admin = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='admin_logs',
        verbose_name=_('administrateur'),
        limit_choices_to={'role': 'ADMIN'},
    )
    action = models.CharField(
        _('action'),
        max_length=30,
        choices=ActionType.choices,
        default=ActionType.OTHER,
    )
    target_model = models.CharField(
        _('modèle cible'),
        max_length=100,
        blank=True,
    )
    target_id = models.CharField(
        _('ID cible'),
        max_length=100,
        blank=True,
    )
    target_label = models.CharField(
        _('libellé cible'),
        max_length=200,
        blank=True,
        help_text=_('Description lisible de la cible (ex: nom du peintre)'),
    )
    note = models.TextField(
        _('note'),
        blank=True,
        help_text=_('Note ou motif de l\'action'),
    )
    timestamp = models.DateTimeField(_('horodatage'), auto_now_add=True)

    class Meta:
        verbose_name = _('journal admin')
        verbose_name_plural = _('journal admin')
        ordering = ['-timestamp']

    def __str__(self):
        return f'[{self.timestamp:%d/%m/%Y %H:%M}] {self.admin} — {self.action} sur {self.target_label}'


class PlatformSettings(models.Model):
    """
    Paramètres configurables de la plateforme.
    Stockés en base sous forme clé/valeur.
    Exemples : poids de recommandation, messages système, limites.
    """

    key = models.CharField(
        _('clé'),
        max_length=100,
        unique=True,
        help_text=_('Identifiant unique du paramètre (snake_case)'),
    )
    value = models.TextField(
        _('valeur'),
        help_text=_('Valeur du paramètre (texte, nombre ou JSON)'),
    )
    description = models.CharField(
        _('description'),
        max_length=300,
        blank=True,
    )
    updated_at = models.DateTimeField(_('mis à jour le'), auto_now=True)

    class Meta:
        verbose_name = _('paramètre plateforme')
        verbose_name_plural = _('paramètres plateforme')
        ordering = ['key']

    def __str__(self):
        return f'{self.key} = {self.value[:50]}'
