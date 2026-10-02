import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class WhatsAppService:
    """
    Handles WhatsApp message dispatching via Meta Cloud API Sandbox.
    API Reference: https://developers.facebook.com/docs/whatsapp/cloud-api
    """

    @classmethod
    def send_message(cls, recipient_phone: str, body: str, title: str = "", template_name: str = None) -> dict:
        """
        Sends a WhatsApp message to the specified recipient phone number.
        In Meta Sandbox:
        - Recipient must be in the approved test phone numbers list.
        - Token is temporary (expires frequently).
        - If tokens are missing, returns simulated sandbox response with clear diagnostics.
        """
        import os
        from dotenv import load_dotenv
        load_dotenv(settings.BASE_DIR / '.env', override=True)

        access_token = os.getenv('WHATSAPP_ACCESS_TOKEN', '').strip() or getattr(settings, 'WHATSAPP_ACCESS_TOKEN', '').strip()
        phone_number_id = os.getenv('PHONE_NUMBER_ID', '').strip() or getattr(settings, 'PHONE_NUMBER_ID', '').strip()
        default_test_phone = os.getenv('WHATSAPP_DEFAULT_TEST_PHONE', '').strip()

        # Clean recipient phone number (remove spaces, dashes)
        clean_phone = recipient_phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if clean_phone.startswith('+'):
            clean_phone = clean_phone[1:]
        
        # If user left dummy placeholder, automatically fallback to verified test phone
        if clean_phone in ('1234567890', '') and default_test_phone:
            clean_phone = default_test_phone.replace('+', '').replace(' ', '')

        # Check if live Meta Cloud API keys are provided
        if not access_token or not phone_number_id:
            logger.info("WhatsApp Cloud API credentials not configured in .env. Running in Sandbox Simulation mode.")
            return {
                "status": "simulated",
                "provider": "Meta WhatsApp Cloud API (Simulated Sandbox)",
                "success": True,
                "recipient": clean_phone,
                "message": body,
                "note": "WHATSAPP_ACCESS_TOKEN or PHONE_NUMBER_ID not set in .env. Real API request simulated.",
                "sandbox_guidance": "To send real WhatsApp messages to your phone, set WHATSAPP_ACCESS_TOKEN and PHONE_NUMBER_ID in backend/.env."
            }

        # Format URL for Meta Cloud API v21.0
        url = f"https://graph.facebook.com/v21.0/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

        # Payload construction:
        # If template_name is specified and approved, send template message.
        # Otherwise, send direct text message.
        if template_name and template_name.strip():
            payload = {
                "messaging_product": "whatsapp",
                "to": clean_phone,
                "type": "template",
                "template": {
                    "name": template_name.strip().lower(),
                    "language": {"code": "en_US"}
                }
            }
        else:
            message_text = f"*{title}*\n\n{body}" if title else body
            payload = {
                "messaging_product": "whatsapp",
                "recipient_type": "individual",
                "to": clean_phone,
                "type": "text",
                "text": {
                    "preview_url": False,
                    "body": message_text
                }
            }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=10)
            res_data = response.json() if response.content else {}

            if response.status_code in (200, 201):
                return {
                    "status": "sent",
                    "provider": "Meta WhatsApp Cloud API",
                    "success": True,
                    "http_status": response.status_code,
                    "response": res_data
                }

            # If custom template failed because it's not registered on Meta yet,
            # fallback to Meta Sandbox's default pre-approved 'hello_world' template!
            if template_name and template_name.strip() != 'hello_world':
                fallback_payload = {
                    "messaging_product": "whatsapp",
                    "to": clean_phone,
                    "type": "template",
                    "template": {
                        "name": "hello_world",
                        "language": {"code": "en_US"}
                    }
                }
                fb_res = requests.post(url, headers=headers, json=fallback_payload, timeout=10)
                if fb_res.status_code in (200, 201):
                    return {
                        "status": "sent",
                        "provider": "Meta WhatsApp Cloud API",
                        "success": True,
                        "http_status": fb_res.status_code,
                        "response": fb_res.json(),
                        "note": f"Delivered via Meta Sandbox 'hello_world' template (since '{template_name}' is not yet created in Meta WhatsApp Manager)."
                    }

            error_info = res_data.get('error', {})
            error_msg = error_info.get('message', response.text)
            
            # Specific troubleshooting for recipient not in allowed list
            trouble_tip = ""
            if "not in allowed list" in error_msg.lower() or error_info.get("code") == 131030:
                trouble_tip = f"Phone number +{clean_phone} is not in your Meta Sandbox Allowed Test List. Verified number is {default_test_phone}."
            else:
                trouble_tip = (
                    "Meta Sandbox Tips: (1) Ensure recipient number matches verified number (+919001050074); "
                    "(2) If token expired, regenerate on developers.facebook.com."
                )

            return {
                "status": "failed",
                "provider": "Meta WhatsApp Cloud API",
                "success": False,
                "http_status": response.status_code,
                "error": error_msg,
                "error_details": error_info,
                "troubleshooting": trouble_tip
            }
        except requests.RequestException as exc:
            return {
                "status": "failed",
                "provider": "Meta WhatsApp Cloud API",
                "success": False,
                "error": str(exc),
                "troubleshooting": "Network connection error reaching graph.facebook.com"
            }
