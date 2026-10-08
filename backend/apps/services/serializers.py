"""
PaintMatch — Serializers de l'application services.

Couvre :
- ServiceCategory  : lecture publique des catégories
- Skill            : lecture publique des compétences
- PainterSkill     : CRUD par le peintre
- Qualification    : CRUD par le peintre
- ProfessionalDoc  : upload/lecture par le peintre, lecture admin
- Portfolio        : CRUD par le peintre
- PortfolioImage   : upload/suppression par le peintre
- ServiceOffer     : CRUD par le peintre
"""

import os
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from .models import (
    ServiceCategory, Skill, PainterSkill,
    Qualification, ProfessionalDoc, Portfolio,
    PortfolioImage, ServiceOffer,
)


# ---------------------------------------------------------------------------
# Catégories (lecture publique)
# ---------------------------------------------------------------------------

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'is_active', 'order']
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Compétences (lecture publique)
# ---------------------------------------------------------------------------

class SkillSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'name', 'category', 'category_name']
        read_only_fields = ['id', 'category_name']


# ---------------------------------------------------------------------------
# Compétences du peintre
# ---------------------------------------------------------------------------

class PainterSkillSerializer(serializers.ModelSerializer):
    skill_name     = serializers.CharField(source='skill.name', read_only=True)
    category_name  = serializers.CharField(source='skill.category.name', read_only=True)
    level_display  = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = PainterSkill
        fields = ['id', 'skill', 'skill_name', 'category_name', 'level', 'level_display']
        read_only_fields = ['id', 'skill_name', 'category_name', 'level_display']

    def validate(self, attrs):
        painter = self.context['request'].user.painter_profile
        skill   = attrs.get('skill')
        # Empêche les doublons (skill déjà ajouté par ce peintre)
        qs = PainterSkill.objects.filter(painter=painter, skill=skill)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                {'skill': _('Vous avez déjà ajouté cette compétence.')}
            )
        return attrs

    def create(self, validated_data):
        validated_data['painter'] = self.context['request'].user.painter_profile
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Qualifications
# ---------------------------------------------------------------------------

class QualificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Qualification
        fields = [
            'id', 'title', 'issuing_body', 'date_obtained',
            'description', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['painter'] = self.context['request'].user.painter_profile
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Documents professionnels
# ---------------------------------------------------------------------------

def validate_document_file(file):
    """Valide le type et la taille du fichier uploadé."""
    allowed_types = getattr(settings, 'ALLOWED_DOCUMENT_TYPES', [
        'application/pdf', 'image/jpeg', 'image/png'
    ])
    max_size_mb = getattr(settings, 'MAX_DOCUMENT_SIZE_MB', 5)

    # Vérification de la taille
    if file.size > max_size_mb * 1024 * 1024:
        raise serializers.ValidationError(
            _(f'Le fichier dépasse la taille maximale de {max_size_mb} Mo.')
        )

    # Vérification de l'extension (fallback si content_type non disponible)
    ext = os.path.splitext(file.name)[1].lower()
    allowed_exts = ['.pdf', '.jpg', '.jpeg', '.png']
    if ext not in allowed_exts:
        raise serializers.ValidationError(
            _('Format non autorisé. Formats acceptés : PDF, JPEG, PNG.')
        )
    return file


class ProfessionalDocSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(
        source='get_doc_type_display', read_only=True
    )

    class Meta:
        model = ProfessionalDoc
        fields = [
            'id', 'doc_type', 'doc_type_display', 'title',
            'file', 'uploaded_at', 'is_verified',
        ]
        read_only_fields = ['id', 'uploaded_at', 'is_verified', 'doc_type_display']

    def validate_file(self, value):
        return validate_document_file(value)

    def create(self, validated_data):
        validated_data['painter'] = self.context['request'].user.painter_profile
        return super().create(validated_data)


class ProfessionalDocAdminSerializer(ProfessionalDocSerializer):
    """Version admin — peut marquer un document comme vérifié."""

    class Meta(ProfessionalDocSerializer.Meta):
        read_only_fields = ['id', 'uploaded_at', 'doc_type_display']


# ---------------------------------------------------------------------------
# Portfolio — Images
# ---------------------------------------------------------------------------

class PortfolioImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortfolioImage
        fields = ['id', 'image', 'caption', 'is_cover', 'order']
        read_only_fields = ['id']

    def validate_image(self, value):
        max_size_mb = 10
        if value.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(
                _(f'L\'image dépasse la taille maximale de {max_size_mb} Mo.')
            )
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
            raise serializers.ValidationError(
                _('Format non autorisé. Formats acceptés : JPEG, PNG, WebP.')
            )
        return value


# ---------------------------------------------------------------------------
# Portfolio — Réalisations
# ---------------------------------------------------------------------------

class PortfolioSerializer(serializers.ModelSerializer):
    images        = PortfolioImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    cover_image   = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            'id', 'title', 'description', 'category', 'category_name',
            'location', 'date_completed', 'created_at', 'images', 'cover_image',
        ]
        read_only_fields = ['id', 'created_at', 'category_name', 'cover_image', 'images']

    def get_cover_image(self, obj):
        cover = obj.images.filter(is_cover=True).first() or obj.images.first()
        if cover:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(cover.image.url)
            return cover.image.url
        return None

    def create(self, validated_data):
        validated_data['painter'] = self.context['request'].user.painter_profile
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Offres de services
# ---------------------------------------------------------------------------

class ServiceOfferSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = ServiceOffer
        fields = [
            'id', 'category', 'category_name', 'title', 'description',
            'price_range_min', 'price_range_max', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'category_name']

    def validate(self, attrs):
        min_p = attrs.get('price_range_min')
        max_p = attrs.get('price_range_max')
        if min_p and max_p and min_p > max_p:
            raise serializers.ValidationError(
                {'price_range_max': _('Le prix maximum doit être supérieur au prix minimum.')}
            )
        return attrs

    def create(self, validated_data):
        validated_data['painter'] = self.context['request'].user.painter_profile
        return super().create(validated_data)


# ---------------------------------------------------------------------------
# Profil peintre complet (lecture publique — agrège tout)
# ---------------------------------------------------------------------------

class PainterFullProfileSerializer(serializers.Serializer):
    """
    Lecture publique du profil complet d'un peintre validé.
    Utilisé par les visiteurs et clients pour consulter un profil.
    """
    from apps.accounts.serializers import PainterProfilePublicSerializer

    profile    = serializers.SerializerMethodField()
    skills     = serializers.SerializerMethodField()
    qualifications = serializers.SerializerMethodField()
    portfolio  = serializers.SerializerMethodField()
    offers     = serializers.SerializerMethodField()

    def get_profile(self, obj):
        from apps.accounts.serializers import PainterProfilePublicSerializer
        return PainterProfilePublicSerializer(obj, context=self.context).data

    def get_skills(self, obj):
        return PainterSkillSerializer(
            obj.painter_skills.select_related('skill__category').all(),
            many=True, context=self.context
        ).data

    def get_qualifications(self, obj):
        return QualificationSerializer(
            obj.qualifications.all(), many=True, context=self.context
        ).data

    def get_portfolio(self, obj):
        return PortfolioSerializer(
            obj.portfolio_items.prefetch_related('images').all(),
            many=True, context=self.context
        ).data

    def get_offers(self, obj):
        return ServiceOfferSerializer(
            obj.service_offers.filter(is_active=True).select_related('category').all(),
            many=True, context=self.context
        ).data
