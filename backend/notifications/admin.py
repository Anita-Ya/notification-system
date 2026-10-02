from django.contrib import admin
from notifications.models import Trigger, ChannelTemplate, NotificationLog, WebPushSubscription, UserProfile

class ChannelTemplateInline(admin.TabularInline):
    model = ChannelTemplate
    extra = 0
    fields = ('channel', 'is_enabled', 'title', 'body', 'status')

@admin.register(Trigger)
class TriggerAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'updated_at')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ChannelTemplateInline]
    search_fields = ('name', 'slug', 'description')

@admin.register(ChannelTemplate)
class ChannelTemplateAdmin(admin.ModelAdmin):
    list_display = ('trigger', 'channel', 'is_enabled', 'title', 'status', 'updated_at')
    list_filter = ('channel', 'is_enabled', 'status')
    search_fields = ('trigger__name', 'title', 'body')

@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'trigger', 'channel', 'recipient', 'status', 'is_test')
    list_filter = ('channel', 'status', 'is_test', 'created_at')
    search_fields = ('recipient', 'title', 'body')
    readonly_fields = ('created_at',)

@admin.register(WebPushSubscription)
class WebPushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'created_at', 'endpoint')
    search_fields = ('endpoint', 'user__username')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone_number', 'last_activity')
