"""
PaintMatch — Modèle de notification in-app.
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Notification(models.Model):

    class NotifType(models.TextChoices):
        QUOTE_REQUEST  = 'QUOTE_REQUEST',  _('Nouvelle demande de devis')
        QUOTE_SENT     = 'QUOTE_SENT',     _('Devis reçu')
        QUOTE_ACCEPTED = 'QUOTE_ACCEPTED', _('Devis accepté')
        QUOTE_REFUSED  = 'QUOTE_REFUSED',  _('Devis refusé')
        BOOKING        = 'BOOKING',        _('Réservation')
        WORK_PROGRESS  = 'WORK_PROGRESS',  _('Avancement travaux')
        WORK_FINISHED  = 'WORK_FINISHED',  _('Travaux terminés')
        NEW_REVIEW     = 'NEW_REVIEW',     _('Nouvelle évaluation')
        PROFILE        = 'PROFILE',        _('Profil')
        MESSAGE        = 'MESSAGE',        _('Nouveau message')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    recipient = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_('destinataire'),
    )
    notif_type = models.CharField(
        _('type'),
        max_length=30,
        choices=NotifType.choices,
        default=NotifType.MESSAGE,
    )
    title   = models.CharField(_('titre'), max_length=200)
    message = models.TextField(_('message'))
    link    = models.CharField(_('lien'), max_length=200, blank=True)
    is_read = models.BooleanField(_('lu'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.recipient.email} — {self.title}'
