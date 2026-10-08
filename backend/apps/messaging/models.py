"""
PaintMatch — Modèles de l'application messaging.

Contient :
- Conversation : canal d'échange entre un client et un peintre
- Message      : message individuel dans une conversation
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _


class Conversation(models.Model):
    """
    Canal de messagerie entre un client et un peintre.
    Une seule conversation par paire client/peintre.
    Peut être liée à une demande de devis.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    client = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='conversations_as_client',
        limit_choices_to={'role': 'CLIENT'},
        verbose_name=_('client'),
    )
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='conversations',
        verbose_name=_('peintre'),
    )
    # Lien optionnel vers une demande de devis
    quote_request = models.OneToOneField(
        'transactions.QuoteRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversation',
        verbose_name=_('demande de devis liée'),
    )

    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('conversation')
        verbose_name_plural = _('conversations')
        unique_together = [('client', 'painter')]
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.client.get_full_name()} ↔ {self.painter.user.get_full_name()}'

    def get_unread_count(self, user):
        """Retourne le nombre de messages non lus pour un utilisateur donné."""
        return self.messages.filter(is_read=False).exclude(sender=user).count()


class Message(models.Model):
    """
    Message individuel dans une conversation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        verbose_name=_('conversation'),
    )
    sender = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='sent_messages',
        verbose_name=_('expéditeur'),
    )
    content = models.TextField(_('contenu'))
    is_read = models.BooleanField(_('lu'), default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('message')
        verbose_name_plural = _('messages')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.sender.get_full_name()} → {self.created_at:%d/%m %H:%M}'
