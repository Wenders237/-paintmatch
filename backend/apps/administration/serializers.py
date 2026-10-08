"""
PaintMatch — Serializers de l'application administration.
"""

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from apps.accounts.models import User, PainterProfile, ValidationStatus, UserRole
from apps.services.models import ProfessionalDoc, PainterSkill, Qualification, Portfolio
from .models import AdminLog, PlatformSettings


# ---------------------------------------------------------------------------
# Utilisateurs (vue admin)
# ---------------------------------------------------------------------------

class AdminUserSerializer(serializers.ModelSerializer):
    """Représentation d'un utilisateur pour l'administration."""

    full_name            = serializers.SerializerMethodField()
    validation_status    = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'city', 'is_active', 'email_verified',
            'date_joined', 'last_login', 'validation_status',
        ]
        read_only_fields = ['id', 'email', 'role', 'date_joined', 'last_login', 'full_name', 'validation_status']

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_validation_status(self, obj):
        if obj.role == UserRole.PEINTRE:
            try:
                return obj.painter_profile.validation_status
            except Exception:
                return None
        return None


class AdminUserUpdateSerializer(serializers.ModelSerializer):
    """Modification limitée d'un utilisateur par l'admin."""

    class Meta:
        model  = User
        fields = ['first_name', 'last_name', 'phone', 'city', 'is_active']


# ---------------------------------------------------------------------------
# Documents professionnels (vue admin)
# ---------------------------------------------------------------------------

class AdminDocSerializer(serializers.ModelSerializer):
    doc_type_display = serializers.CharField(source='get_doc_type_display', read_only=True)

    class Meta:
        model  = ProfessionalDoc
        fields = ['id', 'doc_type', 'doc_type_display', 'title', 'file', 'uploaded_at', 'is_verified']


# ---------------------------------------------------------------------------
# Profil peintre complet (vue admin — dossier de validation)
# ---------------------------------------------------------------------------

class AdminPainterDossierSerializer(serializers.ModelSerializer):
    """
    Dossier complet d'un peintre pour l'administrateur.
    Inclut toutes les informations nécessaires à la décision de validation.
    """

    user             = AdminUserSerializer(read_only=True)
    skills           = serializers.SerializerMethodField()
    qualifications   = serializers.SerializerMethodField()
    documents        = serializers.SerializerMethodField()
    portfolio_count  = serializers.SerializerMethodField()

    class Meta:
        model  = PainterProfile
        fields = [
            'id', 'user', 'bio', 'years_experience', 'professional_id',
            'validation_status', 'validation_date', 'validation_note',
            'average_rating', 'total_reviews',
            'skills', 'qualifications', 'documents', 'portfolio_count',
        ]
        read_only_fields = fields

    def get_skills(self, obj):
        return [
            {'skill_name': ps.skill.name, 'level': ps.level}
            for ps in obj.painter_skills.select_related('skill').all()
        ]

    def get_qualifications(self, obj):
        return [
            {
                'title': q.title,
                'issuing_body': q.issuing_body,
                'date_obtained': q.date_obtained,
            }
            for q in obj.qualifications.all()
        ]

    def get_documents(self, obj):
        request = self.context.get('request')
        docs = []
        for doc in obj.professional_docs.all():
            url = None
            try:
                url = request.build_absolute_uri(doc.file.url) if request else doc.file.url
            except Exception:
                pass
            docs.append({
                'id': str(doc.id),
                'type': doc.get_doc_type_display(),
                'title': doc.title,
                'file': url,
                'is_verified': doc.is_verified,
                'uploaded_at': doc.uploaded_at,
            })
        return docs

    def get_portfolio_count(self, obj):
        return obj.portfolio_items.count()


# ---------------------------------------------------------------------------
# Résumé peintre (pour la liste d'attente)
# ---------------------------------------------------------------------------

class AdminPainterListSerializer(serializers.ModelSerializer):
    """Résumé d'un peintre pour la liste de validation."""

    email            = serializers.CharField(source='user.email', read_only=True)
    full_name        = serializers.SerializerMethodField()
    city             = serializers.CharField(source='user.city', read_only=True)
    date_joined      = serializers.DateTimeField(source='user.date_joined', read_only=True)
    documents_count  = serializers.SerializerMethodField()
    skills_count     = serializers.SerializerMethodField()

    class Meta:
        model  = PainterProfile
        fields = [
            'id', 'email', 'full_name', 'city', 'date_joined',
            'validation_status', 'validation_date', 'validation_note',
            'years_experience', 'documents_count', 'skills_count',
            'average_rating', 'total_reviews',
        ]

    def get_full_name(self, obj):
        return obj.user.get_full_name()

    def get_documents_count(self, obj):
        return obj.professional_docs.count()

    def get_skills_count(self, obj):
        return obj.painter_skills.count()


# ---------------------------------------------------------------------------
# Action de validation
# ---------------------------------------------------------------------------

class ValidationActionSerializer(serializers.Serializer):
    """
    Serializer pour les actions de validation admin.
    action : VALIDE | REFUSE | SUSPENDU | COMPLEMENT
    note   : message envoyé au peintre (obligatoire pour REFUSE et COMPLEMENT)
    """

    ACTION_CHOICES = [
        ('VALIDE',     _('Valider')),
        ('REFUSE',     _('Refuser')),
        ('SUSPENDU',   _('Suspendre')),
        ('COMPLEMENT', _('Demander un complément')),
    ]

    action = serializers.ChoiceField(choices=ACTION_CHOICES)
    note   = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=1000,
        help_text=_('Motif ou message pour le peintre'),
    )

    def validate(self, attrs):
        action = attrs.get('action')
        note   = attrs.get('note', '').strip()
        if action in ('REFUSE', 'COMPLEMENT') and not note:
            raise serializers.ValidationError(
                {'note': _('Un motif est obligatoire pour un refus ou une demande de complément.')}
            )
        return attrs


# ---------------------------------------------------------------------------
# Statistiques globales
# ---------------------------------------------------------------------------

class PlatformStatsSerializer(serializers.Serializer):
    """Statistiques générales de la plateforme."""

    clients_count      = serializers.IntegerField()
    painters_total     = serializers.IntegerField()
    painters_validated = serializers.IntegerField()
    painters_pending   = serializers.IntegerField()
    quotes_count       = serializers.IntegerField()
    reviews_count      = serializers.IntegerField()


# ---------------------------------------------------------------------------
# Journal admin
# ---------------------------------------------------------------------------

class AdminLogSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model  = AdminLog
        fields = [
            'id', 'admin_name', 'action', 'action_display',
            'target_label', 'note', 'timestamp',
        ]
        read_only_fields = fields

    def get_admin_name(self, obj):
        return obj.admin.get_full_name() if obj.admin else 'Système'


# ---------------------------------------------------------------------------
# Paramètres plateforme
# ---------------------------------------------------------------------------

class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PlatformSettings
        fields = ['id', 'key', 'value', 'description', 'updated_at']
        read_only_fields = ['id', 'updated_at']
