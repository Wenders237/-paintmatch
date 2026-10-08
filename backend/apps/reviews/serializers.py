"""
PaintMatch — Serializers de l'application reviews.
"""

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    """Lecture d'une évaluation — publique sur le profil peintre."""

    client_name  = serializers.CharField(source='client.get_full_name', read_only=True)
    client_city  = serializers.CharField(source='client.city', read_only=True)
    rating_stars = serializers.SerializerMethodField()

    class Meta:
        model  = Review
        fields = [
            'id', 'client_name', 'client_city', 'rating', 'rating_stars',
            'comment', 'painter_reply', 'created_at',
        ]
        read_only_fields = fields

    def get_rating_stars(self, obj):
        return '★' * obj.rating + '☆' * (5 - obj.rating)


class CreateReviewSerializer(serializers.ModelSerializer):
    """Création d'une évaluation par le client."""

    class Meta:
        model  = Review
        fields = ['booking', 'rating', 'comment']

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError(_('La note doit être entre 1 et 5.'))
        return value

    def validate_booking(self, value):
        user = self.context['request'].user

        # Vérifier que la réservation appartient au client
        if value.client != user:
            raise serializers.ValidationError(
                _('Cette réservation ne vous appartient pas.')
            )

        # Vérifier que les travaux sont terminés
        if value.status != 'TERMINE':
            raise serializers.ValidationError(
                _('Vous ne pouvez évaluer qu\'une prestation terminée.')
            )

        # Vérifier qu'il n'y a pas déjà une évaluation
        if hasattr(value, 'review'):
            raise serializers.ValidationError(
                _('Vous avez déjà évalué cette prestation.')
            )

        return value

    def create(self, validated_data):
        booking = validated_data['booking']
        validated_data['client']  = self.context['request'].user
        validated_data['painter'] = booking.painter
        return super().create(validated_data)


class PainterReplySerializer(serializers.ModelSerializer):
    """Le peintre répond à une évaluation."""

    class Meta:
        model  = Review
        fields = ['painter_reply']

    def validate_painter_reply(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                _('La réponse doit contenir au moins 10 caractères.')
            )
        return value.strip()
