from django.contrib import admin
from .models import Availability, SearchLog


@admin.register(Availability)
class AvailabilityAdmin(admin.ModelAdmin):
    list_display = ('painter', 'date_start', 'date_end', 'is_available')
    list_filter = ('is_available',)
    search_fields = ('painter__user__email',)


@admin.register(SearchLog)
class SearchLogAdmin(admin.ModelAdmin):
    list_display = ('query_text', 'city', 'category', 'results_count', 'timestamp')
    list_filter = ('category',)
    readonly_fields = ('timestamp',)
