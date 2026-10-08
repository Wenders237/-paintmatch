"""
PaintMatch — Modèles de l'application transactions.

Cycle complet :
  QuoteRequest → Quote + QuoteItem → Booking → WorkProgress → Payment

Décisions de conception :
- Un client peut envoyer une demande à plusieurs peintres (QuoteRequest par peintre)
- Un devis peut être assisté par l'IA (ai_assisted=True)
- Un devis accepté génère automatiquement une Booking
- Le paiement se fait en deux temps : acompte + solde
"""

import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator


# ---------------------------------------------------------------------------
# Demande de devis
# ---------------------------------------------------------------------------

class QuoteRequest(models.Model):
    """
    Demande de devis envoyée par un client à un peintre spécifique.
    Un client peut envoyer plusieurs demandes à différents peintres.
    """

    class Status(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente de réponse')
        REPONDU    = 'REPONDU',    _('Devis reçu')
        EXPIRE     = 'EXPIRE',     _('Expiré')
        ANNULE     = 'ANNULE',     _('Annulé')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    client = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='quote_requests',
        limit_choices_to={'role': 'CLIENT'},
        verbose_name=_('client'),
    )
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='quote_requests',
        verbose_name=_('peintre'),
    )
    category = models.ForeignKey(
        'services.ServiceCategory',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_('catégorie de prestation'),
    )

    # Description des travaux
    title       = models.CharField(_('titre des travaux'), max_length=200)
    description = models.TextField(_('description détaillée'))
    location    = models.CharField(_('lieu des travaux'), max_length=200)
    surface_m2  = models.DecimalField(
        _('surface estimée (m²)'),
        max_digits=8, decimal_places=2,
        null=True, blank=True,
        validators=[MinValueValidator(0)],
    )
    desired_start_date = models.DateField(
        _('date souhaitée de début'),
        null=True, blank=True,
    )
    budget_max = models.DecimalField(
        _('budget maximum (FCFA)'),
        max_digits=12, decimal_places=0,
        null=True, blank=True,
        validators=[MinValueValidator(0)],
    )

    status     = models.CharField(
        _('statut'),
        max_length=20,
        choices=Status.choices,
        default=Status.EN_ATTENTE,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('demande de devis')
        verbose_name_plural = _('demandes de devis')
        ordering = ['-created_at']

    def __str__(self):
        return f'Demande #{str(self.id)[:8]} — {self.client.get_full_name()} → {self.painter}'


# ---------------------------------------------------------------------------
# Devis
# ---------------------------------------------------------------------------

class Quote(models.Model):
    """
    Devis rédigé par le peintre en réponse à une demande.
    Peut être assisté par l'IA.
    Un devis accepté génère automatiquement une réservation.
    """

    class Status(models.TextChoices):
        BROUILLON = 'BROUILLON', _('Brouillon')
        ENVOYE    = 'ENVOYE',    _('Envoyé')
        ACCEPTE   = 'ACCEPTE',   _('Accepté')
        REFUSE    = 'REFUSE',    _('Refusé')
        EXPIRE    = 'EXPIRE',    _('Expiré')
        ANNULE    = 'ANNULE',    _('Annulé')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    request = models.OneToOneField(
        QuoteRequest,
        on_delete=models.CASCADE,
        related_name='quote',
        verbose_name=_('demande de devis'),
    )
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='quotes',
        verbose_name=_('peintre'),
    )

    # Contenu du devis
    intro_text   = models.TextField(_('texte d\'introduction'), blank=True)
    total_amount = models.DecimalField(
        _('montant total (FCFA)'),
        max_digits=12, decimal_places=0,
        validators=[MinValueValidator(0)],
    )
    valid_until  = models.DateField(_('valide jusqu\'au'), null=True, blank=True)
    notes        = models.TextField(_('notes et conditions'), blank=True)

    # Assistance IA
    ai_assisted  = models.BooleanField(
        _('assisté par l\'IA'),
        default=False,
        help_text=_('Indique si ce devis a été rédigé avec l\'assistance IA.'),
    )

    status     = models.CharField(
        _('statut'),
        max_length=20,
        choices=Status.choices,
        default=Status.BROUILLON,
        db_index=True,
    )
    client_note = models.TextField(
        _('note du client'),
        blank=True,
        help_text=_('Motif d\'acceptation ou de refus du client.'),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at    = models.DateTimeField(_('envoyé le'), null=True, blank=True)

    class Meta:
        verbose_name = _('devis')
        verbose_name_plural = _('devis')
        ordering = ['-created_at']

    def __str__(self):
        return f'Devis #{str(self.id)[:8]} — {self.painter} [{self.status}]'

    @property
    def can_be_edited(self):
        """Un devis ne peut être modifié que si en brouillon."""
        return self.status == self.Status.BROUILLON

    @property
    def can_be_sent(self):
        """Un devis peut être envoyé s'il est en brouillon et a au moins un item."""
        return self.status == self.Status.BROUILLON and self.items.exists()


class QuoteItem(models.Model):
    """
    Ligne de détail d'un devis (prestation, quantité, prix unitaire).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    quote       = models.ForeignKey(
        Quote,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('devis'),
    )
    description = models.CharField(_('description'), max_length=300)
    quantity    = models.DecimalField(
        _('quantité'),
        max_digits=8, decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    unit        = models.CharField(
        _('unité'),
        max_length=30,
        default='m²',
        help_text=_('Ex : m², h, forfait, unité'),
    )
    unit_price  = models.DecimalField(
        _('prix unitaire (FCFA)'),
        max_digits=10, decimal_places=0,
        validators=[MinValueValidator(0)],
    )
    total_price = models.DecimalField(
        _('prix total (FCFA)'),
        max_digits=12, decimal_places=0,
        validators=[MinValueValidator(0)],
    )
    order       = models.PositiveSmallIntegerField(_('ordre'), default=0)

    class Meta:
        verbose_name = _('ligne de devis')
        verbose_name_plural = _('lignes de devis')
        ordering = ['order', 'id']

    def save(self, *args, **kwargs):
        """Calcule automatiquement le prix total."""
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.description} — {self.quantity} {self.unit} × {self.unit_price} FCFA'


# ---------------------------------------------------------------------------
# Réservation
# ---------------------------------------------------------------------------

class Booking(models.Model):
    """
    Réservation créée automatiquement quand un devis est accepté.
    """

    class Status(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente de paiement')
        CONFIRME   = 'CONFIRME',   _('Confirmée')
        EN_COURS   = 'EN_COURS',   _('En cours')
        TERMINE    = 'TERMINE',    _('Terminée')
        ANNULE     = 'ANNULE',     _('Annulée')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    quote  = models.OneToOneField(
        Quote,
        on_delete=models.CASCADE,
        related_name='booking',
        verbose_name=_('devis'),
    )
    client = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('client'),
    )
    painter = models.ForeignKey(
        'accounts.PainterProfile',
        on_delete=models.CASCADE,
        related_name='bookings',
        verbose_name=_('peintre'),
    )

    scheduled_date = models.DateField(_('date prévue'), null=True, blank=True)
    status         = models.CharField(
        _('statut'),
        max_length=20,
        choices=Status.choices,
        default=Status.EN_ATTENTE,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('réservation')
        verbose_name_plural = _('réservations')
        ordering = ['-created_at']

    def __str__(self):
        return f'Réservation #{str(self.id)[:8]} — {self.client.get_full_name()} [{self.status}]'


# ---------------------------------------------------------------------------
# Suivi des travaux
# ---------------------------------------------------------------------------

class WorkProgress(models.Model):
    """
    Étape d'avancement des travaux mise à jour par le peintre.
    Peut inclure des photos pour illustrer l'avancement.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking     = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='progress_updates',
        verbose_name=_('réservation'),
    )
    step_label  = models.CharField(_('étape'), max_length=200)
    description = models.TextField(_('description'), blank=True)
    percentage  = models.PositiveSmallIntegerField(
        _('avancement (%)'),
        default=0,
        help_text=_('0 à 100'),
    )
    # Photo illustrant l'étape
    photo = models.FileField(
        _('photo'),
        upload_to='work_progress/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Photo illustrant cette étape des travaux'),
    )
    updated_by  = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('mis à jour par'),
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('étape de travaux')
        verbose_name_plural = _('étapes de travaux')
        ordering = ['created_at']

    def __str__(self):
        return f'{self.step_label} — {self.percentage}%'


