"""
PaintMatch — Modèles de l'application marketplace.

Contient :
- Availability : plages de disponibilité du peintre
- SearchLog    : historique des recherches (alimente la recommandation IA)
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError


class Availability(models.Model):
    """
    Plage de disponibilité déclarée par un peintre.
    Permet aux clients de savoir quand le peintre est disponible.
    """
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='availabilities',
        verbose_name=_('peintre'),
    )
    date_start = models.DateField(_('date de début'))
    date_end   = models.DateField(_('date de fin'))
    is_available = models.BooleanField(
        _('disponible'),
        default=True,
        help_text=_('Décocher pour marquer une période d\'indisponibilité.'),
    )
    note = models.CharField(_('note'), max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('disponibilité')
        verbose_name_plural = _('disponibilités')
        ordering = ['date_start']

    def clean(self):
        if self.date_end and self.date_start and self.date_end < self.date_start:
            raise ValidationError(
                {'date_end': _('La date de fin doit être après la date de début.')}
            )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        status = 'Disponible' if self.is_available else 'Indisponible'
        return f'{self.painter} — {self.date_start} → {self.date_end} ({status})'


class SearchLog(models.Model):
    """
    Enregistrement anonymisé des recherches effectuées.
    Alimente le système de recommandation intelligente (Phase 10).
    Ne stocke pas de données personnelles identifiables.
    """
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='search_logs',
        verbose_name=_('utilisateur'),
    )
    query_text = models.CharField(_('texte de recherche'), max_length=300, blank=True)
    city       = models.CharField(_('ville'), max_length=100, blank=True)
    category   = models.ForeignKey(
        'services.ServiceCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('catégorie recherchée'),
    )
    results_count = models.PositiveSmallIntegerField(_('nombre de résultats'), default=0)
    timestamp     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('log de recherche')
        verbose_name_plural = _('logs de recherche')
        ordering = ['-timestamp']

    def __str__(self):
        return f'Recherche [{self.city}] {self.query_text} — {self.timestamp:%d/%m/%Y}'
