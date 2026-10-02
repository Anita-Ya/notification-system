import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    """
    Handles transactional email delivery supporting:
    - Postmark (Primary service named in assignment)
    - Resend (Modern developer API alternative)
    - Brevo (Generous free tier: 300 emails/day)
    - Sandbox Simulator (Zero-config preview mode when keys aren't set)
    """

    @classmethod
    def send_email(cls, recipient_email: str, subject: str, body: str) -> dict:
        """
        Sends an email using the active provider configured in .env.
        Detects Postmark first, then Resend, then Brevo, or falls back to Simulation.
        """
        import os
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)

        default_test_email = os.getenv('DEFAULT_TEST_EMAIL', 'yanitay1215@gmail.com').strip()
        recipient_email = recipient_email.strip()
        if not recipient_email or recipient_email.endswith('@example.com') or recipient_email in ('N/A', 'test@example.com', 'user@example.com'):
            if default_test_email:
                recipient_email = default_test_email

        if not recipient_email:
            return {
                "status": "failed",
                "provider": "Email Service",
                "success": False,
                "error": "Recipient email address is required"
            }

        postmark_token = os.getenv('POSTMARKAPP_TOKEN', '').strip() or getattr(settings, 'POSTMARKAPP_TOKEN', '').strip()
        postmark_from = os.getenv('POSTMARK_FROM_EMAIL', '').strip() or getattr(settings, 'POSTMARK_FROM_EMAIL', '').strip()
        
        resend_key = os.getenv('RESEND_API_KEY', '').strip() or getattr(settings, 'RESEND_API_KEY', '').strip()
        resend_from = os.getenv('RESEND_FROM_EMAIL', 'onboarding@resend.dev').strip() or getattr(settings, 'RESEND_FROM_EMAIL', 'onboarding@resend.dev').strip()

        brevo_key = os.getenv('BREVO_API_KEY', '').strip() or getattr(settings, 'BREVO_API_KEY', '').strip()
        brevo_from = os.getenv('BREVO_FROM_EMAIL', '').strip() or getattr(settings, 'BREVO_FROM_EMAIL', '').strip()

        html_body = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
            <div style="border-bottom: 2px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin: 0; font-size: 20px;">Notification Alert</h2>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">{body}</p>
            <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; color: #94a3b8; font-size: 12px;">
                Sent via Notification System &bull; Trigger Automated Workflow
            </div>
        </div>
        """

        # 1. Postmark Integration
        if postmark_token and postmark_from:
            return cls._send_via_postmark(recipient_email, subject, body, html_body, postmark_token, postmark_from)

        # 2. Resend Integration
        if resend_key:
            return cls._send_via_resend(recipient_email, subject, body, html_body, resend_key, resend_from)

        # 3. Brevo Integration
        if brevo_key and brevo_from:
            return cls._send_via_brevo(recipient_email, subject, body, html_body, brevo_key, brevo_from)

        # 4. Simulation Mode
        logger.info(f"No email provider keys set. Simulating email send to {recipient_email}")
        return {
            "status": "simulated",
            "provider": "Postmark (Simulated Sandbox)",
            "success": True,
            "recipient": recipient_email,
            "subject": subject,
            "body": body,
            "note": "POSTMARKAPP_TOKEN not set in .env. Email delivery simulated.",
            "sandbox_guidance": "Add POSTMARKAPP_TOKEN and POSTMARK_FROM_EMAIL (or RESEND_API_KEY / BREVO_API_KEY) in .env to deliver real emails."
        }

    @classmethod
    def _send_via_postmark(cls, to_email: str, subject: str, text: str, html: str, token: str, from_email: str) -> dict:
        url = "https://api.postmarkapp.com/email"
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Postmark-Server-Token": token
        }
        payload = {
            "From": from_email,
            "To": to_email,
            "Subject": subject or "Notification System Alert",
            "TextBody": text,
            "HtmlBody": html,
            "MessageStream": "outbound"
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            data = res.json() if res.content else {}
            if res.status_code == 200 and data.get("ErrorCode") == 0:
                return {
                    "status": "sent",
                    "provider": "Postmark",
                    "success": True,
                    "message_id": data.get("MessageID"),
                    "response": data
                }
            return {
                "status": "failed",
                "provider": "Postmark",
                "success": False,
                "http_status": res.status_code,
                "error": data.get("Message", res.text),
                "troubleshooting": "Ensure sender signature is verified in Postmark and token has not expired."
            }
        except requests.RequestException as exc:
            return {
                "status": "failed",
                "provider": "Postmark",
                "success": False,
                "error": str(exc)
            }

    @classmethod
    def _send_via_resend(cls, to_email: str, subject: str, text: str, html: str, api_key: str, from_email: str) -> dict:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject or "Notification Alert",
            "text": text,
            "html": html
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            data = res.json() if res.content else {}
            if res.status_code in (200, 201):
                return {
                    "status": "sent",
                    "provider": "Resend",
                    "success": True,
                    "message_id": data.get("id"),
                    "response": data
                }
            return {
                "status": "failed",
                "provider": "Resend",
                "success": False,
                "http_status": res.status_code,
                "error": data.get("message", res.text)
            }
        except requests.RequestException as exc:
            return {
                "status": "failed",
                "provider": "Resend",
                "success": False,
                "error": str(exc)
            }

    @classmethod
    def _send_via_brevo(cls, to_email: str, subject: str, text: str, html: str, api_key: str, from_email: str) -> dict:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": api_key,
            "Content-Type": "application/json"
        }
        payload = {
            "sender": {"email": from_email, "name": "Notification System"},
            "to": [{"email": to_email}],
            "subject": subject or "Notification Alert",
            "textContent": text,
            "htmlContent": html
        }
        try:
            res = requests.post(url, headers=headers, json=payload, timeout=10)
            data = res.json() if res.content else {}
            if res.status_code in (200, 201):
                return {
                    "status": "sent",
                    "provider": "Brevo",
                    "success": True,
                    "response": data
                }
            return {
                "status": "failed",
                "provider": "Brevo",
                "success": False,
                "http_status": res.status_code,
                "error": data.get("message", res.text)
            }
        except requests.RequestException as exc:
            return {
                "status": "failed",
                "provider": "Brevo",
                "success": False,
                "error": str(exc)
            }
