from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Trigger(models.Model):
    """
    A Trigger is an event or condition that causes a notification to go out.
    One trigger = one row in the admin matrix.
    """
    name = models.CharField(max_length=100, help_text="Human-readable trigger name (e.g. Login, Logout)")
    slug = models.SlugField(max_length=100, unique=True, help_text="Unique slug for code triggering (e.g. login, logout)")
    description = models.TextField(blank=True, help_text="Description of when this trigger fires")
    is_active = models.BooleanField(default=True, help_text="Master active toggle for this trigger")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.slug})"


class ChannelTemplate(models.Model):
    """
    Template for a specific trigger on a specific channel.
    Each cell in the admin matrix corresponds to one ChannelTemplate.
    """
    CHANNEL_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'Email'),
        ('web_push', 'Web Push'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('active', 'Active'),
    ]

    trigger = models.ForeignKey(Trigger, on_delete=models.CASCADE, related_name='templates')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    is_enabled = models.BooleanField(default=True, help_text="Toggle channel ON or OFF for this trigger")
    
    # Template contents
    title = models.CharField(
        max_length=255, 
        blank=True, 
        help_text="Email Subject, Web Push Title, or WhatsApp Template Header"
    )
    body = models.TextField(
        help_text="Message body. Supports variables like {{username}}, {{email}}, {{time}}, etc."
    )
    
    # Status (especially useful for WhatsApp template sync & approval workflow)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='approved')
    meta_template_name = models.CharField(max_length=100, blank=True, help_text="Meta WhatsApp template name if synced")
    
    # Configuration metadata
    variables_schema = models.JSONField(default=list, blank=True, help_text="List of supported variables")
    extra_config = models.JSONField(
        default=dict, 
        blank=True, 
        help_text="Extra settings e.g. icon URL, target URL for Web Push, button action"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('trigger', 'channel')
        ordering = ['trigger_id', 'channel']

    def __str__(self):
        return f"{self.trigger.name} - {self.get_channel_display()} ({'Enabled' if self.is_enabled else 'Disabled'})"


class NotificationLog(models.Model):
    """
    Audit log of every notification dispatched or simulated.
    """
    STATUS_CHOICES = [
        ('sent', 'Sent Successfully'),
        ('failed', 'Delivery Failed'),
        ('simulated', 'Simulated (Sandbox/Mock)'),
        ('skipped', 'Skipped (Channel Disabled)'),
    ]

    trigger = models.ForeignKey(Trigger, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    channel = models.CharField(max_length=20, choices=ChannelTemplate.CHANNEL_CHOICES)
    recipient = models.CharField(max_length=255, help_text="Phone number, email address, or browser push endpoint")
    title = models.CharField(max_length=255, blank=True)
    body = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    service_response = models.JSONField(default=dict, blank=True, help_text="Provider API response or error trace")
    is_test = models.BooleanField(default=False, help_text="Whether this was triggered via Test Send button")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M:%S')}] {self.channel} to {self.recipient} - {self.status}"


class WebPushSubscription(models.Model):
    """
    Stores browser PushSubscription credentials (W3C standard VAPID Web Push).
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh = models.TextField()
    auth = models.TextField()
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Subscription #{self.id} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"


class UserProfile(models.Model):
    """
    Extra metadata for users (phone number, last activity for inactivity triggers).
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=30, blank=True, default='+1234567890')
    last_activity = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Profile of {self.user.username}"
