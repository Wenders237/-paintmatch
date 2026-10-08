"""
PaintMatch — Modèles de l'application reviews.

Règles métier :
- Une seule évaluation par réservation terminée
- Seul le client peut évaluer
- La note moyenne du peintre est recalculée automatiquement
- Une évaluation ne peut pas être supprimée (archive)
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _


class Review(models.Model):
    """
    Évaluation laissée par un client après la fin des travaux.
    Liée à une réservation terminée — une seule par réservation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking = models.OneToOneField(
        'transactions.Booking',
        on_delete=models.CASCADE,
        related_name='review',
        verbose_name=_('réservation'),
    )
    client = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='reviews_given',
        limit_choices_to={'role': 'CLIENT'},
        verbose_name=_('client'),
    )
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='reviews_received',
        verbose_name=_('peintre'),
    )
    rating = models.PositiveSmallIntegerField(
        _('note'),
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_('Note de 1 à 5'),
    )
    comment = models.TextField(
        _('commentaire'),
        blank=True,
        help_text=_('Commentaire optionnel du client'),
    )
    painter_reply = models.TextField(
        _('réponse du peintre'),
        blank=True,
        help_text=_('Réponse optionnelle du peintre à l\'évaluation'),
    )
    is_visible = models.BooleanField(
        _('visible'),
        default=True,
        help_text=_('L\'admin peut masquer une évaluation inappropriée'),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('évaluation')
        verbose_name_plural = _('évaluations')
        ordering = ['-created_at']

    def __str__(self):
        return f'★{self.rating} — {self.client.get_full_name()} → {self.painter}'

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalcule la note moyenne du peintre après chaque évaluation
        self._update_painter_rating()

    def _update_painter_rating(self):
        """Recalcule et met à jour la note moyenne du peintre."""
        from django.db.models import Avg, Count
        stats = Review.objects.filter(
            painter=self.painter,
            is_visible=True,
        ).aggregate(avg=Avg('rating'), count=Count('id'))

        self.painter.average_rating = stats['avg'] or 0
        self.painter.total_reviews  = stats['count'] or 0
        self.painter.save(update_fields=['average_rating', 'total_reviews'])
