"""
PaintMatch — Configuration de l'administration Django pour accounts.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, ClientProfile, PainterProfile


class ClientProfileInline(admin.StackedInline):
    model = ClientProfile
    can_delete = False
    verbose_name_plural = _('Profil client')
    fk_name = 'user'


class PainterProfileInline(admin.StackedInline):
    model = PainterProfile
    can_delete = False
    verbose_name_plural = _('Profil peintre')
    fk_name = 'user'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_active', 'email_verified', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'email_verified')
    search_fields = ('email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        (_('Informations personnelles'), {'fields': (
            'first_name', 'last_name', 'phone', 'city', 'address', 'avatar'
        )}),
        (_('Rôle et statut'), {'fields': ('role', 'is_active', 'email_verified')}),
        (_('Permissions'), {'fields': ('is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Dates importantes'), {'fields': ('last_login', 'date_joined')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name', 'role', 'password1', 'password2'),
        }),
    )

    readonly_fields = ('date_joined', 'last_login')

    def get_inlines(self, request, obj=None):
        if obj is None:
            return []
        if obj.role == 'CLIENT':
            return [ClientProfileInline]
        elif obj.role == 'PEINTRE':
            return [PainterProfileInline]
        return []


@admin.register(PainterProfile)
class PainterProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'validation_status', 'years_experience', 'average_rating', 'total_reviews', 'is_featured')
    list_filter = ('validation_status', 'is_featured')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    readonly_fields = ('average_rating', 'total_reviews', 'validation_date')
    ordering = ('-average_rating',)
