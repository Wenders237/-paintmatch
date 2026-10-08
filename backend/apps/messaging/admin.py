from django.contrib import admin
from .models import Conversation, Message


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ('sender', 'content', 'is_read', 'created_at')


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display  = ('client', 'painter', 'created_at', 'updated_at')
    search_fields = ('client__email', 'painter__user__email')
    inlines       = [MessageInline]
    readonly_fields = ('created_at', 'updated_at')
