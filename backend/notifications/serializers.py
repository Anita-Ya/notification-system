from rest_framework import serializers
from django.contrib.auth.models import User
from notifications.models import Trigger, ChannelTemplate, NotificationLog, WebPushSubscription, UserProfile

class ChannelTemplateSerializer(serializers.ModelSerializer):
    trigger_name = serializers.ReadOnlyField(source='trigger.name')
    trigger_slug = serializers.ReadOnlyField(source='trigger.slug')

    class Meta:
        model = ChannelTemplate
        fields = [
            'id',
            'trigger',
            'trigger_name',
            'trigger_slug',
            'channel',
            'is_enabled',
            'title',
            'body',
            'status',
            'meta_template_name',
            'variables_schema',
            'extra_config',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TriggerSerializer(serializers.ModelSerializer):
    templates = ChannelTemplateSerializer(many=True, read_only=True)
    template_matrix = serializers.SerializerMethodField()

    class Meta:
        model = Trigger
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'is_active',
            'templates',
            'template_matrix',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_template_matrix(self, obj):
        """
        Organizes templates by channel: {'whatsapp': {...}, 'email': {...}, 'web_push': {...}}
        so the frontend table can render each cell instantaneously!
        """
        matrix = {'whatsapp': None, 'email': None, 'web_push': None}
        for tmpl in obj.templates.all():
            matrix[tmpl.channel] = ChannelTemplateSerializer(tmpl).data
        return matrix


class NotificationLogSerializer(serializers.ModelSerializer):
    trigger_name = serializers.ReadOnlyField(source='trigger.name', default='System Test')

    class Meta:
        model = NotificationLog
        fields = [
            'id',
            'trigger',
            'trigger_name',
            'channel',
            'recipient',
            'title',
            'body',
            'status',
            'service_response',
            'is_test',
            'created_at',
        ]


class WebPushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebPushSubscription
        fields = ['id', 'endpoint', 'p256dh', 'auth', 'user_agent', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['phone_number', 'last_activity']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'profile']
