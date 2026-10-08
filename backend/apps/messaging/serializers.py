"""
PaintMatch — Serializers de l'application messaging.
"""

from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name    = serializers.SerializerMethodField()
    sender_id      = serializers.UUIDField(source='sender.id', read_only=True)
    is_mine        = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = ['id', 'sender_id', 'sender_name', 'content', 'is_read', 'created_at', 'is_mine']
        read_only_fields = ['id', 'sender_id', 'sender_name', 'is_read', 'created_at', 'is_mine']

    def get_sender_name(self, obj):
        return obj.sender.get_full_name()

    def get_is_mine(self, obj):
        request = self.context.get('request')
        if request:
            return obj.sender_id == request.user.id
        return False


class ConversationListSerializer(serializers.ModelSerializer):
    """Résumé d'une conversation pour la liste."""

    other_user_name   = serializers.SerializerMethodField()
    other_user_id     = serializers.SerializerMethodField()
    last_message      = serializers.SerializerMethodField()
    unread_count      = serializers.SerializerMethodField()
    painter_id        = serializers.IntegerField(source='painter.id', read_only=True)

    class Meta:
        model  = Conversation
        fields = [
            'id', 'other_user_name', 'other_user_id', 'painter_id',
            'last_message', 'unread_count', 'updated_at',
        ]
        read_only_fields = fields

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        if not request:
            return ''
        user = request.user
        if user.role == 'CLIENT':
            return obj.painter.user.get_full_name()
        return obj.client.get_full_name()

    def get_other_user_id(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        user = request.user
        if user.role == 'CLIENT':
            return str(obj.painter.user.id)
        return str(obj.client.id)

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {
                'content':    last.content[:80] + ('...' if len(last.content) > 80 else ''),
                'created_at': last.created_at,
                'is_mine':    last.sender_id == self.context.get('request').user.id
                              if self.context.get('request') else False,
            }
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request:
            return obj.get_unread_count(request.user)
        return 0


class ConversationDetailSerializer(serializers.ModelSerializer):
    """Conversation complète avec ses messages."""

    messages          = MessageSerializer(many=True, read_only=True)
    other_user_name   = serializers.SerializerMethodField()
    painter_id        = serializers.IntegerField(source='painter.id', read_only=True)

    class Meta:
        model  = Conversation
        fields = [
            'id', 'other_user_name', 'painter_id',
            'messages', 'created_at', 'updated_at',
        ]
        read_only_fields = fields

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        if not request:
            return ''
        if request.user.role == 'CLIENT':
            return obj.painter.user.get_full_name()
        return obj.client.get_full_name()


class SendMessageSerializer(serializers.Serializer):
    """Envoi d'un message dans une conversation."""
    content = serializers.CharField(min_length=1, max_length=2000)