# ---------------------------------------------------------------------------
# Paiement
# ---------------------------------------------------------------------------

class Payment(models.Model):
    """
    Paiement lié à une réservation.
    Deux paiements par réservation : acompte + solde.
    """

    class PaymentType(models.TextChoices):
        ACOMPTE = 'ACOMPTE', _('Acompte')
        SOLDE   = 'SOLDE',   _('Solde')

    class Status(models.TextChoices):
        EN_ATTENTE = 'EN_ATTENTE', _('En attente')
        TRAITE     = 'TRAITE',     _('Traité')
        ECHOUE     = 'ECHOUE',     _('Échoué')
        REMBOURSE  = 'REMBOURSE',  _('Remboursé')

    class Method(models.TextChoices):
        MTN_MOMO    = 'MTN_MOMO',    _('MTN Mobile Money')
        ORANGE_MONEY = 'ORANGE_MONEY', _('Orange Money')
        VIREMENT    = 'VIREMENT',    _('Virement bancaire')
        ESPECES     = 'ESPECES',     _('Espèces')
        AUTRE       = 'AUTRE',       _('Autre')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    booking      = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='payments',
        verbose_name=_('réservation'),
    )
    payment_type = models.CharField(
        _('type de paiement'),
        max_length=10,
        choices=PaymentType.choices,
    )
    amount       = models.DecimalField(
        _('montant (FCFA)'),
        max_digits=12, decimal_places=0,
        validators=[MinValueValidator(0)],
    )
    currency     = models.CharField(_('devise'), max_length=3, default='XAF')
    method       = models.CharField(
        _('moyen de paiement'),
        max_length=20,
        choices=Method.choices,
        default=Method.MTN_MOMO,
    )
    provider     = models.CharField(
        _('fournisseur'),
        max_length=100,
        blank=True,
        help_text=_('Nom du fournisseur de paiement (MTN, Orange, etc.)'),
    )
    # Référence externe (retournée par le fournisseur)
    transaction_ref = models.CharField(
        _('référence transaction'),
        max_length=200,
        blank=True,
    )
    phone_number = models.CharField(
        _('numéro de téléphone'),
        max_length=20,
        blank=True,
        help_text=_('Numéro Mobile Money utilisé pour le paiement'),
    )
    status     = models.CharField(
        _('statut'),
        max_length=20,
        choices=Status.choices,
        default=Status.EN_ATTENTE,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('paiement')
        verbose_name_plural = _('paiements')
        ordering = ['-created_at']
        # Un seul acompte et un seul solde par réservation
        unique_together = [('booking', 'payment_type')]

    def __str__(self):
        return f'{self.get_payment_type_display()} — {self.amount} {self.currency} [{self.status}]'


class ProgressReaction(models.Model):
    """
    Réaction du client à une étape de travaux.
    Peut être un commentaire texte ou une photo (ex: zone à corriger).
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    progress    = models.ForeignKey(
        WorkProgress,
        on_delete=models.CASCADE,
        related_name='reactions',
        verbose_name=_('étape'),
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='progress_reactions',
        verbose_name=_('auteur'),
    )
    comment = models.TextField(_('commentaire'), blank=True)
    photo   = models.FileField(
        _('photo'),
        upload_to='progress_reactions/%Y/%m/',
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('réaction')
        verbose_name_plural = _('réactions')
        ordering = ['created_at']

    def __str__(self):
        return f'Réaction de {self.author.get_full_name()} sur {self.progress.step_label}'
