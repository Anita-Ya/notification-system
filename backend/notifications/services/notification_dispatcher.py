import logging
from datetime import datetime
from django.utils import timezone
from notifications.models import Trigger, ChannelTemplate, NotificationLog
from .whatsapp_service import WhatsAppService
from .email_service import EmailService
from .webpush_service import WebPushService

logger = logging.getLogger(__name__)

def render_template_string(template_str: str, context: dict) -> str:
    """
    Replaces mustache-style placeholders like {{username}}, {{time}}, {{site_url}}
    with context values.
    """
    if not template_str:
        return ""
    result = str(template_str)
    for key, val in context.items():
        placeholder = f"{{{{{key}}}}}"
        result = result.replace(placeholder, str(val))
    return result


def dispatch_trigger(trigger_slug: str, user=None, context: dict = None, channel_override=None, is_test: bool = False, test_recipients: dict = None) -> dict:
    """
    Fires notifications across all enabled channels for the given trigger slug.
    
    Parameters:
    - trigger_slug: slug of the trigger to fire (e.g. 'login', 'logout')
    - user: optional Django User instance
    - context: dict of variables (e.g. {'username': 'Alice', 'time': '12:00 PM'})
    - channel_override: optional single channel to fire ('whatsapp', 'email', 'web_push')
    - is_test: boolean flag if called via test send
    - test_recipients: optional dict like {'whatsapp': '+1...', 'email': '...'}
    """
    try:
        trigger = Trigger.objects.get(slug=trigger_slug)
    except Trigger.DoesNotExist:
        return {
            "success": False,
            "error": f"Trigger with slug '{trigger_slug}' not found"
        }

    if not trigger.is_active:
        return {
            "success": False,
            "error": f"Trigger '{trigger.name}' is currently deactivated"
        }

    import os
    default_test_email = os.getenv('DEFAULT_TEST_EMAIL', 'yanitay1215@gmail.com').strip()
    default_test_phone = os.getenv('WHATSAPP_DEFAULT_TEST_PHONE', '+919001050074').strip()

    context = context or {}
    # Enrich default context
    now_str = timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    context.setdefault('time', now_str)
    context.setdefault('trigger_name', trigger.name)
    if user and user.is_authenticated:
        context.setdefault('username', user.username)
        user_email = user.email
        if not user_email or user_email.endswith('@example.com'):
            user_email = default_test_email
        context.setdefault('email', user_email)
        profile = getattr(user, 'profile', None)
        user_phone = profile.phone_number if profile and profile.phone_number and profile.phone_number != '+1234567890' else default_test_phone
        context.setdefault('phone', user_phone)
    else:
        context.setdefault('username', 'Valued User')
        context.setdefault('email', default_test_email)
        context.setdefault('phone', default_test_phone)

    test_recipients = test_recipients or {}
    templates_query = trigger.templates.all()
    if channel_override:
        templates_query = templates_query.filter(channel=channel_override)

    results = {}

    for template in templates_query:
        channel = template.channel
        
        # If disabled and not explicit test, log as skipped
        if not template.is_enabled and not is_test:
            NotificationLog.objects.create(
                trigger=trigger,
                channel=channel,
                recipient="N/A",
                title=template.title,
                body=template.body,
                status="skipped",
                service_response={"reason": "Channel toggle is OFF"},
                is_test=is_test
            )
            results[channel] = {
                "status": "skipped",
                "message": f"{channel} is turned OFF for this trigger"
            }
            continue

        rendered_title = render_template_string(template.title, context)
        rendered_body = render_template_string(template.body, context)

        # 1. WhatsApp Channel
        if channel == 'whatsapp':
            recipient_phone = test_recipients.get('whatsapp') or context.get('phone') or default_test_phone
            if recipient_phone == '+1234567890':
                recipient_phone = default_test_phone
            resp = WhatsAppService.send_message(
                recipient_phone=recipient_phone,
                body=rendered_body,
                title=rendered_title,
                template_name=template.meta_template_name
            )
            log_status = 'sent' if resp.get('status') == 'sent' else ('simulated' if resp.get('status') == 'simulated' else 'failed')
            NotificationLog.objects.create(
                trigger=trigger,
                channel=channel,
                recipient=recipient_phone,
                title=rendered_title,
                body=rendered_body,
                status=log_status,
                service_response=resp,
                is_test=is_test
            )
            results['whatsapp'] = resp

        # 2. Email Channel
        elif channel == 'email':
            recipient_email = test_recipients.get('email') or context.get('email') or default_test_email
            if not recipient_email or recipient_email.endswith('@example.com'):
                recipient_email = default_test_email
            resp = EmailService.send_email(
                recipient_email=recipient_email,
                subject=rendered_title,
                body=rendered_body
            )
            log_status = 'sent' if resp.get('status') == 'sent' else ('simulated' if resp.get('status') == 'simulated' else 'failed')
            NotificationLog.objects.create(
                trigger=trigger,
                channel=channel,
                recipient=recipient_email,
                title=rendered_title,
                body=rendered_body,
                status=log_status,
                service_response=resp,
                is_test=is_test
            )
            results['email'] = resp

        # 3. Web Push Channel
        elif channel == 'web_push':
            resp = WebPushService.send_push(
                title=rendered_title or f"Notification: {trigger.name}",
                body=rendered_body,
                user=user,
                extra_data=template.extra_config
            )
            log_status = 'sent' if resp.get('status') == 'sent' else ('simulated' if resp.get('status') == 'simulated' else 'failed')
            NotificationLog.objects.create(
                trigger=trigger,
                channel=channel,
                recipient="browser_subscribers",
                title=rendered_title,
                body=rendered_body,
                status=log_status,
                service_response=resp,
                is_test=is_test
            )
            results['web_push'] = resp

    return {
        "success": True,
        "trigger": trigger.name,
        "slug": trigger.slug,
        "results": results
    }


def test_send_template(template_id: int, recipient: str = None, custom_vars: dict = None) -> dict:
    """
    Sends a test notification for a specific channel template cell.
    """
    try:
        template = ChannelTemplate.objects.select_related('trigger').get(id=template_id)
    except ChannelTemplate.DoesNotExist:
        return {"success": False, "error": f"Template with ID {template_id} not found"}

    import os
    default_test_email = os.getenv('DEFAULT_TEST_EMAIL', 'yanitay1215@gmail.com').strip()
    default_test_phone = os.getenv('WHATSAPP_DEFAULT_TEST_PHONE', '+919001050074').strip()

    context = {
        'username': 'Test Candidate',
        'email': recipient if recipient and '@' in recipient and not recipient.endswith('@example.com') else default_test_email,
        'phone': recipient if recipient and ('+' in recipient or recipient.isdigit()) and recipient != '+1234567890' else default_test_phone,
        'time': timezone.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        'trigger_name': template.trigger.name,
        'order_id': 'ORD-9821'
    }
    if custom_vars:
        context.update(custom_vars)

    test_recipients = {}
    if template.channel == 'whatsapp':
        test_recipients['whatsapp'] = recipient or context['phone'] or default_test_phone
    elif template.channel == 'email':
        test_recipients['email'] = recipient or context['email'] or default_test_email

    return dispatch_trigger(
        trigger_slug=template.trigger.slug,
        context=context,
        channel_override=template.channel,
        is_test=True,
        test_recipients=test_recipients
    )
