from django.contrib import admin
from .models import AdminLog, PlatformSettings


@admin.register(AdminLog)
class AdminLogAdmin(admin.ModelAdmin):
    list_display  = ('timestamp', 'admin', 'action', 'target_label', 'note')
    list_filter   = ('action',)
    search_fields = ('admin__email', 'target_label', 'note')
    readonly_fields = ('timestamp', 'admin', 'action', 'target_model', 'target_id', 'target_label', 'note')

    def has_add_permission(self, request):
        return False  # Les logs sont créés uniquement via le code

    def has_delete_permission(self, request, obj=None):
        return False  # Les logs ne doivent pas être supprimés


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display  = ('key', 'value', 'description', 'updated_at')
    search_fields = ('key', 'description')
    readonly_fields = ('updated_at',)
