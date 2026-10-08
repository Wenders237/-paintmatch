from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display  = ('client', 'painter', 'rating', 'is_visible', 'created_at')
    list_filter   = ('rating', 'is_visible')
    search_fields = ('client__email', 'painter__user__email', 'comment')
    list_editable = ('is_visible',)
    readonly_fields = ('created_at', 'updated_at', 'client', 'painter', 'booking')
