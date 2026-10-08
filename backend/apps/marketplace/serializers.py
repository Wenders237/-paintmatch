"""
PaintMatch — Serializers de l'application marketplace.
"""

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from .models import Availability


# ---------------------------------------------------------------------------
# Disponibilités
# ---------------------------------------------------------------------------

class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Availability
        fields = ['id', 'date_start', 'date_end', 'is_available', 'note', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        start = attrs.get('date_start')
        end   = attrs.get('date_end')
        if start and end and end < start:
            raise serializers.ValidationError(
                {'date_end': _('La date de fin doit être après la date de début.')}
            )
        return attrs

    def create(self, validated_data):
        validated_data['painter'] = self.context['request'].user.painter_profile
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Résultat de recherche / recommandation
# ---------------------------------------------------------------------------

class PainterSearchResultSerializer(serializers.Serializer):
    """
    Représentation d'un peintre dans les résultats de recherche.
    Inclut le score de recommandation et l'explication.
    """

    id              = serializers.SerializerMethodField()
    full_name       = serializers.SerializerMethodField()
    first_name      = serializers.SerializerMethodField()
    last_name       = serializers.SerializerMethodField()
    city            = serializers.SerializerMethodField()
    bio             = serializers.SerializerMethodField()
    years_experience = serializers.SerializerMethodField()
    average_rating  = serializers.SerializerMethodField()
    total_reviews   = serializers.SerializerMethodField()
    is_featured     = serializers.SerializerMethodField()
    skills_preview  = serializers.SerializerMethodField()
    avatar_url      = serializers.SerializerMethodField()
    portfolio_cover = serializers.SerializerMethodField()

    # Champs du moteur de recommandation
    score           = serializers.FloatField()
    explanation     = serializers.CharField()

    def _painter(self, obj):
        return obj['painter']

    def get_id(self, obj):
        return self._painter(obj).id

    def get_full_name(self, obj):
        return self._painter(obj).user.get_full_name()

    def get_first_name(self, obj):
        return self._painter(obj).user.first_name

    def get_last_name(self, obj):
        return self._painter(obj).user.last_name

    def get_city(self, obj):
        return self._painter(obj).user.city

    def get_bio(self, obj):
        bio = self._painter(obj).bio or ''
        # Tronquer à 150 caractères pour la liste
        return bio[:150] + '...' if len(bio) > 150 else bio

    def get_years_experience(self, obj):
        return self._painter(obj).years_experience

    def get_average_rating(self, obj):
        return float(self._painter(obj).average_rating)

    def get_total_reviews(self, obj):
        return self._painter(obj).total_reviews

    def get_is_featured(self, obj):
        return self._painter(obj).is_featured

    def get_skills_preview(self, obj):
        """Retourne les 3 premières compétences pour l'aperçu."""
        skills = self._painter(obj).painter_skills.select_related(
            'skill__category'
        ).all()[:3]
        return [
            {'name': ps.skill.name, 'level': ps.level}
            for ps in skills
        ]

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        painter = self._painter(obj)
        try:
            if painter.user.avatar and request:
                return request.build_absolute_uri(painter.user.avatar.url)
        except Exception:
            pass
        return None

    def get_portfolio_cover(self, obj):
        """Retourne la photo de couverture de la première réalisation."""
        request = self.context.get('request')
        painter = self._painter(obj)
        try:
            portfolio = painter.portfolio_items.prefetch_related('images').first()
            if portfolio:
                cover = portfolio.images.filter(is_cover=True).first() \
                     or portfolio.images.first()
                if cover and request:
                    return request.build_absolute_uri(cover.image.url)
        except Exception:
            pass
        return None
