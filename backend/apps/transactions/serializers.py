"""
PaintMatch — Serializers de l'application transactions.
"""

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.accounts.models import PainterProfile
from .models import QuoteRequest, Quote, QuoteItem, Booking, WorkProgress, Payment


# ---------------------------------------------------------------------------
# QuoteItem
# ---------------------------------------------------------------------------

class QuoteItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = QuoteItem
        fields = ['id', 'description', 'quantity', 'unit', 'unit_price', 'total_price', 'order']
        read_only_fields = ['id', 'total_price']


# ---------------------------------------------------------------------------
# Demande de devis
# ---------------------------------------------------------------------------

class QuoteRequestSerializer(serializers.ModelSerializer):
    """Création d'une demande de devis par un client."""

    client_name  = serializers.SerializerMethodField(read_only=True)
    painter_name = serializers.SerializerMethodField(read_only=True)
    has_quote    = serializers.SerializerMethodField(read_only=True)
    quote_status = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = QuoteRequest
        fields = [
            'id', 'client_name', 'painter', 'painter_name', 'category',
            'title', 'description', 'location', 'surface_m2',
            'desired_start_date', 'budget_max', 'status',
            'created_at', 'updated_at', 'has_quote', 'quote_status',
        ]
        read_only_fields = ['id', 'client_name', 'painter_name', 'status', 'created_at', 'updated_at', 'has_quote', 'quote_status']

    def get_client_name(self, obj):
        return obj.client.get_full_name()

    def get_painter_name(self, obj):
        return obj.painter.user.get_full_name()

    def get_has_quote(self, obj):
        return hasattr(obj, 'quote')

    def get_quote_status(self, obj):
        try:
            return obj.quote.status
        except Exception:
            return None

    def validate_painter(self, value):
        if value.validation_status != 'VALIDE':
            raise serializers.ValidationError(
                _('Ce peintre n\'est pas encore validé sur la plateforme.')
            )
        return value

    def create(self, validated_data):
        validated_data['client'] = self.context['request'].user
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Devis (lecture publique)
# ---------------------------------------------------------------------------

class QuoteSerializer(serializers.ModelSerializer):
    """Lecture d'un devis — accessible au client et au peintre."""

    items         = QuoteItemSerializer(many=True, read_only=True)
    painter_name  = serializers.CharField(source='painter.user.get_full_name', read_only=True)
    painter_id    = serializers.IntegerField(source='painter.id', read_only=True)
    request_title = serializers.CharField(source='request.title', read_only=True)
    client_name   = serializers.CharField(source='request.client.get_full_name', read_only=True)

    class Meta:
        model  = Quote
        fields = [
            'id', 'request', 'painter_name', 'painter_id', 'request_title', 'client_name',
            'intro_text', 'items', 'total_amount', 'valid_until',
            'notes', 'ai_assisted', 'status', 'client_note',
            'created_at', 'updated_at', 'sent_at',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Devis (rédaction par le peintre)
# ---------------------------------------------------------------------------

class QuoteWriteSerializer(serializers.ModelSerializer):
    """Création/modification d'un devis par le peintre."""

    items = QuoteItemSerializer(many=True)

    class Meta:
        model  = Quote
        fields = [
            'id', 'intro_text', 'items', 'total_amount',
            'valid_until', 'notes', 'ai_assisted', 'status',
        ]
        read_only_fields = ['id', 'status']

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                _('Le devis doit contenir au moins une ligne.')
            )
        return value

    def validate_total_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                _('Le montant total doit être supérieur à 0.')
            )
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quote      = Quote.objects.create(**validated_data)
        for item_data in items_data:
            QuoteItem.objects.create(quote=quote, **item_data)
        return quote

    def update(self, instance, validated_data):
        # Un devis envoyé ne peut plus être modifié
        if instance.status != Quote.Status.BROUILLON:
            raise serializers.ValidationError(
                _('Seul un devis en brouillon peut être modifié.')
            )
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuoteItem.objects.create(quote=instance, **item_data)

        return instance


# ---------------------------------------------------------------------------
# Actions sur le devis
# ---------------------------------------------------------------------------

class QuoteSendSerializer(serializers.Serializer):
    """Envoi d'un devis (peintre → client)."""
    pass  # Pas de données supplémentaires nécessaires


class QuoteClientActionSerializer(serializers.Serializer):
    """Action du client sur un devis reçu : accepter ou refuser."""

    ACTION_CHOICES = [
        ('ACCEPTE', _('Accepter')),
        ('REFUSE',  _('Refuser')),
    ]
    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    note   = serializers.CharField(
        required=False, allow_blank=True, max_length=500,
        help_text=_('Motif de refus (optionnel)'),
    )


# ---------------------------------------------------------------------------
# Réservation
# ---------------------------------------------------------------------------

class BookingSerializer(serializers.ModelSerializer):
    """Lecture d'une réservation."""

    client_name  = serializers.CharField(source='client.get_full_name', read_only=True)
    painter_name = serializers.CharField(source='painter.user.get_full_name', read_only=True)
    quote_amount = serializers.DecimalField(
        source='quote.total_amount', max_digits=12, decimal_places=0, read_only=True
    )
    progress_updates = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = [
            'id', 'quote', 'client_name', 'painter_name', 'quote_amount',
            'scheduled_date', 'status', 'created_at', 'progress_updates',
        ]
        read_only_fields = fields

    def get_progress_updates(self, obj):
        request = self.context.get('request')
        updates = obj.progress_updates.prefetch_related('reactions__author').order_by('created_at')
        result = []
        for u in updates:
            photo_url = None
            if u.photo:
                try:
                    photo_url = request.build_absolute_uri(u.photo.url) if request else u.photo.url
                except Exception:
                    pass

            reactions = []
            for r in u.reactions.all():
                r_photo = None
                if r.photo:
                    try:
                        r_photo = request.build_absolute_uri(r.photo.url) if request else r.photo.url
                    except Exception:
                        pass
                reactions.append({
                    'id':         str(r.id),
                    'author':     r.author.get_full_name(),
                    'author_role': r.author.role,
                    'comment':    r.comment,
                    'photo_url':  r_photo,
                    'created_at': r.created_at,
                })

            result.append({
                'id':          str(u.id),
                'step_label':  u.step_label,
                'description': u.description,
                'percentage':  u.percentage,
                'photo_url':   photo_url,
                'created_at':  u.created_at,
                'reactions':   reactions,
            })
        return result


# ---------------------------------------------------------------------------
# Assistance IA pour la rédaction de devis
# ---------------------------------------------------------------------------

class AIQuoteAssistSerializer(serializers.Serializer):
    """
    Paramètres pour l'assistance IA à la rédaction d'un devis.
    Le peintre fournit les infos de la demande,
    l'IA retourne une structure de devis suggérée.
    """
    quote_request_id = serializers.UUIDField()
