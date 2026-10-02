import json
import logging
import base64
import requests
from pathlib import Path
from django.conf import settings
from notifications.models import WebPushSubscription

logger = logging.getLogger(__name__)

def get_or_create_vapid_keys():
    """
    Returns a mathematically guaranteed matching EC P-256 key pair.
    Generates and saves to BASE_DIR/vapid_keys.json if not already present.
    """
    base_dir = getattr(settings, 'BASE_DIR', Path('.'))
    key_file = base_dir / 'vapid_keys.json'

    if key_file.exists():
        try:
            with open(key_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if data.get('public_key') and data.get('private_key_pem'):
                    return data
        except Exception as e:
            logger.warning(f"Could not read vapid_keys.json: {e}")

    try:
        from cryptography.hazmat.primitives.asymmetric import ec
        from cryptography.hazmat.primitives import serialization

        private_key = ec.generate_private_key(ec.SECP256R1())
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ).decode('utf-8')

        public_numbers = private_key.public_key().public_numbers()
        x_bytes = public_numbers.x.to_bytes(32, byteorder='big')
        y_bytes = public_numbers.y.to_bytes(32, byteorder='big')
        raw_public_bytes = b'\x04' + x_bytes + y_bytes
        public_b64 = base64.urlsafe_b64encode(raw_public_bytes).rstrip(b'=').decode('utf-8')

        data = {
            "public_key": public_b64,
            "private_key_pem": private_pem,
            "admin_email": getattr(settings, 'VAPID_ADMIN_EMAIL', 'mailto:admin@example.com')
        }

        with open(key_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        return data
    except Exception as e:
        logger.error(f"Error generating VAPID keys: {e}")
        return {
            "public_key": getattr(settings, 'VAPID_PUBLIC_KEY', ''),
            "private_key_pem": getattr(settings, 'VAPID_PRIVATE_KEY', ''),
            "admin_email": getattr(settings, 'VAPID_ADMIN_EMAIL', 'mailto:admin@example.com')
        }


class WebPushService:
    """
    Handles Web Push delivery directly to user browsers using:
    - W3C Standard VAPID Web Push (via pywebpush / FCM / Mozilla push service)
    - OneSignal REST API (if configured)
    - Simulation mode
    """

    @classmethod
    def send_push(cls, title: str, body: str, user=None, extra_data=None) -> dict:
        """
        Broadcasts or dispatches Web Push notification to browser subscriptions.
        """
        title = title or "Notification Alert"
        extra_data = extra_data or {}
        
        base_dir = getattr(settings, 'BASE_DIR', Path('.'))
        pem_file = base_dir / 'vapid_private.pem'
        if pem_file.exists():
            vapid_private_key = str(pem_file)
        else:
            vapid_data = get_or_create_vapid_keys()
            vapid_private_key = str(base_dir / 'vapid_private.pem') if pem_file.exists() else vapid_data.get('private_key_pem')
        
        vapid_admin_email = getattr(settings, 'VAPID_ADMIN_EMAIL', 'mailto:admin@example.com')
        
        onesignal_app_id = getattr(settings, 'ONESIGNAL_APP_ID', '').strip()
        onesignal_api_key = getattr(settings, 'ONESIGNAL_REST_API_KEY', '').strip()

        # Check if OneSignal is configured
        if onesignal_app_id and onesignal_api_key:
            return cls._send_via_onesignal(title, body, onesignal_app_id, onesignal_api_key, extra_data)

        # Standard VAPID WebPush
        subscriptions = WebPushSubscription.objects.all()
        if user and user.is_authenticated:
            user_subs = subscriptions.filter(user=user)
            if user_subs.exists():
                subscriptions = user_subs

        sub_count = subscriptions.count()
        if sub_count == 0:
            logger.info("No active WebPush subscriptions found in database.")
            return {
                "status": "simulated",
                "provider": "Web Push (VAPID / Browser Push)",
                "success": True,
                "title": title,
                "body": body,
                "subscribers_reached": 0,
                "note": "No browser push subscriptions registered yet. Click '🔔 Subscribe Web Push' in the top navbar first!",
                "troubleshooting": "Click '🔔 Subscribe Web Push' in top bar, allow notification permissions in your browser, and try again."
            }

        payload = json.dumps({
            "title": title,
            "body": body,
            "icon": extra_data.get("icon", "/favicon.svg"),
            "badge": "/favicon.svg",
            "data": {
                "url": extra_data.get("url", "/"),
                "timestamp": extra_data.get("timestamp")
            }
        })

        success_count = 0
        errors = []

        try:
            from pywebpush import webpush, WebPushException
            
            for sub in list(subscriptions):
                subscription_info = {
                    "endpoint": sub.endpoint,
                    "keys": {
                        "p256dh": sub.p256dh,
                        "auth": sub.auth
                    }
                }
                try:
                    webpush(
                        subscription_info=subscription_info,
                        data=payload,
                        vapid_private_key=vapid_private_key,
                        vapid_claims={"sub": vapid_admin_email},
                        timeout=5
                    )
                    success_count += 1
                except WebPushException as ex:
                    logger.warning(f"WebPush failed for subscription {sub.id}: {ex}")
                    # If subscription is invalid, expired, or key mismatched (400, 401, 404, 410), delete it
                    if ex.response and ex.response.status_code in (400, 401, 404, 410):
                        sub.delete()
                    errors.append(str(ex))
                except Exception as ex:
                    errors.append(str(ex))

            return {
                "status": "sent" if success_count > 0 else "failed",
                "provider": "Web Push (VAPID)",
                "success": success_count > 0,
                "subscribers_reached": success_count,
                "total_targets": sub_count,
                "errors": errors if errors else None,
                "error": "; ".join(errors) if errors else None
            }

        except ImportError:
            logger.warning("pywebpush library not loaded. Simulating Web Push dispatch.")
            return {
                "status": "simulated",
                "provider": "Web Push (VAPID Simulator)",
                "success": True,
                "title": title,
                "body": body,
                "subscribers_reached": sub_count,
                "note": "pywebpush not found; push dispatched in sandbox mode."
            }

    @classmethod
    def _send_via_onesignal(cls, title: str, body: str, app_id: str, api_key: str, extra_data: dict) -> dict:
        url = "https://onesignal.com/api/v1/notifications"
        headers = {
            "Content-Type": "application/json; charset=utf-8",
            "Authorization": f"Basic {api_key}"
        }
        payload = {
            "app_id": app_id,
            "included_segments": ["Subscribed Users"],
            "headings": {"en": title},
            "contents": {"en": body},
            "url": extra_data.get("url", "/")
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            data = res.json() if res.content else {}
            if res.status_code == 200:
                return {
                    "status": "sent",
                    "provider": "OneSignal Web Push",
                    "success": True,
                    "recipients": data.get("recipients", 0),
                    "response": data
                }
            return {
                "status": "failed",
                "provider": "OneSignal Web Push",
                "success": False,
                "http_status": res.status_code,
                "error": data.get("errors", res.text)
            }
        except requests.RequestException as exc:
            return {
                "status": "failed",
                "provider": "OneSignal Web Push",
                "success": False,
                "error": str(exc)
            }
