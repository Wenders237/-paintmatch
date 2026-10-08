"""
PaintMatch — Serializers pour l'application accounts.

Couvre :
- Inscription client et peintre
- Connexion (JWT enrichi)
- Profil utilisateur (lecture / modification)
- Profil peintre et client
- Changement de mot de passe
"""

from django.contrib.auth import password_validation
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, ClientProfile, PainterProfile, UserRole


# ---------------------------------------------------------------------------
# JWT personnalisé — ajoute des infos utiles dans le token
# ---------------------------------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Surcharge du serializer JWT pour inclure dans le token :
    rôle, nom complet, statut de validation (pour les peintres).
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['full_name'] = user.get_full_name()
        token['role'] = user.role
        # Récupération sécurisée de l'avatar
        try:
            token['avatar'] = user.avatar.url if user.avatar else None
        except Exception:
            token['avatar'] = None

        # Pour les peintres : inclure le statut de validation
        if user.role == UserRole.PEINTRE:
            try:
                token['validation_status'] = user.painter_profile.validation_status
            except PainterProfile.DoesNotExist:
                token['validation_status'] = None

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Ajouter les infos utilisateur dans la réponse (en plus des tokens)
        data['user'] = UserSummarySerializer(self.user).data
        return data


# ---------------------------------------------------------------------------
# Serializer de résumé utilisateur (utilisé dans les réponses JWT et listes)
# ---------------------------------------------------------------------------

class UserSummarySerializer(serializers.ModelSerializer):
    """Représentation légère de l'utilisateur pour les réponses rapides."""

    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    validation_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'avatar_url', 'city', 'email_verified', 'validation_status',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        try:
            if obj.avatar and request:
                return request.build_absolute_uri(obj.avatar.url)
        except Exception:
            pass
        return None

    def get_validation_status(self, obj):
        if obj.role == UserRole.PEINTRE:
            try:
                return obj.painter_profile.validation_status
            except PainterProfile.DoesNotExist:
                return None
        return None


# ---------------------------------------------------------------------------
# Inscription
# ---------------------------------------------------------------------------

class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer d'inscription commun.
    Le champ `role` doit être CLIENT ou PEINTRE (pas ADMIN).
    Le mot de passe est validé selon les règles Django.
    """

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        label=_('Mot de passe'),
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label=_('Confirmer le mot de passe'),
    )

    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'city', 'role', 'password', 'password_confirm',
        ]

    def validate_role(self, value):
        """Empêche la création de comptes ADMIN via l'API publique."""
        if value == UserRole.ADMIN:
            raise serializers.ValidationError(
                _('La création d\'un compte administrateur n\'est pas autorisée ici.')
            )
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                _('Un compte avec cette adresse e-mail existe déjà.')
            )
        return value.lower()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError(
                {'password_confirm': _('Les mots de passe ne correspondent pas.')}
            )
        # Validation selon les règles Django (longueur, complexité, etc.)
        password_validation.validate_password(attrs['password'])
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ---------------------------------------------------------------------------
# Profil utilisateur complet (lecture / mise à jour)
# ---------------------------------------------------------------------------

class UserProfileSerializer(serializers.ModelSerializer):
    """Lecture et modification du profil personnel de l'utilisateur connecté."""

    avatar_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone',
            'city', 'address', 'role', 'avatar', 'avatar_url',
            'email_verified', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'email_verified', 'date_joined', 'avatar_url']

    def get_avatar_url(self, obj):
        request = self.context.get('request')
        try:
            if obj.avatar and request:
                return request.build_absolute_uri(obj.avatar.url)
        except Exception:
            pass
        return None


# ---------------------------------------------------------------------------
# Profil client
# ---------------------------------------------------------------------------

class ClientProfileSerializer(serializers.ModelSerializer):
    """Lecture et modification du profil client."""

    user = UserProfileSerializer(read_only=True)

    class Meta:
        model = ClientProfile
        fields = ['id', 'user', 'preferences']


# ---------------------------------------------------------------------------
# Profil peintre — lecture publique (visiteur / client)
# ---------------------------------------------------------------------------

class PainterProfilePublicSerializer(serializers.ModelSerializer):
    """
    Représentation publique du profil peintre.
    Affichée aux visiteurs et clients lors de la recherche.
    Ne retourne que les données non sensibles.
    """

    user = UserSummarySerializer(read_only=True)
    is_validated = serializers.BooleanField(read_only=True)

    class Meta:
        model = PainterProfile
        fields = [
            'id', 'user', 'bio', 'years_experience',
            'validation_status', 'is_validated',
            'average_rating', 'total_reviews', 'is_featured',
        ]
        read_only_fields = fields


# ---------------------------------------------------------------------------
# Profil peintre — lecture/modification par le peintre lui-même
# ---------------------------------------------------------------------------

class PainterProfileSerializer(serializers.ModelSerializer):
    """
    Profil peintre complet — accessible uniquement par le peintre propriétaire.
    Inclut les données professionnelles modifiables.
    """

    user = UserProfileSerializer(read_only=True)
    validation_status = serializers.CharField(read_only=True)
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    total_reviews = serializers.IntegerField(read_only=True)

    class Meta:
        model = PainterProfile
        fields = [
            'id', 'user', 'bio', 'years_experience', 'professional_id',
            'validation_status', 'validation_date', 'validation_note',
            'average_rating', 'total_reviews', 'is_featured',
        ]
        read_only_fields = [
            'id', 'user', 'validation_status', 'validation_date',
            'validation_note', 'average_rating', 'total_reviews', 'is_featured',
        ]


# ---------------------------------------------------------------------------
# Changement de mot de passe
# ---------------------------------------------------------------------------

class ChangePasswordSerializer(serializers.Serializer):
    """Permet à l'utilisateur connecté de changer son mot de passe."""

    old_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label=_('Ancien mot de passe'),
    )
    new_password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        label=_('Nouveau mot de passe'),
    )
    new_password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        label=_('Confirmer le nouveau mot de passe'),
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                _('L\'ancien mot de passe est incorrect.')
            )
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError(
                {'new_password_confirm': _('Les nouveaux mots de passe ne correspondent pas.')}
            )
        password_validation.validate_password(attrs['new_password'])
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
