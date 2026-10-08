from django.contrib import admin
from .models import QuoteRequest, Quote, QuoteItem, Booking, WorkProgress, Payment


class QuoteItemInline(admin.TabularInline):
    model = QuoteItem
    extra = 0


@admin.register(QuoteRequest)
class QuoteRequestAdmin(admin.ModelAdmin):
    list_display  = ('client', 'painter', 'title', 'status', 'created_at')
    list_filter   = ('status',)
    search_fields = ('client__email', 'painter__user__email', 'title')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Quote)
class QuoteAdmin(admin.ModelAdmin):
    list_display  = ('painter', 'total_amount', 'status', 'ai_assisted', 'created_at')
    list_filter   = ('status', 'ai_assisted')
    inlines       = [QuoteItemInline]
    readonly_fields = ('created_at', 'updated_at', 'sent_at')


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ('client', 'painter', 'status', 'scheduled_date', 'created_at')
    list_filter   = ('status',)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ('booking', 'payment_type', 'amount', 'method', 'status', 'created_at')
    list_filter   = ('payment_type', 'method', 'status')
    readonly_fields = ('created_at', 'updated_at')
